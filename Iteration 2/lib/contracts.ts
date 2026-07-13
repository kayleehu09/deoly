export type Visibility = "friends" | "close_circle";

export const VISIBILITY_OPTIONS: Array<{
  value: Visibility;
  label: string;
  description: string;
}> = [
  {
    value: "friends",
    label: "Friends only",
    description: "Visible across your accepted friends."
  },
  {
    value: "close_circle",
    label: "Close circle",
    description: "Saved now and ready for stricter filtering later."
  }
];

export const REACTION_EMOJIS = ["🙏", "❤️", "🕊️", "🌿", "✨"] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export type UserSummary = {
  id: string;
  displayName: string;
  username: string;
};

export type CommentDto = {
  id: string;
  body: string;
  createdAt: string;
  author: UserSummary;
};

export type ReactionSummary = {
  emoji: ReactionEmoji;
  count: number;
  reacted: boolean;
};

export type PostDto = {
  id: string;
  body: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  author: UserSummary;
  reactions: ReactionSummary[];
  comments: CommentDto[];
  commentCount: number;
};

export type FriendProfile = UserSummary & {
  email: string;
};

export type FriendRequestDto = {
  id: string;
  createdAt: string;
  sender: FriendProfile;
  receiver: FriendProfile;
};

export type FriendsState = {
  friends: FriendProfile[];
  incomingRequests: FriendRequestDto[];
  outgoingRequests: FriendRequestDto[];
};

export type ViewerDto = FriendProfile & {
  closeCircleCount: number;
};

export type FeedResponse = {
  viewer: ViewerDto;
  posts: PostDto[];
  friendships: FriendsState;
};
