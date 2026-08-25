import { prisma } from "./prisma.js";

export async function getBlockedUserIds(userId: string) {
  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }]
    }
  });

  return blocks.map((block) => (block.blockerId === userId ? block.blockedId : block.blockerId));
}

export async function areUsersBlocked(userId: string, otherUserId: string) {
  if (userId === otherUserId) {
    return false;
  }

  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: userId }
      ]
    }
  });

  return Boolean(block);
}
