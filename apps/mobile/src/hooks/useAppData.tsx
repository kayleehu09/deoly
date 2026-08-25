import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from 'react';

import { mockUsers } from '../data/mockUsers';
import { useAuth } from './useAuth';
import {
  addComment,
  addReaction,
  createPost,
  getHomeFeedPosts,
  getPermanentPostsForUser,
  getPostReactions,
  removeReaction,
  type PostProgressStage
} from '../services/posts';
import { blockUser } from '../services/safety';
import { getAllUsers } from '../services/users';
import { isUnauthorizedApiError, type UserProfile } from '../services/auth';
import type { FeedPost, Post, PostReactionGroup, ReactionEmoji, User } from '../types/models';

type AppDataContextValue = {
  currentUser: User | null;
  users: User[];
  feedPosts: FeedPost[];
  profilePosts: Post[];
  isLoading: boolean;
  loadError: string | null;
  refreshAppData: () => Promise<void>;
  publishPost: (input: {
    imageUrl: string;
    caption: string;
    onProgress?: (stage: PostProgressStage) => void;
  }) => Promise<void>;
  togglePostReaction: (post: FeedPost, emoji: ReactionEmoji) => Promise<void>;
  loadPostReactions: (postId: string, emoji: ReactionEmoji) => Promise<PostReactionGroup[]>;
  commentOnPost: (postId: string, body: string) => Promise<void>;
  blockUserById: (userId: string) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

const DEFAULT_PROFILE_IMAGE_URL = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80';
const APP_DATA_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeout: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

function toMobileUser(user: UserProfile): User {
  const demoFriendIds = mockUsers.map((item) => item.id);

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    profileImageUrl: user.avatarUrl ?? DEFAULT_PROFILE_IMAGE_URL,
    bio: user.bio ?? '',
    friendIds: demoFriendIds,
    closeFriendIds: demoFriendIds.slice(0, 2)
  };
}

export function AppDataProvider({ children }: PropsWithChildren) {
  const { auth, isRestoring, clearSavedAuth } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAppData = async () => {
    if (!auth) {
      setCurrentUser(null);
      setUsers([]);
      setFeedPosts([]);
      setProfilePosts([]);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    try {
      setLoadError(null);
      const authenticatedUser = toMobileUser(auth.user);
      const allUsers = [authenticatedUser, ...(await getAllUsers()).filter((user) => user.id !== authenticatedUser.id)];
      const [homeFeed, permanentPosts] = await withTimeout(
        Promise.all([
          getHomeFeedPosts(auth.session.token),
          getPermanentPostsForUser(authenticatedUser.id, auth.session.token)
        ]),
        APP_DATA_TIMEOUT_MS,
        'Feed data is taking too long to load.'
      );

      setCurrentUser(authenticatedUser);
      setUsers(allUsers);
      setFeedPosts(homeFeed);
      setProfilePosts(permanentPosts);
    } catch (err) {
      setFeedPosts([]);
      setProfilePosts([]);

      if (isUnauthorizedApiError(err)) {
        setCurrentUser(null);
        setUsers([]);
        setLoadError(null);
        await clearSavedAuth();
        return;
      }

      setLoadError(err instanceof Error ? err.message : 'Could not load app data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isRestoring) {
      return;
    }

    void (async () => {
      setIsLoading(true);
      await loadAppData();
    })();
  }, [auth, isRestoring]);

  const value: AppDataContextValue = {
    currentUser,
    users,
    feedPosts,
    profilePosts,
    isLoading,
    loadError,
    refreshAppData: async () => {
      setIsLoading(true);
      await loadAppData();
    },
    publishPost: async ({ imageUrl, caption, onProgress }) => {
      if (!currentUser || !auth) {
        return;
      }

      await createPost({
        userId: currentUser.id,
        imageUrl,
        caption,
        token: auth.session.token,
        onProgress
      });

      onProgress?.('refreshing');
      setIsLoading(true);
      await loadAppData();
      onProgress?.('done');
    },
    togglePostReaction: async (post, emoji) => {
      if (!auth) {
        return;
      }

      if (post.viewerReactions.includes(emoji)) {
        await removeReaction(post.id, emoji, auth.session.token);
      } else {
        await addReaction(post.id, emoji, auth.session.token);
      }

      await loadAppData();
    },
    loadPostReactions: async (postId, emoji) => {
      if (!auth) {
        return [];
      }

      return getPostReactions(postId, emoji, auth.session.token);
    },
    commentOnPost: async (postId, body) => {
      if (!auth) {
        return;
      }

      await addComment(postId, body, auth.session.token);
      await loadAppData();
    },
    blockUserById: async (userId) => {
      if (!auth) {
        return;
      }

      await blockUser(userId, auth.session.token);
      await loadAppData();
    }
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider.');
  }

  return context;
}
