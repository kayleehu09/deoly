import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { cleanupAvatars } from "../lib/avatars.js";
import { copyVerifiedAvatar, deleteAvatarObject, createPostImageReadUrl } from "../lib/storage.js";
import { ApiError } from "../lib/errors.js";

vi.mock("../lib/prisma.js", async () => {
  const { PrismaClient } = await import("@prisma/client");
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const directory = mkdtempSync(join(tmpdir(), "deoly-profile-tests-"));
  return { prisma: new PrismaClient({ datasources: { db: { url: `file:${directory}/test.db` } } }), directory };
});
vi.mock("../lib/storage.js", async (importOriginal) => ({
  ...await importOriginal<typeof import("../lib/storage.js")>(),
  createPostImageReadUrl: vi.fn(async (key: string) => `https://private.example/${key}?signature=${Math.random()}`),
  createAvatarImageUpload: vi.fn(async (userId: string, contentType: string) => ({
    objectKey: `users/${userId}/avatars/uploads/${Math.random()}.jpg`,
    uploadUrl: "https://upload.example/avatar", expiresAt: new Date(Date.now() + 300000).toISOString(),
    headers: { "content-type": contentType }
  })),
  copyVerifiedAvatar: vi.fn(async () => undefined),
  deleteAvatarObject: vi.fn(async () => undefined)
}));

const app = createApp();
let owner: { id: string; token: string };
let friend: { id: string; token: string };
let stranger: { id: string; token: string };
let postId: string;
let directory: string;
const patch = (body: object, token = owner.token) => request(app).patch("/me").set("authorization", `Bearer ${token}`).send(body);
const get = (path: string, token = owner.token) => request(app).get(path).set("authorization", `Bearer ${token}`);

beforeAll(async () => {
  directory = (await import("../lib/prisma.js") as unknown as { directory: string }).directory;
  writeFileSync(`${directory}/test.db`, "");
  execFileSync(process.execPath, [fileURLToPath(new URL("../../../../node_modules/prisma/build/index.js", import.meta.url)),
    "migrate", "deploy", "--schema", fileURLToPath(new URL("../../prisma/schema.prisma", import.meta.url))],
    { env: { ...process.env, DATABASE_URL: `file:${directory}/test.db` }, stdio: "pipe" });
}, 30000);

beforeEach(async () => {
  vi.clearAllMocks();
  vi.mocked(copyVerifiedAvatar).mockResolvedValue(undefined);
  vi.mocked(deleteAvatarObject).mockResolvedValue(undefined);
  await prisma.user.deleteMany();
  await prisma.avatarUpload.deleteMany();
  async function signup(username: string) {
    const result = await request(app).post('/auth/signup').send({ displayName: username, username, email: `${username}@test.example`, password: 'password123' });
    expect(result.status).toBe(201);
    return { id: result.body.user.id as string, token: result.body.session.token as string };
  }
  owner = await signup('owner');
  friend = await signup('friend');
  stranger = await signup('stranger');
  await prisma.friendship.create({ data: { requesterId: owner.id, addresseeId: friend.id, status: 'ACCEPTED' } });
  const post = await prisma.post.create({ data: { authorId: owner.id, body: 'A deoly', expiresAt: new Date(Date.now() + 86400000) } });
  postId = post.id;
  await prisma.comment.create({ data: { authorId: owner.id, postId, body: 'Hello' } });
  await prisma.reaction.create({ data: { userId: owner.id, postId, emoji: '❤️' } });
  await prisma.activityNotification.create({ data: { actorId: owner.id, recipientId: friend.id, type: 'POST_COMMENT', postId } });
});

afterAll(async () => { await prisma.$disconnect(); if (directory) rmSync(directory, { recursive: true, force: true }); });

