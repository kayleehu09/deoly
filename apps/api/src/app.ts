import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { errorHandler } from "./lib/errors.js";
import { authRouter } from "./routes/auth.js";
import { feedRouter } from "./routes/feed.js";
import { friendsRouter } from "./routes/friends.js";
import { meRouter } from "./routes/me.js";
import { postsRouter } from "./routes/posts.js";
import { usersRouter } from "./routes/users.js";

export function createApp() {
  const app = express();
  const shouldLogDebugRequests = process.env.NODE_ENV !== "test";

  app.set("etag", false);

  app.use(
    cors({
      origin: config.webOrigin,
      credentials: false
    })
  );
  app.use(express.json());
  app.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  app.use((req, res, next) => {
    const shouldLogRequest =
      shouldLogDebugRequests &&
      ["/auth", "/feed", "/friends", "/users"].some((path) => req.path.startsWith(path));

    if (!shouldLogRequest) {
      next();
      return;
    }

    const startedAt = Date.now();

    res.on("finish", () => {
      console.log(`[api] ${req.method} ${req.originalUrl} -> ${res.statusCode} ${Date.now() - startedAt}ms`);
    });

    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/auth", authRouter);
  app.use("/me", meRouter);
  app.use("/feed", feedRouter);
  app.use("/posts", postsRouter);
  app.use("/friends", friendsRouter);
  app.use("/users", usersRouter);

  app.use(errorHandler);

  return app;
}
