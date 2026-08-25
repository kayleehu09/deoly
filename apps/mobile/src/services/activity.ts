import { apiFetch } from './auth';
import type { ReactionEmoji } from '../types/models';

export type ActivityNotificationType = 'friend_request_accepted' | 'post_reaction' | 'post_comment';

export type ActivityNotification = {
  id: string;
  type: ActivityNotificationType;
  message: string;
  createdAt: string;
  emoji: ReactionEmoji | null;
  postId: string | null;
  actor: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
};

type ActivityNotificationsResponse = {
  items: ActivityNotification[];
};

export function getActivityNotifications(token: string) {
  return apiFetch<ActivityNotificationsResponse>('/activity', undefined, token);
}
