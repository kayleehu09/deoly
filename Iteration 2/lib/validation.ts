import { REACTION_EMOJIS, type ReactionEmoji, type Visibility } from "@/lib/contracts";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function assertString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `${field} is required.`);
  }
  return value.trim();
}

export function assertEmail(value: unknown) {
  const email = assertString(value, "email").toLowerCase();
  if (!email.includes("@")) {
    throw new ApiError(400, "Enter a valid email.");
  }
  return email;
}

export function assertPassword(value: unknown) {
  const password = assertString(value, "password");
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters.");
  }
  return password;
}

export function assertVisibility(value: unknown): Visibility {
  if (value === "friends" || value === "close_circle") {
    return value;
  }
  throw new ApiError(400, "Choose a valid privacy option.");
}

export function assertPostBody(value: unknown) {
  const body = assertString(value, "body");
  if (body.length > 500) {
    throw new ApiError(400, "Posts can be up to 500 characters.");
  }
  return body;
}

export function assertCommentBody(value: unknown) {
  const body = assertString(value, "body");
  if (body.length > 240) {
    throw new ApiError(400, "Replies can be up to 240 characters.");
  }
  return body;
}

export function assertReactionEmoji(value: unknown): ReactionEmoji {
  if (typeof value === "string" && REACTION_EMOJIS.includes(value as ReactionEmoji)) {
    return value as ReactionEmoji;
  }
  throw new ApiError(400, "Unsupported emoji.");
}
