import type {
  AuthResponse,
  CreateCommentInput,
  CreatePostInput,
  CreateReactionInput,
  FeedResponse,
  FriendsListResponse,
  SearchUsersResponse,
  UserProfile
} from "@sanctuary/shared";
import { getSessionToken } from "./auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getSessionToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? "Request failed.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function signup(input: { displayName: string; username: string; email: string; password: string }) {
  return apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function login(input: { email: string; password: string }) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function logout() {
  return apiFetch<void>("/auth/logout", {
    method: "POST"
  });
}

export function getMe() {
  return apiFetch<{ user: UserProfile }>("/me");
}

export function getFeed() {
  return apiFetch<FeedResponse>("/feed");
}

export function createPost(input: CreatePostInput) {
  return apiFetch<{ post: FeedResponse["items"][number] }>("/posts", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getPost(postId: string) {
  return apiFetch<{ post: FeedResponse["items"][number] }>(`/posts/${postId}`);
}

export function addReaction(postId: string, input: CreateReactionInput) {
  return apiFetch<void>(`/posts/${postId}/reactions`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function removeReaction(postId: string, emoji: string) {
  return apiFetch<void>(`/posts/${postId}/reactions/${encodeURIComponent(emoji)}`, {
    method: "DELETE"
  });
}

export function addComment(postId: string, input: CreateCommentInput) {
  return apiFetch<{ comment: FeedResponse["items"][number]["recentComments"][number] }>(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getFriends() {
  return apiFetch<FriendsListResponse>("/friends");
}

export function searchUsers(query: string) {
  return apiFetch<SearchUsersResponse>(`/users/search?q=${encodeURIComponent(query)}`);
}

export function sendFriendRequest(userId: string) {
  return apiFetch<{ friendshipId: string }>("/friends/requests", {
    method: "POST",
    body: JSON.stringify({ userId })
  });
}

export function acceptFriendRequest(friendshipId: string) {
  return apiFetch<void>(`/friends/requests/${friendshipId}/accept`, {
    method: "POST"
  });
}

export function declineFriendRequest(friendshipId: string) {
  return apiFetch<void>(`/friends/requests/${friendshipId}/decline`, {
    method: "POST"
  });
}

export function removeFriend(friendshipId: string) {
  return apiFetch<void>(`/friends/${friendshipId}`, {
    method: "DELETE"
  });
}
