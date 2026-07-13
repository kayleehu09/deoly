import { Router } from "express";
import { z } from "zod";
import { ALLOWED_REACTION_EMOJIS, COMMENT_MAX_LENGTH, POST_KINDS, POST_MAX_LENGTH, POST_VISIBILITIES } from "@sanctuary/shared";
import { ApiError } from "../lib/errors.js";
import { canInteractWithPost, canViewPost, canViewPostRecord } from "../lib/friendships.js";
import { prisma } from "../lib/prisma.js";
import { toFeedPost, type FeedPostRecord } from "../lib/serializers.js";
import { isPostImageObjectKeyForUser } from "../lib/storage.js";
import { requireAuth } from "../middleware/require-auth.js";

const RECENT_DEOLY_HISTORY_DAYS = 7;

const createPostSchema = z.object({
  body: z.string().trim().max(POST_MAX_LENGTH).default(""),
  imageObjectKey: z.string().trim().min(1).optional(),
  visibility: z.enum(POST_VISIBILITIES),
  kind: z.enum(POST_KINDS).default("deoly")
});

const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(COMMENT_MAX_LENGTH)
});

const createReactionSchema = z.object({
  emoji: z.enum(ALLOWED_REACTION_EMOJIS)
});

export const postsRouter = Router();

postsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const input = createPostSchema.parse(req.body);
    const viewerId = req.auth!.user.id;
    const createdAt = new Date();
    const expiresAt = input.kind === "deoly" ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) : null;

    if (input.imageObjectKey && !isPostImageObjectKeyForUser(input.imageObjectKey, viewerId)) {
      throw new ApiError(403, "IMAGE_OBJECT_FORBIDDEN", "You cannot attach this photo to your post.");
    }

    const post = await prisma.post.create({
      data: {
        authorId: viewerId,
        body: input.body,
        imageObjectKey: input.imageObjectKey,
        kind: input.kind === "permanent" ? "PERMANENT" : "DEOLY",
        visibility: input.visibility === "close_circle" ? "CLOSE_CIRCLE" : "FRIENDS",
        expiresAt,
        createdAt
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true
          }
        },
        reactions: {
          select: {
            emoji: true,
            userId: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                username: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      post: await toFeedPost(post, viewerId)
    });
  } catch (error) {
    next(error);
  }
});

postsRouter.get("/me/deolies/recent", requireAuth, async (req, res, next) => {
  try {
    const viewerId = req.auth!.user.id;
    const recentWindowStart = new Date(Date.now() - RECENT_DEOLY_HISTORY_DAYS * 24 * 60 * 60 * 1000);

    const posts = await prisma.post.findMany({
      where: {
        authorId: viewerId,
        kind: "DEOLY",
        createdAt: {
          gte: recentWindowStart
        }
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true
          }
        },
        reactions: {
          select: {
            emoji: true,
            userId: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                username: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({
      items: await Promise.all(posts.map((post) => toFeedPost(post, viewerId)))
    });
  } catch (error) {
    next(error);
  }
});

postsRouter.get("/users/:userId/permanent", requireAuth, async (req, res, next) => {
  try {
    const viewerId = req.auth!.user.id;
    const userId = String(req.params.userId);

    if (!(await canViewPost(viewerId, userId))) {
      throw new ApiError(403, "POST_FORBIDDEN", "You do not have access to these posts.");
    }

    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
        kind: "PERMANENT"
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true
          }
        },
        reactions: {
          select: {
            emoji: true,
            userId: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                username: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({
      items: await Promise.all(posts.map((post) => toFeedPost(post, viewerId)))
    });
  } catch (error) {
    next(error);
  }
});

postsRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const postId = String(req.params.id);
    const post = await prisma.post.findUnique({
      where: {
        id: postId
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true
          }
        },
        reactions: {
          select: {
            emoji: true,
            userId: true
          }
        },
        comments: {
          orderBy: {
            createdAt: "asc"
          },
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                username: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    if (!post) {
      throw new ApiError(404, "POST_NOT_FOUND", "Post not found.");
    }

    const viewerId = req.auth!.user.id;
    const allowed = await canViewPostRecord(viewerId, post);

    if (!allowed) {
      throw new ApiError(403, "POST_FORBIDDEN", "You do not have access to this post.");
    }

    res.json({
      post: await toFeedPost(post as FeedPostRecord, viewerId)
    });
  } catch (error) {
    next(error);
  }
});

postsRouter.post("/:id/reactions", requireAuth, async (req, res, next) => {
  try {
    const input = createReactionSchema.parse(req.body);
    const viewerId = req.auth!.user.id;
    const postId = String(req.params.id);

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      throw new ApiError(404, "POST_NOT_FOUND", "Post not found.");
    }

    if (!(await canInteractWithPost(viewerId, post))) {
      throw new ApiError(403, "POST_FORBIDDEN", "You do not have access to this post.");
    }

    await prisma.reaction.upsert({
      where: {
        postId_userId_emoji: {
          postId: post.id,
          userId: viewerId,
          emoji: input.emoji
        }
      },
      create: {
        postId: post.id,
        userId: viewerId,
        emoji: input.emoji
      },
      update: {}
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

postsRouter.delete("/:id/reactions/:emoji", requireAuth, async (req, res, next) => {
  try {
    const viewerId = req.auth!.user.id;
    const postId = String(req.params.id);
    const emoji = z.enum(ALLOWED_REACTION_EMOJIS).parse(String(req.params.emoji));
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      throw new ApiError(404, "POST_NOT_FOUND", "Post not found.");
    }

    if (!(await canInteractWithPost(viewerId, post))) {
      throw new ApiError(403, "POST_FORBIDDEN", "You do not have access to this post.");
    }

    await prisma.reaction.deleteMany({
      where: {
        postId,
        userId: viewerId,
        emoji
      }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

postsRouter.post("/:id/comments", requireAuth, async (req, res, next) => {
  try {
    const input = createCommentSchema.parse(req.body);
    const viewerId = req.auth!.user.id;
    const postId = String(req.params.id);

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      throw new ApiError(404, "POST_NOT_FOUND", "Post not found.");
    }

    if (!(await canInteractWithPost(viewerId, post))) {
      throw new ApiError(403, "POST_FORBIDDEN", "You do not have access to this post.");
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: viewerId,
        body: input.body
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });

    res.status(201).json({
      comment: {
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        author: comment.author
      }
    });
  } catch (error) {
    next(error);
  }
});
