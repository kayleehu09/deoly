import { mockPosts } from '../data/mockPosts';
import { apiFetch } from './auth';
import type { FeedPost, Post, User } from '../types/models';
import { filterPermanentPostsForProfile, sortFeedPosts } from '../utils/postUtils';

let mockPostStore = [...mockPosts];

type BackendFeedPost = {
  id: string;
  body: string;
  imageUrl: string | null;
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

type BackendCreateMediaUploadResponse = {
  objectKey: string;
  uploadUrl: string;
  expiresAt: string;
  headers: Record<string, string>;
};

const DEFAULT_PROFILE_IMAGE_URL = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80';
const POST_IMAGE_CONTENT_TYPE = 'image/jpeg';

export type PostProgressStage = 'preparing' | 'uploading' | 'creating' | 'refreshing' | 'done';

function toMobileFeedPost(post: BackendFeedPost): FeedPost {
  return {
    id: post.id,
    userId: post.author.id,
    imageUrl: post.imageUrl,
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

async function uploadPostImage(imageUri: string, token: string, onProgress?: (stage: PostProgressStage) => void) {
  onProgress?.('preparing');
  const imageResponse = await fetch(imageUri);

  if (!imageResponse.ok) {
    throw new Error('Could not read the captured photo.');
  }

  const imageBlob = await imageResponse.blob();
  const upload = await apiFetch<BackendCreateMediaUploadResponse>(
    '/media/uploads',
    {
      method: 'POST',
      body: JSON.stringify({
        contentType: POST_IMAGE_CONTENT_TYPE,
        byteSize: imageBlob.size
      })
    },
    token
  );

  onProgress?.('uploading');
  const uploadResponse = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: upload.headers,
    body: imageBlob
  });

  if (!uploadResponse.ok) {
    throw new Error('Photo upload failed. Please try again.');
  }

  return upload.objectKey;
}

export async function createPost(input: {
  userId: string;
  imageUrl: string;
  caption: string;
  token?: string;
  onProgress?: (stage: PostProgressStage) => void;
}): Promise<Post> {
  if (input.token) {
    const imageObjectKey = await uploadPostImage(input.imageUrl, input.token, input.onProgress);
    input.onProgress?.('creating');
    const response = await apiFetch<BackendCreatePostResponse>(
      '/posts',
      {
        method: 'POST',
        body: JSON.stringify({
          body: input.caption,
          imageObjectKey,
          visibility: 'friends',
          kind: 'deoly'
        })
      },
      input.token
    );

    return toMobileFeedPost(response.post);
  }

  input.onProgress?.('preparing');
  const createdAt = new Date();

  const newPost: Post = {
    id: `post-${createdAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    imageUrl: input.imageUrl,
    caption: input.caption.trim(),
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    isPermanent: false
  };

  mockPostStore = [newPost, ...mockPostStore];
  return newPost;
}

// Provider-specific photo storage stays behind the API so the mobile app can
// keep the same posting flow if storage providers change later.
