import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import { getAcceptedFriendIds } from "../lib/friendships.js";
import { prisma } from "../lib/prisma.js";
import { toFeedPost } from "../lib/serializers.js";

export const feedRouter = Router();

feedRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const viewerId = req.auth!.user.id;
    const friendIds = await getAcceptedFriendIds(viewerId);
    const now = new Date();

    const posts = await prisma.post.findMany({
      where: {
        authorId: {
          in: [viewerId, ...friendIds]
        },
        OR: [
          { kind: "PERMANENT" },
          {
            kind: "DEOLY",
            expiresAt: {
              gt: now
            }
          }
        ]
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
          take: 3,
          orderBy: {
            createdAt: "desc"
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
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({
      items: posts.map((post) =>
        toFeedPost(
          {
            ...post,
            comments: [...post.comments].reverse()
          },
          viewerId
        )
      )
    });
  } catch (error) {
    next(error);
  }
});
