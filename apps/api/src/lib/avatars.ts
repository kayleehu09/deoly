import { nanoid } from "nanoid";
import { prisma } from "./prisma.js";
import { ApiError } from "./errors.js";
import { areUsersBlocked } from "./blocks.js";
import { copyVerifiedAvatar, createPostImageReadUrl, deleteAvatarObject } from "./storage.js";

export const AVATAR_RETENTION_MS = 24 * 60 * 60 * 1000;

export type ProfileIdentity = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  avatarObjectKey?: string | null;
};

export async function toPublicIdentity(user: ProfileIdentity, viewerId: string) {
  const blocked = user.id !== viewerId && await areUsersBlocked(viewerId, user.id);
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    avatarUrl: blocked ? null : user.avatarObjectKey
      ? await createPostImageReadUrl(user.avatarObjectKey) : user.avatarUrl
  };
}

export async function prepareAvatar(userId: string, objectKey: string) {
  const upload = await prisma.avatarUpload.findUnique({ where: { objectKey } });
  if (!upload || upload.userId !== userId || upload.state !== "PENDING" ||
      upload.deleteAfter <= new Date() || !objectKey.startsWith(`users/${userId}/avatars/uploads/`)) {
    throw new ApiError(400, "INVALID_AVATAR_UPLOAD", "Choose and upload your photo again.");
  }
  const finalKey = `users/${userId}/avatars/saved/${nanoid(24)}`;
  // Register before touching storage so even failed copies are eventually cleaned up.
  await prisma.avatarUpload.create({ data: {
    objectKey: finalKey, userId, deleteAfter: new Date(Date.now() + AVATAR_RETENTION_MS)
  } });
  await copyVerifiedAvatar(objectKey, finalKey);
  return finalKey;
}

let cleanupRunning = false;

export async function cleanupAvatars() {
  if (cleanupRunning) return;
  cleanupRunning = true;
  try {
    const candidates = await prisma.avatarUpload.findMany({
      where: { state: { in: ["PENDING", "DELETING"] }, deleteAfter: { lte: new Date() } },
      take: 100, orderBy: { deleteAfter: "asc" }
    });
    for (const candidate of candidates) {
      // Claim in the database; the profile transaction can never attach a claimed key.
      const claimed = await prisma.$transaction(async (tx) => {
        if (await tx.user.findFirst({ where: { avatarObjectKey: candidate.objectKey } })) return false;
        const result = await tx.avatarUpload.updateMany({
          where: { objectKey: candidate.objectKey, state: { in: ["PENDING", "DELETING"] }, deleteAfter: { lte: new Date() } },
          data: { state: "DELETING", deleteAfter: new Date(Date.now() + 5 * 60 * 1000) }
        });
        return result.count === 1;
      });
      if (!claimed) continue;
      try {
        await deleteAvatarObject(candidate.objectKey);
        await prisma.avatarUpload.delete({ where: { objectKey: candidate.objectKey } });
      } catch {
        console.warn("Avatar cleanup deferred; will retry.");
      }
    }
  } finally {
    cleanupRunning = false;
  }
}
