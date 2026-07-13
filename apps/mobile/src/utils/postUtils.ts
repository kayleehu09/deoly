import type { Post, User } from '../types/models';

export function isPostExpired(post: Post, currentTime = new Date()): boolean {
  if (post.isPermanent || !post.expiresAt) {
    return false;
  }

  return new Date(post.expiresAt).getTime() <= currentTime.getTime();
}

export function prioritizeCloseFriends(post: Post, currentUser: User): number {
  if (currentUser.closeFriendIds.includes(post.userId)) {
    return 0;
  }

  return 1;
}

export function sortFeedPosts(posts: Post[], currentUser: User): Post[] {
  return [...posts]
    .filter((post) => !isPostExpired(post))
    .sort((left, right) => {
      const closenessDiff =
        prioritizeCloseFriends(left, currentUser) - prioritizeCloseFriends(right, currentUser);

      if (closenessDiff !== 0) {
        return closenessDiff;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
}

export function filterPermanentPostsForProfile(posts: Post[], userId: string): Post[] {
  return [...posts]
    .filter((post) => post.userId === userId && post.isPermanent)
    .sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
}
