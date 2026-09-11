import { toPublicIdentity } from "./avatars.js";
import type { AllowedReactionEmoji, FeedComment, FeedPost, UserProfile } from "@deoly/shared";
import { ALLOWED_REACTION_EMOJIS } from "@deoly/shared";
import { createPostImageReadUrl } from "./storage.js";

export async function toUserProfile(user: {
  id: string;
  displayName: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  avatarObjectKey?: string | null;
  createdAt: Date;
}): Promise<UserProfile> {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatarUrl: (await toPublicIdentity(user, user.id)).avatarUrl,
    createdAt: user.createdAt.toISOString()
  };
}

export async function toFeedComment(comment: {
  id: string;
  body: string;
  createdAt: Date;
  author: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
    avatarObjectKey?: string | null;
  };
}, viewerId: string): Promise<FeedComment> {
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    author: await toPublicIdentity(comment.author, viewerId)
  };
}

export type FeedPostRecord = {
  id: string;
  body: string;
  imageObjectKey: string | null;
  kind: "DEOLY" | "PERMANENT";
  visibility: "FRIENDS" | "CLOSE_CIRCLE";
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
    avatarObjectKey?: string | null;
  };
  reactions: Array<{
    emoji: string;
    userId: string;
  }>;
  comments: Array<{
    id: string;
    body: string;
    createdAt: Date;
    author: {
      id: string;
      displayName: string;
      username: string;
      avatarUrl: string | null;
      avatarObjectKey?: string | null;
    };
  }>;
};

export async function toFeedPost(post: FeedPostRecord, viewerId: string): Promise<FeedPost> {
  const reactionCounts = Object.fromEntries(ALLOWED_REACTION_EMOJIS.map((emoji) => [emoji, 0])) as Partial<
    Record<AllowedReactionEmoji, number>
  >;

  for (const reaction of post.reactions) {
    if (ALLOWED_REACTION_EMOJIS.includes(reaction.emoji as AllowedReactionEmoji)) {
      reactionCounts[reaction.emoji as AllowedReactionEmoji] = (reactionCounts[reaction.emoji as AllowedReactionEmoji] ?? 0) + 1;
    }
  }

  const viewerReactions = post.reactions
    .filter((reaction) => reaction.userId === viewerId && ALLOWED_REACTION_EMOJIS.includes(reaction.emoji as AllowedReactionEmoji))
    .map((reaction) => reaction.emoji as AllowedReactionEmoji);

  return {
    id: post.id,
    body: post.body,
    imageUrl: post.imageObjectKey ? await createPostImageReadUrl(post.imageObjectKey) : null,
    kind: post.kind === "PERMANENT" ? "permanent" : "deoly",
    visibility: post.visibility === "CLOSE_CIRCLE" ? "close_circle" : "friends",
    expiresAt: post.expiresAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    author: await toPublicIdentity(post.author, viewerId),
    reactionCounts,
    viewerReactions,
    recentComments: await Promise.all(post.comments.map((comment) => toFeedComment(comment, viewerId))),
    commentCount: post.comments.length
  };
}
