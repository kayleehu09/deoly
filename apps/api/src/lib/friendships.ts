import { prisma } from "./prisma.js";
import { areUsersBlocked, getBlockedUserIds } from "./blocks.js";

type ViewablePost = {
  authorId: string;
  kind: string;
  expiresAt: Date | null;
};

export async function getAcceptedFriendIds(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }]
    }
  });

  const blockedUserIds = new Set(await getBlockedUserIds(userId));

  return friendships
    .map((friendship) => (friendship.requesterId === userId ? friendship.addresseeId : friendship.requesterId))
    .filter((friendId) => !blockedUserIds.has(friendId));
}

export async function canViewPost(viewerId: string, authorId: string) {
  if (viewerId === authorId) {
    return true;
  }

  if (await areUsersBlocked(viewerId, authorId)) {
    return false;
  }

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: viewerId, addresseeId: authorId },
        { requesterId: authorId, addresseeId: viewerId }
      ]
    }
  });

  return Boolean(friendship);
}

export function isDeolyExpired(post: ViewablePost, now = new Date()) {
  return post.kind === "DEOLY" && post.expiresAt !== null && post.expiresAt <= now;
}

export async function canViewPostRecord(viewerId: string, post: ViewablePost) {
  if (viewerId === post.authorId) {
    return true;
  }

  if (isDeolyExpired(post)) {
    return false;
  }

  return canViewPost(viewerId, post.authorId);
}

export async function canInteractWithPost(viewerId: string, post: ViewablePost) {
  if (isDeolyExpired(post)) {
    return false;
  }

  return canViewPost(viewerId, post.authorId);
}
