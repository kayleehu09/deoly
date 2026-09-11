import { z } from "zod";
import { DISPLAY_NAME_MAX_LENGTH, USERNAME_MAX_LENGTH, BIO_MAX_LENGTH } from "@deoly/shared";

export const displayNameSchema = z.string().trim().min(2).max(DISPLAY_NAME_MAX_LENGTH);
export const usernameSchema = z.string().trim().min(3).max(USERNAME_MAX_LENGTH)
  .regex(/^[a-zA-Z0-9_]+$/).transform((value) => value.toLowerCase());
export const updateProfileSchema = z.object({
  displayName: displayNameSchema.optional(),
  username: usernameSchema.optional(),
  bio: z.string().trim().max(BIO_MAX_LENGTH).nullable().optional(),
  avatarObjectKey: z.string().min(1).max(512).nullable().optional()
}).strict().refine((value) => Object.keys(value).length > 0, "No profile changes supplied.");
