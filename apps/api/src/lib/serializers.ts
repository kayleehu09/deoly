import type { AllowedReactionEmoji, FeedComment, FeedPost, UserProfile } from "@sanctuary/shared";
import { ALLOWED_REACTION_EMOJIS } from "@sanctuary/shared";

export function toUserProfile(user: {
  id: string;
  displayName: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}): UserProfile {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString()
  };
}

export function toFeedComment(comment: {
  id: string;
  body: string;
  createdAt: Date;
  author: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
}): FeedComment {
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    author: comment.author
  };
}

export type FeedPostRecord = {
  id: string;
  body: string;
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
    };
  }>;
};

export function toFeedPost(post: FeedPostRecord, viewerId: string): FeedPost {
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
    kind: post.kind === "PERMANENT" ? "permanent" : "deoly",
    visibility: post.visibility === "CLOSE_CIRCLE" ? "close_circle" : "friends",
    expiresAt: post.expiresAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    author: post.author,
    reactionCounts,
    viewerReactions,
    recentComments: post.comments.map(toFeedComment),
    commentCount: post.comments.length
  };
}
