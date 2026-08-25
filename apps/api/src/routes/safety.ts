import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/require-auth.js";

const blockUserSchema = z.object({
  userId: z.string().cuid()
});

const reportPostSchema = z.object({
  reason: z.string().trim().min(1).max(120),
  details: z.string().trim().max(1000).optional()
});

export const safetyRouter = Router();

safetyRouter.get("/blocks", requireAuth, async (req, res, next) => {
  try {
    const viewerId = req.auth!.user.id;
    const blocks = await prisma.block.findMany({
      where: {
        blockerId: viewerId
      },
      include: {
        blocked: {
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
      blocks: blocks.map((block) => ({
        id: block.id,
        user: block.blocked,
        createdAt: block.createdAt.toISOString()
      }))
    });
  } catch (error) {
    next(error);
  }
});

safetyRouter.post("/blocks", requireAuth, async (req, res, next) => {
  try {
    const input = blockUserSchema.parse(req.body);
    const viewerId = req.auth!.user.id;

    if (input.userId === viewerId) {
      throw new ApiError(400, "BLOCK_SELF", "You cannot block yourself.");
    }

    const target = await prisma.user.findUnique({
      where: { id: input.userId }
    });

    if (!target) {
      throw new ApiError(404, "USER_NOT_FOUND", "That user could not be found.");
    }

    const block = await prisma.block.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: viewerId,
          blockedId: input.userId
        }
      },
      create: {
        blockerId: viewerId,
        blockedId: input.userId
      },
      update: {}
    });

    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { requesterId: viewerId, addresseeId: input.userId },
          { requesterId: input.userId, addresseeId: viewerId }
        ]
      }
    });

    res.status(201).json({
      blockId: block.id
    });
  } catch (error) {
    next(error);
  }
});

safetyRouter.delete("/blocks/:userId", requireAuth, async (req, res, next) => {
  try {
    const viewerId = req.auth!.user.id;
    const blockedId = String(req.params.userId);

    await prisma.block.deleteMany({
      where: {
        blockerId: viewerId,
        blockedId
      }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

safetyRouter.post("/posts/:postId/reports", requireAuth, async (req, res, next) => {
  try {
    const input = reportPostSchema.parse(req.body);
    const viewerId = req.auth!.user.id;
    const postId = String(req.params.postId);

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      throw new ApiError(404, "POST_NOT_FOUND", "Post not found.");
    }

    const report = await prisma.postReport.create({
      data: {
        postId,
        reporterId: viewerId,
        reason: input.reason,
        details: input.details || null
      }
    });

    res.status(201).json({
      reportId: report.id
    });
  } catch (error) {
    next(error);
  }
});

safetyRouter.get("/reports", requireAuth, async (_req, res, next) => {
  try {
    const reports = await prisma.postReport.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true
          }
        },
        post: {
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
      },
      take: 100
    });

    res.json({
      reports: reports.map((report) => ({
        id: report.id,
        reason: report.reason,
        details: report.details,
        createdAt: report.createdAt.toISOString(),
        reporter: report.reporter,
        post: {
          id: report.post.id,
          body: report.post.body,
          createdAt: report.post.createdAt.toISOString(),
          author: report.post.author
        }
      }))
    });
  } catch (error) {
    next(error);
  }
});
