import { Router } from "express";
import { z } from "zod";
import { DISPLAY_NAME_MAX_LENGTH, USERNAME_MAX_LENGTH } from "@deoly/shared";
import { ApiError } from "../lib/errors.js";
import { createSession, deleteSession, hashPassword, verifyPassword } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { toUserProfile } from "../lib/serializers.js";
import { requireAuth } from "../middleware/require-auth.js";

const signupSchema = z.object({
  displayName: z.string().trim().min(2).max(DISPLAY_NAME_MAX_LENGTH),
  username: z.string().trim().min(3).max(USERNAME_MAX_LENGTH).regex(/^[a-zA-Z0-9_]+$/),
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
        OR: [{ email: input.email }, { username: input.username }]
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
      user: toUserProfile(user),
      session
    });
  } catch (error) {
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
      user: toUserProfile(user),
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
    await prisma.user.delete({
      where: {
        id: req.auth!.user.id
      }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
