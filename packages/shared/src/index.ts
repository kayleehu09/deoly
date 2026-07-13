export const POST_MAX_LENGTH = 280;
export const COMMENT_MAX_LENGTH = 200;
export const DISPLAY_NAME_MAX_LENGTH = 40;
export const USERNAME_MAX_LENGTH = 24;
export const ALLOWED_REACTION_EMOJIS = ["🙏", "❤️", "🙌", "🔥", "😊", "🤍"] as const;
export const POST_VISIBILITIES = ["friends", "close_circle"] as const;
export const POST_KINDS = ["deoly", "permanent"] as const;

export type AllowedReactionEmoji = (typeof ALLOWED_REACTION_EMOJIS)[number];

export type FriendshipStatus = "pending" | "accepted" | "declined";
export type PostVisibility = (typeof POST_VISIBILITIES)[number];
export type PostKind = (typeof POST_KINDS)[number];

export interface ApiErrorShape {
  error: {
    message: string;
    code: string;
    details?: Record<string, string[]>;
  };
}

export interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
}

export interface AuthResponse {
  user: UserProfile;
  session: AuthSession;
}

export interface FeedAuthor {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

export interface FeedComment {
  id: string;
  body: string;
  createdAt: string;
  author: FeedAuthor;
}

export interface FeedPost {
  id: string;
  body: string;
  imageUrl: string | null;
  kind: PostKind;
  visibility: PostVisibility;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: FeedAuthor;
  reactionCounts: Partial<Record<AllowedReactionEmoji, number>>;
  viewerReactions: AllowedReactionEmoji[];
  recentComments: FeedComment[];
  commentCount: number;
}

export interface FeedResponse {
  items: FeedPost[];
}

export interface FriendsListItem {
  friendshipId: string;
  status: FriendshipStatus;
  direction: "incoming" | "outgoing" | "accepted";
  user: FeedAuthor;
  createdAt: string;
  acceptedAt: string | null;
}

export interface FriendsListResponse {
  friends: FriendsListItem[];
}

export interface SearchUserResult {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  friendshipStatus: "self" | "none" | "pending_incoming" | "pending_outgoing" | "accepted";
  friendshipId: string | null;
}

export interface SearchUsersResponse {
  users: SearchUserResult[];
}

export interface CreatePostInput {
  body: string;
  imageObjectKey?: string;
  visibility: PostVisibility;
  kind?: PostKind;
}

export interface CreateMediaUploadInput {
  contentType: "image/jpeg" | "image/png" | "image/webp";
  byteSize: number;
}

export interface CreateMediaUploadResponse {
  objectKey: string;
  uploadUrl: string;
  expiresAt: string;
  headers: Record<string, string>;
}

export interface CreateCommentInput {
  body: string;
}

export interface CreateReactionInput {
  emoji: AllowedReactionEmoji;
}

export interface SendFriendRequestInput {
  userId: string;
}
