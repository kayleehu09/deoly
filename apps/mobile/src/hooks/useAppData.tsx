import { DEFAULT_AVATAR_URI } from '../constants/avatar';
import {
  createContext,
  useContext,
  useRef,
  useMemo,
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren
} from 'react';

import { useAuth } from './useAuth';
import {
  addComment,
  addReaction,
  createPost,
  deletePost,
  getHomeFeedPosts,
  getPermanentPostsForUser,
  getPostReactions,
  getRecentDeolyPosts,
  removeReaction,
  type PostProgressStage
} from '../services/posts';
import { blockUser } from '../services/safety';
import { isUnauthorizedApiError, type UserProfile } from '../services/auth';
import type { FeedPost, Post, PostReactionGroup, ReactionEmoji, User } from '../types/models';

type AppDataContextValue = {
  currentUser: User | null;
  users: User[];
  feedPosts: FeedPost[];
  profileDeolies: FeedPost[];
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
  deletePostById: (postId: string, options?: { refresh?: boolean }) => Promise<void>;
  blockUserById: (userId: string) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

const DEFAULT_PROFILE_IMAGE_URL = DEFAULT_AVATAR_URI;
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
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    profileImageUrl: user.avatarUrl ?? DEFAULT_PROFILE_IMAGE_URL,
    bio: user.bio ?? '',
    friendIds: [],
    closeFriendIds: []
  };
}

export function AppDataProvider({ children }: PropsWithChildren) {
  const { auth, isRestoring, clearSavedAuth } = useAuth();
  const currentUser = useMemo(() => auth ? toMobileUser(auth.user) : null, [auth]);
  const latestAuth = useRef(auth);
  latestAuth.current = auth;
  const loadSequence = useRef(0);
  const [users, setUsers] = useState<User[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [profileDeolies, setProfileDeolies] = useState<FeedPost[]>([]);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAppData = useCallback(async () => {
    const sequence = ++loadSequence.current;
    const isCurrent = () => sequence === loadSequence.current && auth === latestAuth.current;
    if (!auth) {
      setUsers([]);
      setFeedPosts([]);
      setProfileDeolies([]);
      setProfilePosts([]);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    try {
      setLoadError(null);
      const authenticatedUser = toMobileUser(auth.user);
      const allUsers = [authenticatedUser];
      const [homeFeed, recentDeolies, permanentPosts] = await withTimeout(
        Promise.all([
          getHomeFeedPosts(auth.session.token),
          getRecentDeolyPosts(auth.session.token),
          getPermanentPostsForUser(authenticatedUser.id, auth.session.token)
        ]),
        APP_DATA_TIMEOUT_MS,
        'Feed data is taking too long to load.'
      );

      if (!isCurrent()) return;
      setUsers(allUsers);
      setFeedPosts(homeFeed);
      setProfileDeolies(recentDeolies);
      setProfilePosts(permanentPosts);
    } catch (err) {
      if (!isCurrent()) return;
      setFeedPosts([]);
      setProfileDeolies([]);
      setProfilePosts([]);

      if (isUnauthorizedApiError(err)) {
        setUsers([]);
        setLoadError(null);
        await clearSavedAuth();
        return;
      }

      setLoadError(err instanceof Error ? err.message : 'Could not load app data.');
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, [auth, clearSavedAuth]);

  useEffect(() => {
    if (isRestoring) {
      return;
    }

    void (async () => {
      setIsLoading(true);
      await loadAppData();
    })();
  }, [loadAppData, isRestoring]);

  const refreshAppData = useCallback(async () => {
    setIsLoading(true);
    await loadAppData();
  }, [loadAppData]);

  const value: AppDataContextValue = {
    currentUser,
    users,
    feedPosts,
    profileDeolies,
    profilePosts,
    isLoading,
    loadError,
    refreshAppData,
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
    deletePostById: async (postId, options = {}) => {
      if (!auth) {
        return;
      }

      await deletePost(postId, auth.session.token);

      if (options.refresh === false) {
        return;
      }

      setFeedPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
      setProfileDeolies((currentPosts) => currentPosts.filter((post) => post.id !== postId));
      setProfilePosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
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
