import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(async (password: string) => password === "password123"),
    hash: vi.fn(async () => "hashed-password")
  }
}));

vi.mock("../lib/storage.js", () => ({
  ALLOWED_IMAGE_CONTENT_TYPES: ["image/jpeg", "image/png", "image/webp"],
  MAX_IMAGE_UPLOAD_BYTES: 8 * 1024 * 1024,
  createPostImageReadUrl: vi.fn(async (objectKey: string) => `https://photos.example.test/${objectKey}`),
  createPostImageUpload: vi.fn(async ({ userId, contentType }: { userId: string; contentType: string }) => ({
    objectKey: `users/${userId}/posts/test-photo.${contentType.split("/")[1]}`,
    uploadUrl: "https://upload.example.test/photo",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    headers: {
      "content-type": contentType
    }
  })),
  isAllowedImageContentType: (contentType: string) => ["image/jpeg", "image/png", "image/webp"].includes(contentType),
  isPostImageObjectKeyForUser: (objectKey: string, userId: string) => objectKey.startsWith(`users/${userId}/posts/`)
}));

vi.mock("../lib/prisma.js", () => {
  const now = new Date();
  const hour = 60 * 60 * 1000;
  const users = [
    {
      id: "user_ava",
      email: "ava@example.com",
      username: "avafaith",
      displayName: "Ava Grace",
      passwordHash: "$2a$10$LGg1tWmS0CDm4cG6S.qF2O4rNc80d3V8bB0G0m5fY6GxVyLxA0xka",
      bio: null,
      avatarUrl: null,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "ckvvy6f5e000001l6b9fh9a3x",
      email: "noah@example.com",
      username: "noahlight",
      displayName: "Noah James",
      passwordHash: "$2a$10$LGg1tWmS0CDm4cG6S.qF2O4rNc80d3V8bB0G0m5fY6GxVyLxA0xka",
      bio: null,
      avatarUrl: null,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "ckvvy8r2k000101l68v2ud6mm",
      email: "mia@example.com",
      username: "miaprays",
      displayName: "Mia Rose",
      passwordHash: "$2a$10$LGg1tWmS0CDm4cG6S.qF2O4rNc80d3V8bB0G0m5fY6GxVyLxA0xka",
      bio: null,
      avatarUrl: null,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "ckvvy9x8s000201l60o3k67rw",
      email: "leah@example.com",
      username: "leahhope",
      displayName: "Leah Hope",
      passwordHash: "$2a$10$LGg1tWmS0CDm4cG6S.qF2O4rNc80d3V8bB0G0m5fY6GxVyLxA0xka",
      bio: null,
      avatarUrl: null,
      createdAt: now,
      updatedAt: now
    }
  ];
  const sessions: Array<{ token: string; userId: string; expiresAt: Date }> = [];
  const friendships: Array<{
    id: string;
    requesterId: string;
    addresseeId: string;
    status: string;
    createdAt: Date;
    acceptedAt: Date | null;
    requester?: { id: string; displayName: string; username: string; avatarUrl: string | null };
    addressee?: { id: string; displayName: string; username: string; avatarUrl: string | null };
  }> = [
    {
      id: "friend_1",
      requesterId: "user_ava",
      addresseeId: "ckvvy6f5e000001l6b9fh9a3x",
      status: "ACCEPTED",
      createdAt: now,
      acceptedAt: now,
      requester: { id: "user_ava", displayName: "Ava Grace", username: "avafaith", avatarUrl: null },
      addressee: { id: "ckvvy6f5e000001l6b9fh9a3x", displayName: "Noah James", username: "noahlight", avatarUrl: null }
    },
    {
      id: "friend_pending",
      requesterId: "ckvvy6f5e000001l6b9fh9a3x",
      addresseeId: "user_ava",
      status: "PENDING",
      createdAt: now,
      acceptedAt: null,
      requester: { id: "ckvvy6f5e000001l6b9fh9a3x", displayName: "Noah James", username: "noahlight", avatarUrl: null },
      addressee: { id: "user_ava", displayName: "Ava Grace", username: "avafaith", avatarUrl: null }
    },
    {
      id: "friend_decline",
      requesterId: "ckvvy9x8s000201l60o3k67rw",
      addresseeId: "user_ava",
      status: "PENDING",
      createdAt: now,
      acceptedAt: null,
      requester: { id: "ckvvy9x8s000201l60o3k67rw", displayName: "Leah Hope", username: "leahhope", avatarUrl: null },
      addressee: { id: "user_ava", displayName: "Ava Grace", username: "avafaith", avatarUrl: null }
    }
  ];
  const posts = [
    {
      id: "post_self_new",
      authorId: "user_ava",
      body: "My newest prayer update.",
      imageObjectKey: "users/user_ava/posts/self-new.jpg",
      kind: "DEOLY",
      visibility: "FRIENDS",
      expiresAt: new Date(now.getTime() + 23 * hour),
      createdAt: new Date(now.getTime() - hour),
      updatedAt: new Date(now.getTime() - hour),
      author: { id: "user_ava", displayName: "Ava Grace", username: "avafaith", avatarUrl: null },
      reactions: [],
      comments: []
    },
    {
      id: "post_1",
      authorId: "ckvvy6f5e000001l6b9fh9a3x",
      body: "Pray for my test tomorrow.",
      imageObjectKey: "users/ckvvy6f5e000001l6b9fh9a3x/posts/friend.jpg",
      kind: "DEOLY",
      visibility: "FRIENDS",
      expiresAt: new Date(now.getTime() + 22 * hour),
      createdAt: new Date(now.getTime() - 2 * hour),
      updatedAt: new Date(now.getTime() - 2 * hour),
      author: { id: "ckvvy6f5e000001l6b9fh9a3x", displayName: "Noah James", username: "noahlight", avatarUrl: null },
      reactions: [{ emoji: "🙏", userId: "user_ava" }],
      comments: []
    },
    {
      id: "post_friend_permanent",
      authorId: "ckvvy6f5e000001l6b9fh9a3x",
      body: "A permanent prayer record.",
      imageObjectKey: null,
      kind: "PERMANENT",
      visibility: "FRIENDS",
      expiresAt: null,
      createdAt: new Date(now.getTime() - 3 * hour),
      updatedAt: new Date(now.getTime() - 3 * hour),
      author: { id: "ckvvy6f5e000001l6b9fh9a3x", displayName: "Noah James", username: "noahlight", avatarUrl: null },
      reactions: [],
      comments: []
    },
    {
      id: "post_self_expired",
      authorId: "user_ava",
      body: "Expired deoly should stay out of the home feed.",
      imageObjectKey: "users/user_ava/posts/expired.jpg",
      kind: "DEOLY",
      visibility: "FRIENDS",
      expiresAt: new Date(now.getTime() - 2 * 24 * hour),
      createdAt: new Date(now.getTime() - 3 * 24 * hour),
      updatedAt: new Date(now.getTime() - 3 * 24 * hour),
      author: { id: "user_ava", displayName: "Ava Grace", username: "avafaith", avatarUrl: null },
      reactions: [],
      comments: []
    },
    {
      id: "post_non_friend",
      authorId: "ckvvy8r2k000101l68v2ud6mm",
      body: "This should stay out of Ava's feed.",
      imageObjectKey: "users/ckvvy8r2k000101l68v2ud6mm/posts/non-friend.jpg",
      kind: "DEOLY",
      visibility: "FRIENDS",
      expiresAt: new Date(now.getTime() + 23.5 * hour),
      createdAt: new Date(now.getTime() - 30 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
      author: { id: "ckvvy8r2k000101l68v2ud6mm", displayName: "Mia Rose", username: "miaprays", avatarUrl: null },
      reactions: [],
      comments: []
    }
  ];

  return {
    prisma: {
      user: {
        findFirst: vi.fn(async ({ where }) => users.find((user) => user.email === where?.OR?.[0]?.email || user.username === where?.OR?.[1]?.username) ?? null),
        findUnique: vi.fn(async ({ where }) => users.find((user) => user.email === where.email || user.id === where.id) ?? null),
        create: vi.fn(async ({ data }) => {
          const user = { ...data, id: "user_new", bio: null, avatarUrl: null, createdAt: now, updatedAt: now };
          users.push(user as never);
          return user;
        }),
        delete: vi.fn(async ({ where }) => {
          const index = users.findIndex((user) => user.id === where.id);
          const [deleted] = index >= 0 ? users.splice(index, 1) : [];
          return deleted;
        }),
        findMany: vi.fn(async ({ where, take } = {}) => {
          const query = where?.OR?.[0]?.displayName?.contains ?? where?.OR?.[1]?.username?.contains ?? "";
          const normalizedQuery = String(query).toLowerCase();
          const filteredUsers = users.filter((user) => {
            const matchesViewer = !where?.id?.not || user.id !== where.id.not;
            const matchesQuery =
              !normalizedQuery ||
              user.displayName.toLowerCase().includes(normalizedQuery) ||
              user.username.toLowerCase().includes(normalizedQuery);

            return matchesViewer && matchesQuery;
          });

          return filteredUsers
            .slice(0, take ?? filteredUsers.length)
            .map((user) => ({ id: user.id, displayName: user.displayName, username: user.username, avatarUrl: user.avatarUrl }));
        })
      },
      session: {
        create: vi.fn(async ({ data }) => {
          sessions.push(data);
          return data;
        }),
        findUnique: vi.fn(async ({ where }) => {
          const session = sessions.find((entry) => entry.token === where.token);
          if (!session) {
            return null;
          }
          return {
            ...session,
            user: users.find((user) => user.id === session.userId)
          };
        }),
        deleteMany: vi.fn(async ({ where }) => {
          const index = sessions.findIndex((entry) => entry.token === where.token);
          if (index >= 0) {
            sessions.splice(index, 1);
          }
          return { count: 1 };
        })
      },
      friendship: {
        findMany: vi.fn(async ({ where } = {}) => {
          return friendships.filter((friendship) => {
            const matchesStatus = !where?.status || friendship.status === where.status;
            const matchesParticipant =
              !where?.OR ||
              where.OR.some(
                (condition: { requesterId?: string; addresseeId?: string }) =>
                  (!condition.requesterId || friendship.requesterId === condition.requesterId) &&
                  (!condition.addresseeId || friendship.addresseeId === condition.addresseeId)
              );

            return matchesStatus && matchesParticipant;
          });
        }),
        findFirst: vi.fn(async ({ where }) => {
          if (!where?.OR) {
            return friendships[0] ?? null;
          }

          return (
            friendships.find((friendship) =>
              where.OR.some(
                (condition: { requesterId?: string; addresseeId?: string; status?: string }) =>
                  friendship.requesterId === condition.requesterId &&
                  friendship.addresseeId === condition.addresseeId &&
                  (!condition.status || friendship.status === condition.status)
              )
            ) ?? null
          );
        }),
        create: vi.fn(async ({ data }) => {
          const requester = users.find((user) => user.id === data.requesterId);
          const addressee = users.find((user) => user.id === data.addresseeId);
          const friendship = {
            id: "friend_new",
            createdAt: now,
            acceptedAt: null,
            requesterId: data.requesterId,
            addresseeId: data.addresseeId,
            status: data.status,
            requester: requester
              ? { id: requester.id, displayName: requester.displayName, username: requester.username, avatarUrl: requester.avatarUrl }
              : undefined,
            addressee: addressee
              ? { id: addressee.id, displayName: addressee.displayName, username: addressee.username, avatarUrl: addressee.avatarUrl }
              : undefined
          };
          friendships.push(friendship);
          return friendship;
        }),
        findUnique: vi.fn(async ({ where }) => friendships.find((entry) => entry.id === where.id) ?? null),
        update: vi.fn(async ({ where, data }) => {
          const friendship = friendships.find((entry) => entry.id === where.id);
          if (friendship) {
            Object.assign(friendship, data);
          }
          return friendship;
        }),
        delete: vi.fn(async ({ where }) => {
          const index = friendships.findIndex((entry) => entry.id === where.id);
          const [deleted] = index >= 0 ? friendships.splice(index, 1) : [];
          return deleted;
        })
      },
      post: {
        findMany: vi.fn(async ({ where, orderBy } = {}) => {
          const matchesWhere = (post: (typeof posts)[number], condition: typeof where): boolean => {
            if (!condition) {
              return true;
            }

            const matchesAuthorIn = !condition.authorId?.in || condition.authorId.in.includes(post.authorId);
            const matchesAuthor = !condition.authorId || typeof condition.authorId !== "string" || post.authorId === condition.authorId;
            const matchesKind = !condition.kind || post.kind === condition.kind;
            const matchesCreatedAt = !condition.createdAt?.gte || post.createdAt >= condition.createdAt.gte;
            const matchesExpiration = !condition.expiresAt?.gt || (post.expiresAt && post.expiresAt > condition.expiresAt.gt);
            const matchesOr = !condition.OR || condition.OR.some((item: typeof where) => matchesWhere(post, item));

            return Boolean(matchesAuthorIn && matchesAuthor && matchesKind && matchesCreatedAt && matchesExpiration && matchesOr);
          };

          const filteredPosts = posts.filter((post) => matchesWhere(post, where));

          if (orderBy?.createdAt === "desc") {
            return [...filteredPosts].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
          }

          return filteredPosts;
        }),
        create: vi.fn(async ({ data }) => ({
          id: "post_new",
          createdAt: now,
          updatedAt: now,
          author: { id: "user_ava", displayName: "Ava Grace", username: "avafaith", avatarUrl: null },
          reactions: [],
          comments: [],
          ...data,
          imageObjectKey: data.imageObjectKey ?? null
        })),
        findUnique: vi.fn(async ({ where }) => posts.find((post) => post.id === where.id) ?? null)
      },
      reaction: {
        upsert: vi.fn(async () => ({})),
        deleteMany: vi.fn(async () => ({ count: 1 }))
      },
      comment: {
        create: vi.fn(async ({ data }) => ({
          id: "comment_1",
          createdAt: now,
          updatedAt: now,
          author: { id: "user_ava", displayName: "Ava Grace", username: "avafaith", avatarUrl: null },
          ...data
        }))
      }
    }
  };
});

describe("Sanctuary API", () => {
  const app = createApp();
  let token = "";
  let noahToken = "";
  let miaToken = "";

  beforeAll(async () => {
    const login = await request(app).post("/auth/login").send({
      email: "ava@example.com",
      password: "password123"
    });
    const noahLogin = await request(app).post("/auth/login").send({
      email: "noah@example.com",
      password: "password123"
    });
    const miaLogin = await request(app).post("/auth/login").send({
      email: "mia@example.com",
      password: "password123"
    });
    token = login.body.session.token;
    noahToken = noahLogin.body.session.token;
    miaToken = miaLogin.body.session.token;
  });

  it("logs in successfully", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "ava@example.com",
      password: "password123"
    });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("ava@example.com");
  });

  it("rejects unauthenticated feed access", async () => {
    const response = await request(app).get("/feed");
    expect(response.status).toBe(401);
  });

  it("creates deolys with a 24 hour expiration time", async () => {
    const response = await request(app)
      .post("/posts")
      .set("authorization", `Bearer ${token}`)
      .send({ body: "A new 24 hour deoly.", visibility: "friends", kind: "deoly" });

    const createdAt = new Date(response.body.post.createdAt).getTime();
    const expiresAt = new Date(response.body.post.expiresAt).getTime();

    expect(response.status).toBe(201);
    expect(response.body.post.kind).toBe("deoly");
    expect(expiresAt - createdAt).toBe(24 * 60 * 60 * 1000);
  });

  it("creates upload intents for authenticated photo uploads", async () => {
    const response = await request(app)
      .post("/media/uploads")
      .set("authorization", `Bearer ${token}`)
      .send({ contentType: "image/jpeg", byteSize: 500_000 });

    expect(response.status).toBe(201);
    expect(response.body.objectKey).toBe("users/user_ava/posts/test-photo.jpeg");
    expect(response.body.uploadUrl).toBe("https://upload.example.test/photo");
    expect(response.body.headers["content-type"]).toBe("image/jpeg");
  });

  it("rejects unauthenticated upload intents", async () => {
    const response = await request(app).post("/media/uploads").send({ contentType: "image/jpeg", byteSize: 500_000 });

    expect(response.status).toBe(401);
  });

  it("rejects unsupported or oversized upload intents", async () => {
    const unsupportedType = await request(app)
      .post("/media/uploads")
      .set("authorization", `Bearer ${token}`)
      .send({ contentType: "image/gif", byteSize: 500_000 });
    const oversized = await request(app)
      .post("/media/uploads")
      .set("authorization", `Bearer ${token}`)
      .send({ contentType: "image/jpeg", byteSize: 9 * 1024 * 1024 });

    expect(unsupportedType.status).toBe(400);
    expect(oversized.status).toBe(400);
  });

  it("creates posts with the authenticated user's photo object key", async () => {
    const response = await request(app)
      .post("/posts")
      .set("authorization", `Bearer ${token}`)
      .send({
        body: "A new photo deoly.",
        imageObjectKey: "users/user_ava/posts/new-photo.jpg",
        visibility: "friends",
        kind: "deoly"
      });

    expect(response.status).toBe(201);
    expect(response.body.post.imageUrl).toBe("https://photos.example.test/users/user_ava/posts/new-photo.jpg");
  });

  it("rejects posts that attach another user's photo object key", async () => {
    const response = await request(app)
      .post("/posts")
      .set("authorization", `Bearer ${token}`)
      .send({
        body: "Trying to attach another photo.",
        imageObjectKey: "users/ckvvy6f5e000001l6b9fh9a3x/posts/friend.jpg",
        visibility: "friends",
        kind: "deoly"
      });

    expect(response.status).toBe(403);
  });

  it("creates permanent posts without an expiration time", async () => {
    const response = await request(app)
      .post("/posts")
      .set("authorization", `Bearer ${token}`)
      .send({ body: "A permanent post.", visibility: "friends", kind: "permanent" });

    expect(response.status).toBe(201);
    expect(response.body.post.kind).toBe("permanent");
    expect(response.body.post.expiresAt).toBeNull();
  });

  it("returns feed items for authenticated users", async () => {
    const response = await request(app).get("/feed").set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[1].reactionCounts["🙏"]).toBe(1);
    expect(response.body.items[0].imageUrl).toBe("https://photos.example.test/users/user_ava/posts/self-new.jpg");
  });

  it("shows the authenticated user's posts in the feed", async () => {
    const response = await request(app).get("/feed").set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "post_self_new",
          author: expect.objectContaining({ id: "user_ava" })
        })
      ])
    );
  });

  it("shows accepted friends' posts in the feed", async () => {
    const response = await request(app).get("/feed").set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "post_1",
          author: expect.objectContaining({ id: "ckvvy6f5e000001l6b9fh9a3x" })
        })
      ])
    );
  });

  it("shows permanent posts from accepted friends in the feed", async () => {
    const response = await request(app).get("/feed").set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "post_friend_permanent",
          kind: "permanent",
          expiresAt: null,
          author: expect.objectContaining({ id: "ckvvy6f5e000001l6b9fh9a3x" })
        })
      ])
    );
  });

  it("hides expired deolys from the feed", async () => {
    const response = await request(app).get("/feed").set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items.map((post: { id: string }) => post.id)).not.toContain("post_self_expired");
  });

  it("hides posts from people who are not accepted friends", async () => {
    const response = await request(app).get("/feed").set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items.map((post: { id: string }) => post.id)).not.toContain("post_non_friend");
  });

  it("sorts feed posts newest first", async () => {
    const response = await request(app).get("/feed").set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items.map((post: { id: string }) => post.id)).toEqual([
      "post_self_new",
      "post_1",
      "post_friend_permanent"
    ]);
  });

  it("lets the author view expired deolys directly", async () => {
    const response = await request(app).get("/posts/post_self_expired").set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.post.id).toBe("post_self_expired");
    expect(response.body.post.kind).toBe("deoly");
  });

  it("hides expired deolys from friends", async () => {
    const response = await request(app).get("/posts/post_self_expired").set("authorization", `Bearer ${noahToken}`);

    expect(response.status).toBe(403);
  });

  it("returns the author's recent deoly history", async () => {
    const response = await request(app).get("/posts/me/deolies/recent").set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items.map((post: { id: string }) => post.id)).toEqual(
      expect.arrayContaining(["post_self_new", "post_self_expired"])
    );
  });

  it("returns permanent profile posts to accepted friends", async () => {
    const response = await request(app)
      .get("/posts/users/ckvvy6f5e000001l6b9fh9a3x/permanent")
      .set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([
      expect.objectContaining({
        id: "post_friend_permanent",
        kind: "permanent",
        expiresAt: null
      })
    ]);
  });

  it("hides permanent profile posts from non-friends", async () => {
    const response = await request(app)
      .get("/posts/users/ckvvy6f5e000001l6b9fh9a3x/permanent")
      .set("authorization", `Bearer ${miaToken}`);

    expect(response.status).toBe(403);
  });

  it("prevents friends from reacting to expired deolys", async () => {
    const response = await request(app)
      .post("/posts/post_self_expired/reactions")
      .set("authorization", `Bearer ${noahToken}`)
      .send({ emoji: "🙏" });

    expect(response.status).toBe(403);
  });

  it("prevents friends from commenting on expired deolys", async () => {
    const response = await request(app)
      .post("/posts/post_self_expired/comments")
      .set("authorization", `Bearer ${noahToken}`)
      .send({ body: "Still praying for this." });

    expect(response.status).toBe(403);
  });

  it("searches users with friendship status", async () => {
    const response = await request(app).get("/users/search?q=Leah%20Hope").set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.users).toEqual([
      expect.objectContaining({
        displayName: "Leah Hope",
        friendshipId: "friend_decline",
        friendshipStatus: "pending_incoming",
        username: "leahhope"
      })
    ]);
  });

  it("returns the authenticated user in search results", async () => {
    const response = await request(app).get("/users/search?q=Ava%20Grace").set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.users).toEqual([
      expect.objectContaining({
        displayName: "Ava Grace",
        friendshipId: null,
        friendshipStatus: "self",
        username: "avafaith"
      })
    ]);
  });

  it("returns none friendship status for unconnected search results", async () => {
    const response = await request(app).get("/users/search?q=Mia%20Rose").set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.users).toEqual([
      expect.objectContaining({
        displayName: "Mia Rose",
        friendshipId: null,
        friendshipStatus: "none",
        username: "miaprays"
      })
    ]);
  });

  it("sends friend requests", async () => {
    const response = await request(app)
      .post("/friends/requests")
      .set("authorization", `Bearer ${token}`)
      .send({ userId: "ckvvy8r2k000101l68v2ud6mm" });

    expect(response.status).toBe(201);
    expect(response.body.friendshipId).toBe("friend_new");
  });

  it("accepts incoming friend requests", async () => {
    const response = await request(app)
      .post("/friends/requests/friend_pending/accept")
      .set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it("declines incoming friend requests", async () => {
    const response = await request(app)
      .post("/friends/requests/friend_decline/decline")
      .set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it("removes friendships", async () => {
    const response = await request(app).delete("/friends/friend_1").set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it("deletes the authenticated account", async () => {
    const login = await request(app).post("/auth/login").send({
      email: "mia@example.com",
      password: "password123"
    });

    const response = await request(app)
      .delete("/auth/account")
      .set("authorization", `Bearer ${login.body.session.token}`);

    expect(response.status).toBe(204);
  });
});
