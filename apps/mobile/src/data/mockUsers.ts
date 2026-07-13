import type { User } from '../types/models';

export const mockUsers: User[] = [
  {
    id: 'user-ava',
    username: 'avafaith',
    displayName: 'Ava Grace',
    profileImageUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    bio: 'Learning to stay rooted, one small yes at a time.',
    friendIds: ['user-noah', 'user-zoe', 'user-luca'],
    closeFriendIds: ['user-zoe', 'user-noah']
  },
  {
    id: 'user-noah',
    username: 'noah.walks',
    displayName: 'Noah Walker',
    profileImageUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    bio: 'Early mornings, basketball, and the Psalms.',
    friendIds: ['user-ava', 'user-zoe'],
    closeFriendIds: ['user-ava']
  },
  {
    id: 'user-zoe',
    username: 'zoelight',
    displayName: 'Zoe Carter',
    profileImageUrl:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80',
    bio: 'Trying to notice God in ordinary days.',
    friendIds: ['user-ava', 'user-noah', 'user-luca'],
    closeFriendIds: ['user-ava', 'user-luca']
  },
  {
    id: 'user-luca',
    username: 'luca.notes',
    displayName: 'Luca James',
    profileImageUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    bio: 'Posting the moments that feel like answered prayers.',
    friendIds: ['user-ava', 'user-zoe'],
    closeFriendIds: ['user-zoe']
  }
];
