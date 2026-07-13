import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import type { User } from "@prisma/client";
import { config } from "../config.js";
import { prisma } from "./prisma.js";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(user: User) {
  const expiresAt = new Date(Date.now() + config.appSessionTtlDays * 24 * 60 * 60 * 1000);
  const token = nanoid(40);

  await prisma.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt
    }
  });

  return {
    token,
    expiresAt: expiresAt.toISOString()
  };
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({
    where: {
      token
    }
  });
}

export async function getUserFromAuthHeader(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return {
    token,
    user: session.user
  };
}
