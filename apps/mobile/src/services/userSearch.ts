import { apiFetch } from './auth';

export type SearchFriendshipStatus = 'self' | 'none' | 'pending_incoming' | 'pending_outgoing' | 'accepted';

export type SearchUserResult = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  friendshipStatus: SearchFriendshipStatus;
  friendshipId: string | null;
};

type SearchUsersResponse = {
  users: SearchUserResult[];
};

const searchFriendshipStatuses: SearchFriendshipStatus[] = [
  'self',
  'none',
  'pending_incoming',
  'pending_outgoing',
  'accepted'
];

function normalizeFriendshipStatus(status: unknown): SearchFriendshipStatus {
  return searchFriendshipStatuses.includes(status as SearchFriendshipStatus)
    ? (status as SearchFriendshipStatus)
    : 'none';
}

export async function searchUsers(query: string, token: string) {
  const response = await apiFetch<SearchUsersResponse>(`/users/search?q=${encodeURIComponent(query)}`, undefined, token);

  return {
    users: response.users.map((user) => ({
      ...user,
      friendshipStatus: normalizeFriendshipStatus(user.friendshipStatus),
      friendshipId: user.friendshipId ?? null
    }))
  };
}
