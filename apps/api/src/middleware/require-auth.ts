import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/errors.js";
import { getUserFromAuthHeader } from "../lib/auth.js";

declare module "express-serve-static-core" {
  interface Request {
    auth?: {
      token: string;
      user: {
        id: string;
        email: string;
        username: string;
        displayName: string;
        bio: string | null;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        passwordHash: string;
      };
    };
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = await getUserFromAuthHeader(req.header("authorization"));

  if (!auth) {
    return next(new ApiError(401, "UNAUTHORIZED", "You must be signed in to continue."));
  }

  req.auth = auth;
  return next();
}
