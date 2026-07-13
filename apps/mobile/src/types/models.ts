export interface User {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string;
  bio: string;
  friendIds: string[];
  closeFriendIds: string[];
}

export interface Post {
  id: string;
  userId: string;
  imageUrl: string | null;
  caption: string;
  createdAt: string;
  expiresAt: string | null;
  isPermanent: boolean;
}

export interface FeedPost extends Post {
  user: User;
  isCloseFriend: boolean;
}

export type PostDuration = '24h' | 'permanent';
