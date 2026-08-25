import { Router } from "express";
import { z } from "zod";
import { createActivityNotification } from "../lib/activity-notifications.js";
import { ApiError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/require-auth.js";

const sendFriendRequestSchema = z.object({
  userId: z.string().cuid()
});

export const friendsRouter = Router();

friendsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const viewerId = req.auth!.user.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: viewerId }, { addresseeId: viewerId }]
      },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true
          }
        },
        addressee: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({
      friends: friendships.map((friendship) => {
        const isRequester = friendship.requesterId === viewerId;
        const otherUser = isRequester ? friendship.addressee : friendship.requester;

        return {
          friendshipId: friendship.id,
          status: friendship.status.toLowerCase(),
          direction:
            friendship.status === "ACCEPTED" ? "accepted" : isRequester ? "outgoing" : "incoming",
          user: otherUser,
          createdAt: friendship.createdAt.toISOString(),
          acceptedAt: friendship.acceptedAt?.toISOString() ?? null
        };
      })
    });
  } catch (error) {
    next(error);
  }
});

friendsRouter.post("/requests", requireAuth, async (req, res, next) => {
  try {
    const input = sendFriendRequestSchema.parse(req.body);
    const viewerId = req.auth!.user.id;

    if (input.userId === viewerId) {
      throw new ApiError(400, "FRIEND_SELF", "You cannot add yourself.");
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: viewerId, addresseeId: input.userId },
          { requesterId: input.userId, addresseeId: viewerId }
        ]
      }
    });

    if (existing) {
      if (existing.status === "DECLINED") {
        await prisma.friendship.delete({
          where: { id: existing.id }
        });
      } else {
        throw new ApiError(409, "REQUEST_EXISTS", "A friendship request already exists between these users.");
      }
    }

    const target = await prisma.user.findUnique({
      where: { id: input.userId }
    });

    if (!target) {
      throw new ApiError(404, "USER_NOT_FOUND", "That user could not be found.");
    }

    const friendship = await prisma.friendship.create({
      data: {
        requesterId: viewerId,
        addresseeId: input.userId,
        status: "PENDING"
      }
    });

    res.status(201).json({
      friendshipId: friendship.id
    });
  } catch (error) {
    next(error);
  }
});

friendsRouter.post("/requests/:id/accept", requireAuth, async (req, res, next) => {
  try {
    const viewerId = req.auth!.user.id;
    const friendshipId = String(req.params.id);
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship || friendship.addresseeId !== viewerId) {
      throw new ApiError(404, "REQUEST_NOT_FOUND", "Friend request not found.");
    }

    await prisma.friendship.update({
      where: { id: friendship.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date()
      }
    });

    await createActivityNotification({
      recipientId: friendship.requesterId,
      actorId: viewerId,
      type: "FRIEND_REQUEST_ACCEPTED"
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

friendsRouter.post("/requests/:id/decline", requireAuth, async (req, res, next) => {
  try {
    const viewerId = req.auth!.user.id;
    const friendshipId = String(req.params.id);
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship || friendship.addresseeId !== viewerId) {
      throw new ApiError(404, "REQUEST_NOT_FOUND", "Friend request not found.");
    }

    await prisma.friendship.update({
      where: { id: friendship.id },
      data: {
        status: "DECLINED"
      }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

friendsRouter.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const viewerId = req.auth!.user.id;
    const friendshipId = String(req.params.id);
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship || (friendship.requesterId !== viewerId && friendship.addresseeId !== viewerId)) {
      throw new ApiError(404, "FRIENDSHIP_NOT_FOUND", "Friendship not found.");
    }

    await prisma.friendship.delete({
      where: { id: friendship.id }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
