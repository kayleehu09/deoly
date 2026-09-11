import { Router } from "express";
import { Prisma } from "@prisma/client";
import { requireAuth } from "../middleware/require-auth.js";
import { toUserProfile } from "../lib/serializers.js";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../lib/errors.js";
import { updateProfileSchema } from "../lib/profile-validation.js";
import { prepareAvatar } from "../lib/avatars.js";

export const meRouter = Router();

meRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    res.json({ user: await toUserProfile(req.auth!.user) });
  } catch (error) { next(error); }
});

meRouter.patch("/", requireAuth, async (req, res, next) => {
  try {
    const input = updateProfileSchema.parse(req.body);
    const userId = req.auth!.user.id;
    if (input.username) {
      const existing = await prisma.user.findUnique({ where: { username: input.username } });
      if (existing && existing.id !== userId) {
        throw new ApiError(409, "USERNAME_TAKEN", "That username is taken.");
      }
    }
    const avatarKey = input.avatarObjectKey ? await prepareAvatar(userId, input.avatarObjectKey) : input.avatarObjectKey;
    const user = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (avatarKey) {
        const claimed = await tx.avatarUpload.updateMany({
          where: { objectKey: avatarKey, userId, state: "PENDING", deleteAfter: { gt: new Date() } },
          data: { state: "ACTIVE" }
        });
        if (claimed.count !== 1) throw new ApiError(400, "INVALID_AVATAR_UPLOAD", "Choose and upload your photo again.");
      }
      const updated = await tx.user.update({ where: { id: userId }, data: {
        displayName: input.displayName,
        username: input.username,
        bio: input.bio === undefined ? undefined : input.bio || null,
        avatarObjectKey: avatarKey,
        ...(avatarKey !== undefined ? { avatarUrl: null } : {})
      } });
      if (avatarKey !== undefined && current.avatarObjectKey) {
        await tx.avatarUpload.updateMany({
          where: { objectKey: current.avatarObjectKey, state: "ACTIVE" },
          data: { state: "PENDING", deleteAfter: new Date() }
        });
      }
      return updated;
    });
    res.json({ user: await toUserProfile(user) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return next(new ApiError(409, "USERNAME_TAKEN", "That username is taken."));
    }
    next(error);
  }
});
