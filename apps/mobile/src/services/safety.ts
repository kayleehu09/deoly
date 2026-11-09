import { apiFetch } from './auth';

export type BlockedUser = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

export type BlockListItem = {
  id: string;
  user: BlockedUser;
  createdAt: string;
};

type BlocksResponse = {
  blocks: BlockListItem[];
};

export function getBlockedUsers(token: string) {
  return apiFetch<BlocksResponse>('/safety/blocks', undefined, token);
}

export function submitPostReport(postId: string, reason: string, details: string, token: string) {
  return apiFetch<{ reportId: string }>(
    `/safety/posts/${encodeURIComponent(postId)}/reports`,
    { method: 'POST', body: JSON.stringify({ reason, details: details.trim() || undefined }) },
    token
  );
}

export function blockUser(userId: string, token: string) {
  return apiFetch<{ blockId: string }>(
    '/safety/blocks',
    {
      method: 'POST',
      body: JSON.stringify({ userId })
    },
    token
  );
}

export function unblockUser(userId: string, token: string) {
  return apiFetch<void>(
    `/safety/blocks/${userId}`,
    {
      method: 'DELETE'
    },
    token
  );
}
