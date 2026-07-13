import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";

import { createSession, findSession, findUserById, revokeSession } from "@/lib/db";

const SESSION_COOKIE = "sanctuary_session";

export async function createAuthSession(userId: string) {
  const token = randomBytes(24).toString("hex");
  createSession(userId, token);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    revokeSession(token);
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const session = findSession(token);
  if (!session) {
    return null;
  }

  return findUserById(session.userId);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
