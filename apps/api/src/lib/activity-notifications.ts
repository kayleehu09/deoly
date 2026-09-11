import { toPublicIdentity } from "./avatars.js";
import type { ActivityNotification as ApiActivityNotification, AllowedReactionEmoji } from "@deoly/shared";
import type { ActivityNotificationType } from "@prisma/client";
import { prisma } from "./prisma.js";

const activityMessages: Record<ActivityNotificationType, (input: { actorName: string; emoji?: string | null }) => string> = {
  FRIEND_REQUEST_ACCEPTED: ({ actorName }) => `${actorName} accepted your friend request.`,
  POST_REACTION: ({ actorName, emoji }) => `${actorName} reacted ${emoji ?? ""} to your post.`.trim(),
  POST_COMMENT: ({ actorName }) => `${actorName} commented on your post.`
};

export async function createActivityNotification(input: {
  recipientId: string;
  actorId: string;
  type: ActivityNotificationType;
  postId?: string | null;
  emoji?: string | null;
}) {
  if (input.recipientId === input.actorId) {
    return null;
  }

  return prisma.activityNotification.create({
    data: {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      postId: input.postId ?? null,
      emoji: input.emoji ?? null
    }
  });
}

export async function toActivityNotification(notification: {
  id: string;
  type: ActivityNotificationType;
  postId: string | null;
  emoji: string | null;
  createdAt: Date;
  actor: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
    avatarObjectKey?: string | null;
  };
}, viewerId: string): Promise<ApiActivityNotification> {
  const message = activityMessages[notification.type]({
    actorName: notification.actor.displayName,
    emoji: notification.emoji
  });

  return {
    id: notification.id,
    type: notification.type.toLowerCase() as ApiActivityNotification["type"],
    message,
    createdAt: notification.createdAt.toISOString(),
    emoji: notification.emoji as AllowedReactionEmoji | null,
    postId: notification.postId,
    actor: await toPublicIdentity(notification.actor, viewerId)
  };
}
