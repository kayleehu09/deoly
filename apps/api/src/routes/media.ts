import { Router } from "express";
import { z } from "zod";
import type { CreateMediaUploadResponse } from "@deoly/shared";
import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
  createPostImageUpload,
  isAllowedImageContentType
} from "../lib/storage.js";
import { requireAuth } from "../middleware/require-auth.js";

const createUploadSchema = z.object({
  contentType: z.string().refine(isAllowedImageContentType, {
    message: `Expected one of: ${ALLOWED_IMAGE_CONTENT_TYPES.join(", ")}`
  }),
  byteSize: z.number().int().positive().max(MAX_IMAGE_UPLOAD_BYTES)
});

export const mediaRouter = Router();

mediaRouter.post("/uploads", requireAuth, async (req, res, next) => {
  try {
    const input = createUploadSchema.parse(req.body);

    const upload = await createPostImageUpload({
      userId: req.auth!.user.id,
      contentType: input.contentType
    });

    res.status(201).json(upload satisfies CreateMediaUploadResponse);
  } catch (error) {
    next(error);
  }
});