async function upload(token = owner.token) {
  const response = await request(app).post('/media/avatar-uploads').set('authorization', `Bearer ${token}`).send({ contentType: 'image/jpeg', byteSize: 500 });
  expect(response.status).toBe(201);
  return response.body.objectKey as string;
}
async function savePhoto() {
  const result = await patch({ avatarObjectKey: await upload() });
  expect(result.status).toBe(200);
  return (await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).avatarObjectKey!;
}

describe('Profile editing with a real database', () => {
  it('requires authentication for edits, profiles and avatar uploads', async () => {
    expect((await request(app).patch('/me').send({ bio: 'Hi' })).status).toBe(401);
    expect((await request(app).get(`/users/${owner.id}`)).status).toBe(401);
    expect((await request(app).post('/media/avatar-uploads').send({})).status).toBe(401);
  });

  it('normalizes text, preserves omitted fields, clears bio, and persists through login', async () => {
    expect((await patch({ displayName: ' New Name ', username: ' NEW_Name ', bio: ' line one\nline two ' })).status).toBe(200);
    const me = await get('/me');
    expect(me.body.user).toMatchObject({ displayName: 'New Name', username: 'new_name', bio: 'line one\nline two' });
    expect((await patch({ username: 'NEW_NAME' })).status).toBe(200);
    expect((await patch({ bio: '  ' })).body.user).toMatchObject({ displayName: 'New Name', username: 'new_name', bio: null });
    const login = await request(app).post('/auth/login').send({ email: 'owner@test.example', password: 'password123' });
    expect(login.status).toBe(200);
    expect(login.body.user.username).toBe('new_name');
  });

  it.each([{ displayName: 'x' }, { displayName: 'x'.repeat(41) }, { username: 'ab' }, { username: 'x'.repeat(25) }, { username: 'bad.name' }, { bio: 'x'.repeat(161) }, { email: 'change@test.example' }, {}])('rejects invalid edits without partial writes: %j', async (input) => {
    expect((await patch(input)).status).toBe(400);
    expect((await get('/me')).body.user.displayName).toBe('owner');
  });

  it('accepts field boundaries and explicit null bio', async () => {
    expect((await patch({ displayName: 'x'.repeat(40), username: 'x'.repeat(24), bio: 'x'.repeat(160) })).status).toBe(200);
    expect((await patch({ bio: null })).body.user.bio).toBeNull();
  });

  it('rejects case-insensitive username conflicts on both signup and editing', async () => {
    const conflict = await patch({ displayName: 'Should not change', username: 'FRIEND' });
    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe('USERNAME_TAKEN');
    expect((await get('/me')).body.user.displayName).toBe('owner');
    const signup = await request(app).post('/auth/signup').send({ displayName: 'Duplicate', username: 'OWNER', email: 'different@test.example', password: 'password123' });
    expect(signup.status).toBe(409);
  });

  it('lets only one concurrent request claim a username', async () => {
    const responses = await Promise.all([patch({ username: 'same_name' }), patch({ username: 'same_name' }, stranger.token)]);
    expect(responses.map((result) => result.status).sort()).toEqual([200, 409]);
    expect(await prisma.user.count({ where: { username: 'same_name' } })).toBe(1);
  });

  it('returns only public fields to signed-in nonfriends, and blocks both directions', async () => {
    await patch({ bio: 'My bio' });
    const response = await get(`/users/${owner.id}`, stranger.token);
    expect(response.status).toBe(200);
    expect(Object.keys(response.body.user).sort()).toEqual(['avatarUrl', 'bio', 'displayName', 'id', 'username']);
    expect(response.body.user.bio).toBe('My bio');
    await prisma.block.create({ data: { blockerId: owner.id, blockedId: stranger.id } });
    expect((await get(`/users/${owner.id}`, stranger.token)).status).toBe(404);
    expect((await get(`/users/${stranger.id}`)).status).toBe(404);
    expect((await get('/users/not-a-user')).status).toBe(404);
  });

  it('preserves relationships and updates identity across feed, comments, friends, search, reactions and activity', async () => {
    const key = await savePhoto();
    await patch({ displayName: 'New Person', username: 'new_person' });
    const feed = await get('/feed', friend.token);
    expect(feed.body.items[0].author).toMatchObject({ id: owner.id, username: 'new_person' });
    expect(feed.body.items[0].author.avatarUrl).toContain(key);
    expect(feed.body.items[0].recentComments[0].author.username).toBe('new_person');
    expect((await get('/friends', friend.token)).body.friends[0].user.username).toBe('new_person');
    expect((await get('/users/search?q=new_person', stranger.token)).body.users[0].avatarUrl).toContain(key);
    expect((await get(`/posts/${postId}/reactions`, friend.token)).body.groups[0].users[0].username).toBe('new_person');
    expect((await get('/activity', friend.token)).body.items[0].actor.avatarUrl).toContain(key);
    expect(await prisma.friendship.count()).toBe(1);
    expect(await prisma.post.count()).toBe(1);
    expect(await prisma.comment.count()).toBe(1);
    expect(await prisma.reaction.count()).toBe(1);
  });

  it('rejects unsupported and oversized upload intents and unowned, expired or invented keys', async () => {
    for (const body of [{ contentType: 'text/html', byteSize: 10 }, { contentType: 'image/jpeg', byteSize: 8388609 }, { contentType: 'image/jpeg', byteSize: 0 }]) {
      expect((await request(app).post('/media/avatar-uploads').set('authorization', `Bearer ${owner.token}`).send(body)).status).toBe(400);
    }
    expect((await patch({ avatarObjectKey: await upload(friend.token) })).status).toBe(400);
    expect((await patch({ avatarObjectKey: `users/${owner.id}/avatars/uploads/invented.jpg` })).status).toBe(400);
    const key = await upload();
    await prisma.avatarUpload.update({ where: { objectKey: key }, data: { deleteAfter: new Date(0) } });
    expect((await patch({ avatarObjectKey: key })).status).toBe(400);
    expect(copyVerifiedAvatar).not.toHaveBeenCalled();
  });

  it('preserves the previous profile if object validation fails', async () => {
    const current = await savePhoto();
    vi.mocked(copyVerifiedAvatar).mockRejectedValueOnce(new ApiError(400, 'INVALID_AVATAR', 'Invalid image'));
    expect((await patch({ displayName: 'Do not save', avatarObjectKey: await upload() })).status).toBe(400);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: owner.id } });
    expect(user.displayName).toBe('owner');
    expect(user.avatarObjectKey).toBe(current);
  });

  it('uses immutable saved keys, keeps private keys out of responses and refreshes read links', async () => {
    const inputKey = await upload();
    const response = await patch({ avatarObjectKey: inputKey });
    expect(response.status).toBe(200);
    expect(response.body.user.avatarObjectKey).toBeUndefined();
    const key = (await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).avatarObjectKey!;
    expect(key).toContain('/avatars/saved/');
    expect(key).not.toBe(inputKey);
    expect(copyVerifiedAvatar).toHaveBeenCalledWith(inputKey, key);
    const fresh = await get('/me');
    expect(fresh.body.user.avatarUrl).not.toBe(response.body.user.avatarUrl);
  });

  it('retains legacy avatars until explicitly removed', async () => {
    await prisma.user.update({ where: { id: owner.id }, data: { avatarUrl: 'https://legacy.example/avatar.jpg' } });
    expect((await patch({ bio: 'Hello' })).body.user.avatarUrl).toBe('https://legacy.example/avatar.jpg');
    expect((await patch({ avatarObjectKey: null })).body.user.avatarUrl).toBeNull();
  });

  it('never issues a fresh photo link to a blocked viewer, including the blocked list', async () => {
    await savePhoto();
    await prisma.block.create({ data: { blockerId: friend.id, blockedId: owner.id } });
    vi.mocked(createPostImageReadUrl).mockClear();
    expect((await get(`/users/${owner.id}`, friend.token)).status).toBe(404);
    expect((await get('/safety/blocks', friend.token)).body.blocks[0].user.avatarUrl).toBeNull();
    expect((await get('/activity', friend.token)).body.items[0].actor.avatarUrl).toBeNull();
    expect(createPostImageReadUrl).not.toHaveBeenCalled();
  });

  it('cleans replacements, removals and abandoned uploads while preserving active photos', async () => {
    const first = await savePhoto();
    const second = await savePhoto();
    const abandoned = await upload();
    await prisma.avatarUpload.update({ where: { objectKey: abandoned }, data: { deleteAfter: new Date(0) } });
    await cleanupAvatars();
    expect(deleteAvatarObject).toHaveBeenCalledWith(first);
    expect(deleteAvatarObject).toHaveBeenCalledWith(abandoned);
    expect(deleteAvatarObject).not.toHaveBeenCalledWith(second);
    expect((await patch({ avatarObjectKey: null })).body.user.avatarUrl).toBeNull();
    await cleanupAvatars();
    expect(deleteAvatarObject).toHaveBeenCalledWith(second);
  });

  it('keeps cleanup records after account deletion and retries storage failures', async () => {
    const key = await savePhoto();
    const friendPost = await prisma.post.create({
      data: {
        authorId: friend.id,
        body: 'Friend post survives owner deletion.',
        expiresAt: new Date(Date.now() + 86400000)
      }
    });
    await prisma.comment.create({ data: { authorId: owner.id, postId: friendPost.id, body: 'Owner comment on friend post' } });
    await prisma.reaction.create({ data: { userId: owner.id, postId: friendPost.id, emoji: '🔥' } });
    expect((await request(app).delete('/auth/account').set('authorization', `Bearer ${owner.token}`)).status).toBe(204);
    expect((await get('/me')).status).toBe(401);
    expect(await prisma.user.findUnique({ where: { id: owner.id } })).toBeNull();
    expect(await prisma.session.count({ where: { userId: owner.id } })).toBe(0);
    expect(await prisma.friendship.count({
      where: {
        OR: [{ requesterId: owner.id }, { addresseeId: owner.id }]
      }
    })).toBe(0);
    expect(await prisma.post.count({ where: { authorId: owner.id } })).toBe(0);
    expect(await prisma.post.findUnique({ where: { id: friendPost.id } })).not.toBeNull();
    expect(await prisma.comment.count({ where: { authorId: owner.id } })).toBe(0);
    expect(await prisma.reaction.count({ where: { userId: owner.id } })).toBe(0);
    expect(await prisma.activityNotification.count({
      where: {
        OR: [{ actorId: owner.id }, { recipientId: owner.id }]
      }
    })).toBe(0);
    expect((await get('/users/search?q=owner', friend.token)).body.users).toEqual([]);
    expect((await get('/friends', friend.token)).body.friends).toEqual([]);
    expect((await get('/feed', friend.token)).body.items).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          author: expect.objectContaining({ id: owner.id })
        })
      ])
    );
    vi.mocked(deleteAvatarObject).mockRejectedValueOnce(new Error('offline'));
    await cleanupAvatars();
    expect((await prisma.avatarUpload.findUniqueOrThrow({ where: { objectKey: key } })).state).toBe('DELETING');
    await prisma.avatarUpload.update({ where: { objectKey: key }, data: { deleteAfter: new Date(0) } });
    await cleanupAvatars();
    expect(await prisma.avatarUpload.findUnique({ where: { objectKey: key } })).toBeNull();
    expect(deleteAvatarObject).toHaveBeenCalledTimes(2);
  });

  it('protects an attached avatar even if its cleanup record is mistakenly pending', async () => {
    const key = await savePhoto();
    await prisma.avatarUpload.update({ where: { objectKey: key }, data: { state: 'PENDING', deleteAfter: new Date(0) } });
    await cleanupAvatars();
    expect(deleteAvatarObject).not.toHaveBeenCalled();
  });
});
