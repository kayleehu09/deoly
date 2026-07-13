import { mockPosts } from '../data/mockPosts';
import { apiFetch } from './auth';
import type { FeedPost, Post, PostDuration, User } from '../types/models';
import { filterPermanentPostsForProfile, sortFeedPosts } from '../utils/postUtils';

let mockPostStore = [...mockPosts];

type BackendFeedPost = {
  id: string;
  body: string;
  kind: 'deoly' | 'permanent';
  visibility: 'friends' | 'close_circle';
  expiresAt: string | null;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
};

type BackendFeedResponse = {
  items: BackendFeedPost[];
};

type BackendCreatePostResponse = {
  post: BackendFeedPost;
};

const DEFAULT_PROFILE_IMAGE_URL = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80';

function toMobileFeedPost(post: BackendFeedPost): FeedPost {
  return {
    id: post.id,
    userId: post.author.id,
    imageUrl: null,
    caption: post.body,
    createdAt: post.createdAt,
    expiresAt: post.expiresAt,
    isPermanent: post.kind === 'permanent',
    isCloseFriend: post.visibility === 'close_circle',
    user: {
      id: post.author.id,
      username: post.author.username,
      displayName: post.author.displayName,
      profileImageUrl: post.author.avatarUrl ?? DEFAULT_PROFILE_IMAGE_URL,
      bio: '',
      friendIds: [],
      closeFriendIds: []
    }
  };
}

export async function getHomeFeedPosts(token: string): Promise<FeedPost[]> {
  const response = await apiFetch<BackendFeedResponse>('/feed', undefined, token);
  return response.items.map(toMobileFeedPost);
}

export async function getMockHomeFeedPosts(currentUser: User, users: User[]): Promise<FeedPost[]> {
  const visibleFriendPosts = sortFeedPosts(
    mockPostStore.filter((post) => {
      return post.userId === currentUser.id || currentUser.friendIds.includes(post.userId);
    }),
    currentUser
  );

  const feedPosts = await Promise.all(
    visibleFriendPosts.map(async (post) => {
      const user = users.find((item) => item.id === post.userId);

      if (!user) {
        throw new Error(`User ${post.userId} not found for post ${post.id}.`);
      }

      return {
        ...post,
        user,
        isCloseFriend: currentUser.closeFriendIds.includes(post.userId)
      };
    })
  );

  return feedPosts;
}

export async function getPermanentPostsForUser(userId: string, token?: string): Promise<Post[]> {
  if (token) {
    const response = await apiFetch<BackendFeedResponse>(`/posts/users/${userId}/permanent`, undefined, token);
    return response.items.map(toMobileFeedPost);
  }

  return filterPermanentPostsForProfile(mockPostStore, userId);
}

export async function createPost(input: {
  userId: string;
  imageUrl: string;
  caption: string;
  duration: PostDuration;
  token?: string;
}): Promise<Post> {
  if (input.token) {
    const response = await apiFetch<BackendCreatePostResponse>(
      '/posts',
      {
        method: 'POST',
        body: JSON.stringify({
          body: input.caption,
          visibility: 'friends',
          kind: input.duration === 'permanent' ? 'permanent' : 'deoly'
        })
      },
      input.token
    );

    return toMobileFeedPost(response.post);
  }

  const createdAt = new Date();

  const newPost: Post = {
    id: `post-${createdAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    imageUrl: input.imageUrl,
    caption: input.caption.trim(),
    createdAt: createdAt.toISOString(),
    expiresAt:
      input.duration === '24h' ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString() : null,
    isPermanent: input.duration === 'permanent'
  };

  mockPostStore = [newPost, ...mockPostStore];
  return newPost;
}

// Future Firestore/Storage shape:
// 1. Upload image bytes to Firebase Storage.
// 2. Create a Firestore document in `posts`.
// 3. Query friend-only feed with friendship edges and expiry filters.
// 4. Swap this in-memory store for Firestore listeners.
