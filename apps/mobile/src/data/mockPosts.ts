import type { Post } from '../types/models';

const now = Date.now();
const hour = 60 * 60 * 1000;

export const mockPosts: Post[] = [
  {
    id: 'post-1',
    userId: 'user-zoe',
    imageUrl:
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80',
    caption: 'Sunrise walk before school. Needed this reminder that mercies really are new.',
    createdAt: new Date(now - hour * 2).toISOString(),
    expiresAt: new Date(now + hour * 22).toISOString(),
    isPermanent: false
  },
  {
    id: 'post-2',
    userId: 'user-noah',
    imageUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    caption: 'Today’s devo and a quiet gym before practice.',
    createdAt: new Date(now - hour * 5).toISOString(),
    expiresAt: null,
    isPermanent: true
  },
  {
    id: 'post-3',
    userId: 'user-luca',
    imageUrl:
      'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=900&q=80',
    caption: 'Thankful for a little peace after a loud week.',
    createdAt: new Date(now - hour * 9).toISOString(),
    expiresAt: new Date(now + hour * 15).toISOString(),
    isPermanent: false
  },
  {
    id: 'post-4',
    userId: 'user-ava',
    imageUrl:
      'https://images.unsplash.com/photo-1495465798138-718f86d1a4bc?auto=format&fit=crop&w=900&q=80',
    caption: 'Keeping this one. Felt like the kind of day I want to remember later.',
    createdAt: new Date(now - hour * 27).toISOString(),
    expiresAt: null,
    isPermanent: true
  },
  {
    id: 'post-5',
    userId: 'user-noah',
    imageUrl:
      'https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=900&q=80',
    caption: 'Expired mock post should never show up in the feed.',
    createdAt: new Date(now - hour * 30).toISOString(),
    expiresAt: new Date(now - hour * 6).toISOString(),
    isPermanent: false
  }
];
