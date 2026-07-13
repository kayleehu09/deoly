import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, radii, spacing, typography } from '../constants/theme';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  removeFriend,
  type FriendListItem
} from '../services/friends';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileFriends'>;

const DEFAULT_AVATAR_URL = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80';
const FRIENDS_TIMEOUT_MS = 12000;
const ACCEPT_ANIMATION_MS = 760;
const CANCEL_CONFIRM_MS = 2200;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeout: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

function FriendIdentity({ item, onPress }: { item: FriendListItem; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`Open ${item.user.displayName}'s profile`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.identity, pressed ? styles.pressed : null]}
    >
      <Image source={{ uri: item.user.avatarUrl ?? DEFAULT_AVATAR_URL }} style={styles.avatar} />
      <View style={styles.identityText}>
        <Text style={styles.displayName}>{item.user.displayName}</Text>
        <Text style={styles.username}>@{item.user.username}</Text>
      </View>
    </Pressable>
  );
}

function friendSortPriority(item: FriendListItem) {
  if (item.direction === 'incoming' && item.status === 'pending') {
    return 0;
  }

  if (item.direction === 'outgoing' && item.status === 'pending') {
    return 1;
  }

  return 2;
}

function getFriendActivityTime(item: FriendListItem) {
  const timestamp = item.acceptedAt ?? item.createdAt;
  return new Date(timestamp).getTime();
}

