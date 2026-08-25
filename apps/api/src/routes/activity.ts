import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { toActivityNotification } from "../lib/activity-notifications.js";
import { requireAuth } from "../middleware/require-auth.js";

export const activityRouter = Router();

activityRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const viewerId = req.auth!.user.id;
    const notifications = await prisma.activityNotification.findMany({
      where: {
        recipientId: viewerId
      },
      include: {
        actor: {
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
      },
      take: 50
    });

    res.json({
      items: notifications.map(toActivityNotification)
    });
  } catch (error) {
    next(error);
  }
});
