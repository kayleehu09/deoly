import { Prisma } from "@prisma/client";
import { displayNameSchema, usernameSchema } from "../lib/profile-validation.js";
import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../lib/errors.js";
import { createSession, deleteSession, hashPassword, verifyPassword } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { toUserProfile } from "../lib/serializers.js";
import { requireAuth } from "../middleware/require-auth.js";
import { isAtLeast13, isValidDateOnly } from "../lib/age-gate.js";

const TERMS_VERSION = "draft-2026-11-08";
const PRIVACY_NOTICE_VERSION = "draft-2026-11-08";

const signupSchema = z.object({
  displayName: displayNameSchema,
  username: usernameSchema,
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  dateOfBirth: z.string().refine(isValidDateOnly, "Enter a valid date of birth."),
  termsVersion: z.literal(TERMS_VERSION),
  privacyNoticeVersion: z.literal(PRIVACY_NOTICE_VERSION),
  acceptedPolicies: z.literal(true)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72)
});

export const authRouter = Router();

authRouter.post("/signup", async (req, res, next) => {
  try {
    const input = signupSchema.parse(req.body);

    if (!isAtLeast13(input.dateOfBirth)) {
      throw new ApiError(403, "AGE_RESTRICTION", "Deoly is for people age 13 and older.");
    }

    const acceptedAt = new Date();

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
        passwordHash: await hashPassword(input.password),
        termsAcceptedAt: acceptedAt,
        termsVersion: input.termsVersion,
        privacyNoticeAcceptedAt: acceptedAt,
        privacyNoticeVersion: input.privacyNoticeVersion
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
