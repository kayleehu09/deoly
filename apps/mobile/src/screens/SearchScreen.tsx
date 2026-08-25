import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import { colors, radii, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import {
  acceptFriendRequest,
  removeFriend,
  sendFriendRequest
} from '../services/friends';
import { searchUsers, type SearchFriendshipStatus, type SearchUserResult } from '../services/userSearch';

const DEFAULT_AVATAR_URL = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80';
const MIN_SEARCH_LENGTH = 2;
const EMPTY_SEARCH_QUERY = '';
const SEARCH_TIMEOUT_MS = 12000;
const FRIEND_ACTION_TIMEOUT_MS = 12000;

const statusLabels: Record<SearchFriendshipStatus, string> = {
  self: 'You',
  none: 'Add friend',
  pending_incoming: 'Accept request',
  pending_outgoing: 'Requested',
  accepted: 'Friends'
};

const statusTone: Record<SearchFriendshipStatus, 'default' | 'outline' | 'muted' | 'success'> = {
  self: 'muted',
  none: 'default',
  pending_incoming: 'outline',
  pending_outgoing: 'muted',
  accepted: 'success'
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeout: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

function UserResultRow({
  user,
  isBusy,
  onPress
}: {
  user: SearchUserResult;
  isBusy: boolean;
  onPress: (user: SearchUserResult) => void;
}) {
  const tone = statusTone[user.friendshipStatus];
  const canCancelOutgoingRequest = user.friendshipStatus === 'pending_outgoing' && Boolean(user.friendshipId);
  const canAct =
    user.friendshipStatus === 'none' || user.friendshipStatus === 'pending_incoming' || canCancelOutgoingRequest;

  return (
    <View style={styles.resultRow}>
      <Image source={{ uri: user.avatarUrl ?? DEFAULT_AVATAR_URL }} style={styles.avatar} />
      <View style={styles.userMeta}>
        <Text style={styles.displayName}>{user.displayName}</Text>
        <Text style={styles.username}>@{user.username}</Text>
      </View>
      {user.friendshipStatus === 'self' ? null : (
        <Pressable
          accessibilityRole={canAct ? 'button' : undefined}
          disabled={!canAct || isBusy}
          onPress={() => onPress(user)}
          style={({ pressed }) => [
            styles.statusPill,
            styles[`${tone}StatusPill`],
            canAct && pressed ? styles.pressedPill : null,
            isBusy ? styles.disabledPill : null
          ]}
        >
          <Text style={[styles.statusText, styles[`${tone}StatusText`]]}>
            {statusLabels[user.friendshipStatus]}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function SearchScreen() {
  const { auth } = useAuth();
  const searchRequestId = useRef(0);
  const friendActionRequestId = useRef(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= MIN_SEARCH_LENGTH;
  const shouldShowSuggestions = trimmedQuery.length === 0;
  const canLoadUsers = shouldShowSuggestions || canSearch;
  const token = auth?.session.token;

  const refreshSearchResults = async () => {
    if (!token || !canLoadUsers) {
      setResults([]);
      return;
    }

    const response = await withTimeout(
      searchUsers(shouldShowSuggestions ? EMPTY_SEARCH_QUERY : trimmedQuery, token),
      SEARCH_TIMEOUT_MS,
      'Search is taking too long. Check that the API is running, then try again.'
    );
    setResults(response.users);
  };

  const replaceSearchResult = (userId: string, changes: Partial<SearchUserResult>) => {
    setResults((currentResults) =>
      currentResults.map((result) =>
        result.id === userId
          ? {
              ...result,
              ...changes
            }
          : result
      )
    );
  };

  const handleQueryChange = useCallback((nextQuery: string) => {
    setQuery(nextQuery);
  }, []);

  const runSearch = useCallback(
    async (searchTerm = trimmedQuery) => {
      const normalizedSearchTerm = searchTerm.trim();

      if (!token) {
        setResults([]);
        setIsLoading(false);
        setError('Sign in again before searching for friends.');
        return;
      }

      if (normalizedSearchTerm.length > 0 && normalizedSearchTerm.length < MIN_SEARCH_LENGTH) {
        setResults([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      const requestId = searchRequestId.current + 1;
      searchRequestId.current = requestId;

      setIsLoading(true);
      setError(null);

      try {
        const response = await withTimeout(
          searchUsers(normalizedSearchTerm, token),
          SEARCH_TIMEOUT_MS,
          'Search is taking too long. Check that the API is running, then try again.'
        );

        if (searchRequestId.current === requestId) {
          setResults(response.users);
        }
      } catch (err) {
        if (searchRequestId.current === requestId) {
          setResults([]);
          setError(err instanceof Error ? err.message : 'Could not search users.');
        }
      } finally {
        if (searchRequestId.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [token, trimmedQuery]
  );

  useEffect(() => {
    if (!canLoadUsers) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const searchTimer = setTimeout(() => {
      void runSearch(trimmedQuery);
    }, 300);

    return () => {
      clearTimeout(searchTimer);
    };
  }, [canLoadUsers, runSearch, trimmedQuery]);

  async function runFriendAction({
    actionId,
    action,
    rollback
  }: {
    actionId: string;
    action: () => Promise<void>;
    rollback: () => void;
  }) {
    if (!token || busyActionId) {
      return;
    }

    setBusyActionId(actionId);
    setError(null);
    const requestId = friendActionRequestId.current + 1;
    friendActionRequestId.current = requestId;

    try {
      await withTimeout(
        action().then(async () => {
          if (friendActionRequestId.current === requestId) {
            await refreshSearchResults();
          }
        }),
        FRIEND_ACTION_TIMEOUT_MS,
        'Friend status is taking too long to update. Make sure the API is running, then try again.'
      );
    } catch (err) {
      friendActionRequestId.current = requestId + 1;
      rollback();
      setError(err instanceof Error ? err.message : 'Could not update friends.');
    } finally {
      if (friendActionRequestId.current === requestId) {
        friendActionRequestId.current = requestId + 1;
      }
      setBusyActionId(null);
    }
  }

  function handleSearchUserPress(user: SearchUserResult) {
    if (!token) {
      return;
    }

    if (user.friendshipStatus === 'none') {
      replaceSearchResult(user.id, { friendshipStatus: 'pending_outgoing' });

      void runFriendAction({
        actionId: user.id,
        action: async () => {
          await sendFriendRequest(user.id, token);
        },
        rollback: () => {
          replaceSearchResult(user.id, {
            friendshipId: user.friendshipId,
            friendshipStatus: user.friendshipStatus
          });
        }
      });
      return;
    }

    if (user.friendshipStatus === 'pending_incoming' && user.friendshipId) {
      replaceSearchResult(user.id, { friendshipStatus: 'accepted' });

      void runFriendAction({
        actionId: user.friendshipId,
        action: async () => {
          await acceptFriendRequest(user.friendshipId!, token);
        },
        rollback: () => {
          replaceSearchResult(user.id, {
            friendshipId: user.friendshipId,
            friendshipStatus: user.friendshipStatus
          });
        }
      });
    }

    if (user.friendshipStatus === 'pending_outgoing' && user.friendshipId) {
      replaceSearchResult(user.id, { friendshipId: null, friendshipStatus: 'none' });

      void runFriendAction({
        actionId: user.friendshipId,
        action: async () => {
          await removeFriend(user.friendshipId!, token);
        },
        rollback: () => {
          replaceSearchResult(user.id, {
            friendshipId: user.friendshipId,
            friendshipStatus: user.friendshipStatus
          });
        }
      });
    }
  }

  function isSearchResultBusy(user: SearchUserResult) {
    return Boolean(
      busyActionId && (busyActionId === user.id || (user.friendshipId && busyActionId === user.friendshipId))
    );
  }

  const helperText = useMemo(() => {
    if (!canSearch) {
      return shouldShowSuggestions ? 'Suggested people on Deoly.' : 'Type at least 2 characters to find people.';
    }

    if (error) {
      return error;
    }

    return null;
  }, [canSearch, error, shouldShowSuggestions]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            onChangeText={handleQueryChange}
            onSubmitEditing={() => void runSearch()}
            placeholder="Search people, posts, and communities"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
        </View>

        {helperText ? (
          <Text style={[styles.helperText, error ? styles.errorText : null]}>{helperText}</Text>
        ) : null}
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <UserResultRow
              isBusy={isSearchResultBusy(item)}
              onPress={handleSearchUserPress}
              user={item}
            />
          )}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            canLoadUsers && !isLoading && !error ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{shouldShowSuggestions ? 'No suggestions yet' : 'No people found'}</Text>
                <Text style={styles.emptyText}>
                  {shouldShowSuggestions ? 'People who join the app will show here.' : 'Try a different name or username.'}
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.background
  },
  searchBox: {
    minHeight: 44,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 16
  },
  helperText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    lineHeight: 19,
    paddingTop: spacing.sm
  },
  errorText: {
    color: colors.danger
  },
  resultsContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm
  },
  resultRow: {
    minHeight: 76,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceMuted
  },
  userMeta: {
    flex: 1,
    gap: 3
  },
  displayName: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 16,
    fontWeight: '700'
  },
  username: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 13
  },
  statusPill: {
    minHeight: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  pressedPill: {
    opacity: 0.72
  },
  disabledPill: {
    opacity: 0.64
  },
  defaultStatusPill: {
    backgroundColor: colors.text
  },
  outlineStatusPill: {
    borderWidth: 1,
    borderColor: colors.text,
    backgroundColor: colors.surface
  },
  mutedStatusPill: {
    backgroundColor: colors.accentSoft
  },
  successStatusPill: {
    backgroundColor: 'rgba(45, 106, 79, 0.12)'
  },
  statusText: {
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700'
  },
  defaultStatusText: {
    color: colors.surface
  },
  outlineStatusText: {
    color: colors.text
  },
  mutedStatusText: {
    color: colors.textMuted
  },
  successStatusText: {
    color: colors.success
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 72
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 18,
    fontWeight: '700'
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    lineHeight: 20
  }
});
