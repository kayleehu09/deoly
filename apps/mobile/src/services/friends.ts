import { apiFetch } from './auth';

export type FriendDirection = 'incoming' | 'outgoing' | 'accepted';
export type FriendStatus = 'pending' | 'accepted' | 'declined';

export type FriendUser = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

export type FriendListItem = {
  friendshipId: string;
  status: FriendStatus;
  direction: FriendDirection;
  user: FriendUser;
  createdAt: string;
  acceptedAt: string | null;
};

type FriendsResponse = {
  friends: FriendListItem[];
};

type FriendRequestResponse = {
  friendshipId: string;
};

export function getFriends(token: string) {
  return apiFetch<FriendsResponse>('/friends', undefined, token);
}

export function sendFriendRequest(userId: string, token: string) {
  return apiFetch<FriendRequestResponse>(
    '/friends/requests',
    {
      method: 'POST',
      body: JSON.stringify({ userId })
    },
    token
  );
}

export function acceptFriendRequest(friendshipId: string, token: string) {
  return apiFetch<void>(
    `/friends/requests/${friendshipId}/accept`,
    {
      method: 'POST'
    },
    token
  );
}

export function declineFriendRequest(friendshipId: string, token: string) {
  return apiFetch<void>(
    `/friends/requests/${friendshipId}/decline`,
    {
      method: 'POST'
    },
    token
  );
}

export function removeFriend(friendshipId: string, token: string) {
  return apiFetch<void>(
    `/friends/${friendshipId}`,
    {
      method: 'DELETE'
    },
    token
  );
}
