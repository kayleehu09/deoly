import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, radii, spacing, typography } from '../constants/theme';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import {
  getActivityNotifications,
  type ActivityNotification
} from '../services/activity';
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  type FriendListItem
} from '../services/friends';
import type { RootStackParamList } from '../types/navigation';
import { formatRelativeTime } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'Activity'>;

const DEFAULT_AVATAR_URL = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80';
const FRIENDS_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeout: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

function FriendIdentity({ item }: { item: FriendListItem }) {
  return (
    <View style={styles.identity}>
      <Image source={{ uri: item.user.avatarUrl ?? DEFAULT_AVATAR_URL }} style={styles.avatar} />
      <View style={styles.identityText}>
        <Text style={styles.displayName}>{item.user.displayName}</Text>
        <Text style={styles.username}>@{item.user.username}</Text>
      </View>
    </View>
  );
}

export function ActivityScreen({ navigation }: Props) {
  const { auth } = useAuth();
  const { refreshAppData } = useAppData();
  const token = auth?.session.token;
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const incomingRequests = friends.filter((item) => item.direction === 'incoming' && item.status === 'pending');

  const refreshActivity = useCallback(async () => {
    if (!token) {
      setFriends([]);
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [friendsResponse, notificationsResponse] = await withTimeout(
        Promise.all([getFriends(token), getActivityNotifications(token)]),
        FRIENDS_TIMEOUT_MS,
        'Activity is taking too long to load.'
      );
      setFriends(friendsResponse.friends);
      setNotifications(notificationsResponse.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load activity.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshActivity();
  }, [refreshActivity]);

  async function runRequestAction(actionId: string, action: () => Promise<void>, refreshFeed = false) {
    if (!token || busyActionId) {
      return;
    }

    const previousFriends = friends;
    setBusyActionId(actionId);
    setError(null);
    setFriends((currentFriends) => currentFriends.filter((friend) => friend.friendshipId !== actionId));

    try {
      await withTimeout(
        action(),
        FRIENDS_TIMEOUT_MS,
        'Friend status is taking too long to update. Make sure the API is running, then try again.'
      );
      await refreshActivity();
      if (refreshFeed) {
        await refreshAppData();
      }
    } catch (err) {
      setFriends(previousFriends);
      setError(err instanceof Error ? err.message : 'Could not update activity.');
    } finally {
      setBusyActionId(null);
    }
  }

  function handleAcceptRequest(item: FriendListItem) {
    void runRequestAction(item.friendshipId, async () => {
      await acceptFriendRequest(item.friendshipId, token!);
    }, true);
  }

  function handleDeclineRequest(item: FriendListItem) {
    void runRequestAction(item.friendshipId, async () => {
      await declineFriendRequest(item.friendshipId, token!);
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Close activity"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Activity</Text>
          <Text style={styles.subtitle}>Friend requests and updates</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshActivity} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Updates</Text>
          {isLoading && notifications.length === 0 ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : null}
          {!isLoading && notifications.length === 0 ? <Text style={styles.emptyText}>No updates yet</Text> : null}
          {notifications.map((item) => (
            <Pressable
              accessibilityRole={item.postId ? 'button' : undefined}
              disabled={!item.postId}
              key={item.id}
              onPress={() => {
                if (item.postId) {
                  navigation.navigate('PostDetail', { postId: item.postId });
                }
              }}
              style={({ pressed }) => [styles.notificationRow, pressed ? styles.pressed : null]}
            >
              <Image source={{ uri: item.actor.avatarUrl ?? DEFAULT_AVATAR_URL }} style={styles.avatar} />
              <View style={styles.notificationText}>
                <Text style={styles.notificationMessage}>{item.message}</Text>
                <Text style={styles.notificationMeta}>@{item.actor.username} - {formatRelativeTime(item.createdAt)}</Text>
              </View>
              {item.postId ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friend requests</Text>
          {isLoading && incomingRequests.length === 0 ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : null}
          {!isLoading && incomingRequests.length === 0 ? <Text style={styles.emptyText}>No new activity</Text> : null}
          {incomingRequests.map((item) => (
            <View style={styles.row} key={item.friendshipId}>
              <FriendIdentity item={item} />
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={busyActionId === item.friendshipId}
                  onPress={() => handleAcceptRequest(item)}
                  style={({ pressed }) => [
                    styles.outlineButton,
                    pressed ? styles.pressed : null,
                    busyActionId === item.friendshipId ? styles.disabled : null
                  ]}
                >
                  <Text style={styles.outlineButtonText}>Accept request</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={busyActionId === item.friendshipId}
                  onPress={() => handleDeclineRequest(item)}
                  style={({ pressed }) => [
                    styles.ghostButton,
                    pressed ? styles.pressed : null,
                    busyActionId === item.friendshipId ? styles.disabled : null
                  ]}
                >
                  <Text style={styles.ghostButtonText}>Decline</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
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
    fontWeight: '700'
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 13
  },
  content: {
    gap: spacing.lg,
    padding: spacing.md,
    paddingBottom: spacing.xl
  },
  section: {
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 18,
    fontWeight: '700'
  },
  row: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
    padding: spacing.md
  },
  notificationRow: {
    minHeight: 72,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md
  },
  notificationText: {
    flex: 1,
    gap: 4
  },
  notificationMessage: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20
  },
  notificationMeta: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 12,
    lineHeight: 17
  },
  identity: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceMuted
  },
  identityText: {
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  outlineButton: {
    minHeight: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface
  },
  outlineButtonText: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700'
  },
  ghostButton: {
    minHeight: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface
  },
  ghostButtonText: {
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
