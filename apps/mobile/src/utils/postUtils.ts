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

function getLocalDateKey(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getLatestDailyDeolies<TPost extends Post>(posts: TPost[], userId: string): TPost[] {
  const latestPostByDate = new Map<string, TPost>();

  posts
    .filter((post) => post.userId === userId && !post.isPermanent)
    .forEach((post) => {
      const dateKey = getLocalDateKey(post.createdAt);
      const savedPost = latestPostByDate.get(dateKey);

      if (!savedPost || new Date(post.createdAt).getTime() > new Date(savedPost.createdAt).getTime()) {
        latestPostByDate.set(dateKey, post);
      }
    });

  return Array.from(latestPostByDate.values()).sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}
