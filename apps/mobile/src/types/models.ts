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
  reactionCounts: Partial<Record<ReactionEmoji, number>>;
  viewerReactions: ReactionEmoji[];
  recentComments: PostComment[];
  commentCount: number;
}

export interface FeedPost extends Post {
  user: User;
  isCloseFriend: boolean;
}

export type ReactionEmoji = '🙏' | '❤️' | '🙌' | '🔥' | '😊' | '🤍';

export interface PostComment {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
}
