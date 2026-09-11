import { Prisma } from "@prisma/client";
import { displayNameSchema, usernameSchema } from "../lib/profile-validation.js";
import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../lib/errors.js";
import { createSession, deleteSession, hashPassword, verifyPassword } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { toUserProfile } from "../lib/serializers.js";
import { requireAuth } from "../middleware/require-auth.js";

const signupSchema = z.object({
  displayName: displayNameSchema,
  username: usernameSchema,
  email: z.string().trim().email(),
  password: z.string().min(8).max(72)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72)
});

export const authRouter = Router();

authRouter.post("/signup", async (req, res, next) => {
  try {
    const input = signupSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email.toLowerCase() }, { username: input.username }]
      }
    });

    if (existing) {
      throw new ApiError(409, "ACCOUNT_EXISTS", "An account with that email or username already exists.");
    }

    const user = await prisma.user.create({
      data: {
        displayName: input.displayName,
        username: input.username.toLowerCase(),
        email: input.email.toLowerCase(),
        passwordHash: await hashPassword(input.password)
      }
    });

    const session = await createSession(user);

    res.status(201).json({
      user: await toUserProfile(user),
      session
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return next(new ApiError(409, "ACCOUNT_EXISTS", "An account with that email or username already exists."));
    }
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: {
        email: input.email.toLowerCase()
      }
    });

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }

    const session = await createSession(user);

    res.json({
      user: await toUserProfile(user),
      session
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", requireAuth, async (req, res, next) => {
  try {
    await deleteSession(req.auth!.token);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRouter.delete("/account", requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth!.user.id;
    await prisma.$transaction(async (tx) => {
      await tx.avatarUpload.updateMany({
        where: { userId, state: "ACTIVE" },
        data: { state: "PENDING", deleteAfter: new Date() }
      });
      await tx.user.delete({ where: { id: userId } });
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
