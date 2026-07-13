import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import { toUserProfile } from "../lib/serializers.js";

export const meRouter = Router();

meRouter.get("/", requireAuth, (req, res) => {
  res.json({
    user: toUserProfile(req.auth!.user)
  });
});