export function ProfileFriendsScreen({ navigation }: Props) {
  const { auth } = useAuth();
  const { refreshAppData } = useAppData();
  const token = auth?.session.token;
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyFriendshipId, setBusyFriendshipId] = useState<string | null>(null);
  const [acceptingFriendshipId, setAcceptingFriendshipId] = useState<string | null>(null);
  const [cancelConfirmFriendshipId, setCancelConfirmFriendshipId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const acceptSlide = useRef(new Animated.Value(0)).current;
  const friendsToast = useRef(new Animated.Value(0)).current;
  const cancelConfirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmedQuery = query.trim().toLowerCase();
  const visibleFriends = useMemo(() => {
    const sortedFriends = [...friends]
      .filter((item) => {
        return (
          (item.direction === 'incoming' && item.status === 'pending') ||
          (item.direction === 'outgoing' && item.status === 'pending') ||
          (item.direction === 'accepted' && item.status === 'accepted')
        );
      })
      .sort((a, b) => {
        const priorityDifference = friendSortPriority(a) - friendSortPriority(b);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return getFriendActivityTime(b) - getFriendActivityTime(a);
      });

    if (!trimmedQuery) {
      return sortedFriends;
    }

    return sortedFriends.filter((item) => {
      return (
        item.user.displayName.toLowerCase().includes(trimmedQuery) ||
        item.user.username.toLowerCase().includes(trimmedQuery)
      );
    });
  }, [friends, trimmedQuery]);

  const refreshFriends = useCallback(async () => {
    if (!token) {
      setFriends([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await withTimeout(
        getFriends(token),
        FRIENDS_TIMEOUT_MS,
        'Friends are taking too long to load.'
      );
      setFriends(response.friends);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load friends.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void refreshFriends();
    }, [refreshFriends])
  );

  useEffect(() => {
    return () => {
      if (cancelConfirmTimer.current) {
        clearTimeout(cancelConfirmTimer.current);
      }
    };
  }, []);

  async function runFriendAction(item: FriendListItem, action: () => Promise<void>, errorMessage: string) {
    if (!token || busyFriendshipId) {
      return;
    }

    const previousFriends = friends;
    setBusyFriendshipId(item.friendshipId);
    setError(null);
    setFriends((currentFriends) => currentFriends.filter((friend) => friend.friendshipId !== item.friendshipId));

    void (async () => {
      try {
        await withTimeout(
          action(),
          FRIENDS_TIMEOUT_MS,
          'Friend status is taking too long to update. Make sure the API is running, then try again.'
        );
        await refreshFriends();
        await refreshAppData();
      } catch (err) {
        setFriends(previousFriends);
        setError(err instanceof Error ? err.message : errorMessage);
      } finally {
        setBusyFriendshipId(null);
      }
    })();
  }

  function runAcceptAnimation() {
    acceptSlide.setValue(0);
    friendsToast.setValue(0);

    return new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.timing(acceptSlide, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.sequence([
          Animated.delay(130),
          Animated.timing(friendsToast, {
            toValue: 1,
            duration: ACCEPT_ANIMATION_MS - 130,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          })
        ])
      ]).start(() => resolve());
    });
  }

  function handleAcceptRequest(item: FriendListItem) {
    if (!token || busyFriendshipId) {
      return;
    }

    const previousFriends = friends;
    setBusyFriendshipId(item.friendshipId);
    setAcceptingFriendshipId(item.friendshipId);
    setError(null);

    void (async () => {
      try {
        await Promise.all([
          runAcceptAnimation(),
          withTimeout(
            acceptFriendRequest(item.friendshipId, token),
            FRIENDS_TIMEOUT_MS,
            'Friend status is taking too long to update. Make sure the API is running, then try again.'
          )
        ]);

        setFriends((currentFriends) =>
          currentFriends.map((friend) =>
            friend.friendshipId === item.friendshipId
              ? {
                  ...friend,
                  acceptedAt: new Date().toISOString(),
                  direction: 'accepted',
                  status: 'accepted'
                }
              : friend
          )
        );
        await refreshFriends();
        await refreshAppData();
      } catch (err) {
        setFriends(previousFriends);
        setError(err instanceof Error ? err.message : 'Could not accept request.');
      } finally {
        setAcceptingFriendshipId(null);
        setBusyFriendshipId(null);
        acceptSlide.setValue(0);
        friendsToast.setValue(0);
      }
    })();
  }

  function handleDeclineRequest(item: FriendListItem) {
    void runFriendAction(item, () => declineFriendRequest(item.friendshipId, token!), 'Could not decline request.');
  }

  function handleCancelRequest(item: FriendListItem) {
    if (cancelConfirmFriendshipId !== item.friendshipId) {
      setCancelConfirmFriendshipId(item.friendshipId);

      if (cancelConfirmTimer.current) {
        clearTimeout(cancelConfirmTimer.current);
      }

      cancelConfirmTimer.current = setTimeout(() => {
        setCancelConfirmFriendshipId(null);
        cancelConfirmTimer.current = null;
      }, CANCEL_CONFIRM_MS);
      return;
    }

    if (cancelConfirmTimer.current) {
      clearTimeout(cancelConfirmTimer.current);
      cancelConfirmTimer.current = null;
    }

    setCancelConfirmFriendshipId(null);
    void runFriendAction(item, () => removeFriend(item.friendshipId, token!), 'Could not cancel request.');
  }

  function openFriendProfile(item: FriendListItem) {
    navigation.navigate('FriendProfile', {
      userId: item.user.id,
      user: {
        id: item.user.id,
        username: item.user.username,
        displayName: item.user.displayName,
        profileImageUrl: item.user.avatarUrl ?? DEFAULT_AVATAR_URL
      },
      friendship: {
        friendshipId: item.friendshipId,
        direction: item.direction,
        status: item.status
      }
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Close friends"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Friends</Text>
          <Text style={styles.subtitle}>People connected to your feed</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshFriends} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search friends"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          {query ? (
            <Pressable
              accessibilityLabel="Clear friends search"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setQuery('')}
              style={({ pressed }) => pressed ? styles.pressed : null}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {isLoading && visibleFriends.length === 0 ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : null}
        {!isLoading && friends.length === 0 ? <Text style={styles.emptyText}>No friends or requests yet</Text> : null}
        {!isLoading && friends.length > 0 && visibleFriends.length === 0 ? (
          <Text style={styles.emptyText}>No people match that search</Text>
        ) : null}
        {visibleFriends.map((item) => (
          <View style={styles.row} key={item.friendshipId}>
            {acceptingFriendshipId === item.friendshipId ? (
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.friendsToast,
                  {
                    opacity: friendsToast.interpolate({
                      inputRange: [0, 0.18, 1],
                      outputRange: [0, 1, 0]
                    }),
                    transform: [
                      {
                        translateY: friendsToast.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -26]
                        })
                      }
                    ]
                  }
                ]}
              >
                Friends!
              </Animated.Text>
            ) : null}
            <FriendIdentity item={item} onPress={() => openFriendProfile(item)} />
            {item.direction === 'incoming' && item.status === 'pending' ? (
              <View style={styles.iconActions}>
                <Animated.View
                  style={
                    acceptingFriendshipId === item.friendshipId
                      ? {
                          transform: [
                            {
                              translateX: acceptSlide.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 40]
                              })
                            }
                          ]
                        }
                      : null
                  }
                >
                  <Pressable
                    accessibilityLabel="Accept friend request"
                    accessibilityRole="button"
                    disabled={busyFriendshipId === item.friendshipId}
                    onPress={() => handleAcceptRequest(item)}
                    style={({ pressed }) => [
                      styles.iconActionButton,
                      styles.acceptButton,
                      pressed ? styles.pressed : null,
                      busyFriendshipId === item.friendshipId ? styles.disabled : null
                    ]}
                  >
                    <Ionicons name="checkmark" size={18} color={colors.surface} />
                  </Pressable>
                </Animated.View>
                <Animated.View
                  style={
                    acceptingFriendshipId === item.friendshipId
                      ? {
                          opacity: acceptSlide.interpolate({
                            inputRange: [0, 0.7, 1],
                            outputRange: [1, 0.28, 0]
                          })
                        }
                      : null
                  }
                >
                  <Pressable
                    accessibilityLabel="Decline friend request"
                    accessibilityRole="button"
                    disabled={busyFriendshipId === item.friendshipId}
                    onPress={() => handleDeclineRequest(item)}
                    style={({ pressed }) => [
                      styles.iconActionButton,
                      pressed ? styles.pressed : null,
                      busyFriendshipId === item.friendshipId ? styles.disabled : null
                    ]}
                  >
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </Pressable>
                </Animated.View>
              </View>
            ) : null}
            {item.direction === 'outgoing' && item.status === 'pending' ? (
              <Pressable
                accessibilityLabel={
                  cancelConfirmFriendshipId === item.friendshipId
                    ? 'Confirm cancel friend request'
                    : 'Prepare to cancel friend request'
                }
                accessibilityRole="button"
                disabled={busyFriendshipId === item.friendshipId}
                onPress={() => handleCancelRequest(item)}
                style={({ pressed }) => [
                  styles.statusPill,
                  pressed ? styles.pressed : null,
                  busyFriendshipId === item.friendshipId ? styles.disabled : null
                ]}
              >
                <Text style={styles.statusPillText}>
                  {cancelConfirmFriendshipId === item.friendshipId ? 'Cancel?' : 'Requested'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  headerText: {
    flex: 1,
    gap: 2
  },
  title: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 26,
    fontWeight: '800'
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 13
  },
  content: {
    gap: spacing.xs,
    padding: spacing.md,
    paddingBottom: spacing.xl
  },
  searchBox: {
    minHeight: 46,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    paddingVertical: spacing.sm
  },
  row: {
    minHeight: 56,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    overflow: 'visible'
  },
  identity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceMuted
  },
  identityText: {
    flex: 1,
    minWidth: 0,
    gap: 2
  },
  displayName: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 15,
    fontWeight: '800'
  },
  username: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 13
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  iconActionButton: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  acceptButton: {
    borderColor: colors.text,
    backgroundColor: colors.text
  },
  friendsToast: {
    position: 'absolute',
    right: spacing.md,
    top: -4,
    zIndex: 2,
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 13,
    fontWeight: '700'
  },
  statusPill: {
    minHeight: 34,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface
  },
  statusPillText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700'
  },
  loadingRow: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    lineHeight: 20
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    lineHeight: 19
  },
  pressed: {
    opacity: 0.72
  },
  disabled: {
    opacity: 0.54
  }
});
