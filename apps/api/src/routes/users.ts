import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";

export const usersRouter = Router();

usersRouter.get("/search", requireAuth, async (req, res, next) => {
  try {
    const viewerId = req.auth!.user.id;
    const query = String(req.query.q ?? "").trim();

    const users = await prisma.user.findMany({
      where: {
        OR: query
          ? [
              { displayName: { contains: query } },
              { username: { contains: query } }
            ]
          : undefined
      },
      take: 12,
      select: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true
      }
    });

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: viewerId }, { addresseeId: viewerId }]
      }
    });

    res.json({
      users: users.map((user) => {
        const friendship = friendships.find(
          (entry) =>
            (entry.requesterId === viewerId && entry.addresseeId === user.id) ||
            (entry.requesterId === user.id && entry.addresseeId === viewerId)
        );

        let friendshipStatus: "self" | "none" | "pending_incoming" | "pending_outgoing" | "accepted" =
          user.id === viewerId ? "self" : "none";

        if (friendshipStatus === "self") {
          friendshipStatus = "self";
        } else if (friendship?.status === "ACCEPTED") {
          friendshipStatus = "accepted";
        } else if (friendship?.status === "PENDING") {
          friendshipStatus = friendship.requesterId === viewerId ? "pending_outgoing" : "pending_incoming";
        }

        return {
          ...user,
          friendshipStatus,
          friendshipId: friendship?.status === "PENDING" || friendship?.status === "ACCEPTED" ? friendship.id : null
        };
      })
    });
  } catch (error) {
    next(error);
  }
});
