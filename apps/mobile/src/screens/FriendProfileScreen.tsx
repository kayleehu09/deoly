import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AvatarPreviewModal } from '../components/AvatarPreviewModal';
import { PostCard } from '../components/PostCard';
import { colors, radii, spacing, typography } from '../constants/theme';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { acceptFriendRequest, declineFriendRequest, removeFriend } from '../services/friends';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'FriendProfile'>;
type FriendshipSnapshot = NonNullable<RootStackParamList['FriendProfile']['friendship']>;

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

export function FriendProfileScreen({ navigation, route }: Props) {
  const { auth } = useAuth();
  const { users, feedPosts, refreshAppData, blockUserById } = useAppData();
  const [isHeaderAvatarVisible, setIsHeaderAvatarVisible] = useState(false);
  const [isSafetyMenuVisible, setIsSafetyMenuVisible] = useState(false);
  const [friendship, setFriendship] = useState<FriendshipSnapshot | null>(route.params.friendship ?? null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [hideVisiblePosts, setHideVisiblePosts] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const userId = route.params.userId;
  const userPosts = useMemo(() => feedPosts.filter((post) => post.userId === userId), [feedPosts, userId]);
  const visibleUserPosts = hideVisiblePosts ? [] : userPosts;
  const snapshotUser = route.params.user
    ? {
        id: route.params.user.id,
        username: route.params.user.username,
        displayName: route.params.user.displayName,
        profileImageUrl: route.params.user.profileImageUrl,
        bio: route.params.user.bio ?? '',
        friendIds: [],
        closeFriendIds: []
      }
    : null;
  const user = users.find((item) => item.id === userId) ?? userPosts[0]?.user ?? snapshotUser;
  const token = auth?.session.token;

  async function runFriendAction(nextFriendship: FriendshipSnapshot | null, action: () => Promise<void>, actionId: string) {
    if (!token || busyAction) {
      return;
    }

    const previousFriendship = friendship;
    const previousHideVisiblePosts = hideVisiblePosts;
    const shouldHidePosts = friendship?.direction === 'accepted' && nextFriendship === null;
    setBusyAction(actionId);
    setActionError(null);
    setFriendship(nextFriendship);
    if (shouldHidePosts) {
      setHideVisiblePosts(true);
    }

    try {
      await withTimeout(
        action(),
        FRIENDS_TIMEOUT_MS,
        'Friend status is taking too long to update. Make sure the API is running, then try again.'
      );
      await refreshAppData();
    } catch (err) {
      setFriendship(previousFriendship);
      setHideVisiblePosts(previousHideVisiblePosts);
      setActionError(err instanceof Error ? err.message : 'Could not update friendship.');
    } finally {
      setBusyAction(null);
    }
  }

  function handleAcceptRequest() {
    if (!friendship) {
      return;
    }

    void runFriendAction(
      {
        ...friendship,
        direction: 'accepted',
        status: 'accepted'
      },
      () => acceptFriendRequest(friendship.friendshipId, token!),
      friendship.friendshipId
    );
  }

  function handleDeclineRequest() {
    if (!friendship) {
      return;
    }

    void runFriendAction(null, () => declineFriendRequest(friendship.friendshipId, token!), friendship.friendshipId);
  }

  function handleRemoveOrCancel() {
    if (!friendship) {
      return;
    }

    void runFriendAction(null, () => removeFriend(friendship.friendshipId, token!), friendship.friendshipId);
  }

  function handleBlockProfileUser() {
    if (!token || busyAction) {
      return;
    }

    const previousFriendship = friendship;
    const previousHideVisiblePosts = hideVisiblePosts;
    const previousIsBlocked = isBlocked;
    setBusyAction('block-profile');
    setActionError(null);
    setFriendship(null);
    setHideVisiblePosts(true);
    setIsSafetyMenuVisible(false);

    void (async () => {
      try {
        await withTimeout(
          blockUserById(userId),
          FRIENDS_TIMEOUT_MS,
          'Block is taking too long to update. Make sure the API is running, then try again.'
        );
        setIsBlocked(true);
        await refreshAppData();
      } catch (err) {
        setFriendship(previousFriendship);
        setHideVisiblePosts(previousHideVisiblePosts);
        setIsBlocked(previousIsBlocked);
        setActionError(err instanceof Error ? err.message : 'Could not block this user.');
      } finally {
        setBusyAction(null);
      }
    })();
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fallback}>
          <Text style={styles.emptyTitle}>Could not load profile</Text>
          <Text style={styles.emptyText}>This account is not available from your current feed.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" hitSlop={8} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          {friendship ? (
            <View style={styles.friendshipBanner}>
              <View style={styles.friendshipText}>
                <Text style={styles.friendshipLabel}>
                  {friendship.direction === 'accepted'
                    ? 'Friends'
                    : friendship.direction === 'outgoing'
                      ? 'Request sent'
                      : 'Friend request'}
                </Text>
                {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
              </View>
              {friendship.direction === 'incoming' && friendship.status === 'pending' ? (
                <View style={styles.iconActions}>
                  <Pressable
                    accessibilityLabel="Accept friend request"
                    accessibilityRole="button"
                    disabled={busyAction === friendship.friendshipId}
                    onPress={handleAcceptRequest}
                    style={({ pressed }) => [
                      styles.iconActionButton,
                      styles.acceptButton,
                      pressed ? styles.pressed : null,
                      busyAction === friendship.friendshipId ? styles.disabled : null
                    ]}
                  >
                    <Ionicons name="checkmark" size={17} color={colors.surface} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Decline friend request"
                    accessibilityRole="button"
                    disabled={busyAction === friendship.friendshipId}
                    onPress={handleDeclineRequest}
                    style={({ pressed }) => [
                      styles.iconActionButton,
                      pressed ? styles.pressed : null,
                      busyAction === friendship.friendshipId ? styles.disabled : null
                    ]}
                  >
                    <Ionicons name="close" size={17} color={colors.textMuted} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  disabled={busyAction === friendship.friendshipId}
                  onPress={handleRemoveOrCancel}
                  style={({ pressed }) => [
                    styles.bannerAction,
                    pressed ? styles.pressed : null,
                    busyAction === friendship.friendshipId ? styles.disabled : null
                  ]}
                >
                  <Text style={styles.bannerActionText}>
                    {friendship.direction === 'outgoing' ? 'Cancel' : 'Remove'}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : isBlocked ? (
            <View style={styles.blockedBanner}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.blockedBannerText}>Blocked</Text>
            </View>
          ) : actionError ? (
            <Text style={styles.errorText}>{actionError}</Text>
          ) : (
            <View style={styles.topBarFill} />
          )}
          {isBlocked ? (
            <View style={styles.topBarSpacer} />
          ) : (
            <Pressable
              accessibilityLabel="Open profile safety actions"
              accessibilityRole="button"
              disabled={busyAction === 'block-profile'}
              hitSlop={8}
              onPress={() => setIsSafetyMenuVisible(true)}
              style={({ pressed }) => [
                styles.profileSafetyButton,
                pressed ? styles.pressed : null,
                busyAction === 'block-profile' ? styles.disabled : null
              ]}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
            </Pressable>
          )}
        </View>

        <View style={styles.profileHeader}>
          <Pressable
            accessibilityLabel={`Preview ${user.displayName}'s profile picture`}
            accessibilityRole="imagebutton"
            onPress={() => setIsHeaderAvatarVisible(true)}
          >
            <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
          </Pressable>
          <View style={styles.identity}>
            <Text style={styles.displayName}>{user.displayName}</Text>
            <Text style={styles.username}>@{user.username}</Text>
            <Text style={styles.bio}>{user.bio || 'Bio coming soon'}</Text>
          </View>
        </View>

        {isBlocked ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>You blocked @{user.username}</Text>
            <Text style={styles.emptyText}>Their posts are hidden from your feed and search, and they cannot interact with your posts.</Text>
            <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Back to feed</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Visible posts</Text>
            </View>

            {visibleUserPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No visible posts</Text>
                <Text style={styles.emptyText}>Posts you can see from this account will show here.</Text>
              </View>
            ) : (
              <View style={styles.posts}>
                {visibleUserPosts.map((post) => (
                  <PostCard
                    post={post}
                    key={post.id}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <AvatarPreviewModal
        displayName={user.displayName}
        imageUri={user.profileImageUrl}
        username={user.username}
        visible={isHeaderAvatarVisible}
        onClose={() => {
          setIsHeaderAvatarVisible(false);
        }}
      />
      <Modal animationType="fade" transparent visible={isSafetyMenuVisible} onRequestClose={() => setIsSafetyMenuVisible(false)}>
        <View style={styles.safetyOverlay}>
          <Pressable style={styles.safetyBackdrop} onPress={() => setIsSafetyMenuVisible(false)} />
          <View style={styles.safetySheet}>
            <View style={styles.safetyHeader}>
              <Text style={styles.safetyTitle}>Profile safety</Text>
              <Pressable
                accessibilityLabel="Close safety actions"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setIsSafetyMenuVisible(false)}
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={busyAction === 'block-profile'}
              onPress={handleBlockProfileUser}
              style={[styles.safetyActionButton, busyAction === 'block-profile' && styles.disabled]}
            >
              <Ionicons name="ban-outline" size={18} color={colors.surface} />
              <Text style={styles.safetyActionText}>Block @{user.username}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.accentSoft
  },
  scrollView: {
    backgroundColor: colors.background
  },
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.md
  },
  topBar: {
    backgroundColor: colors.accentSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  topBarFill: {
    flex: 1
  },
  topBarSpacer: {
    width: 36,
    height: 36
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.md
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.surfaceMuted
  },
  identity: {
    alignItems: 'center',
    gap: 4
  },
  displayName: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 26,
    fontWeight: '700'
  },
  username: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 15
  },
  bio: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  },
  friendshipBanner: {
    flex: 1,
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingLeft: spacing.sm
  },
  friendshipText: {
    flex: 1,
    minWidth: 0,
    gap: 3
  },
  friendshipLabel: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700'
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  iconActionButton: {
    width: 28,
    height: 28,
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
  bannerAction: {
    minHeight: 28,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface
  },
  profileSafetyButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  safetyOverlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  safetyBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.24)'
  },
  safetySheet: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg
  },
  safetyHeader: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  safetyTitle: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 18,
    fontWeight: '700'
  },
  safetyActionButton: {
    minHeight: 44,
    borderRadius: radii.md,
    backgroundColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs
  },
  safetyActionText: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    fontWeight: '700'
  },
  blockedBanner: {
    minHeight: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm
  },
  blockedBannerText: {
    color: colors.success,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700'
  },
  bannerActionText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700'
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 18,
    fontWeight: '700'
  },
  posts: {
    gap: spacing.md
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm
  },
  emptyState: {
    marginHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center'
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  },
  doneButton: {
    alignSelf: 'center',
    minHeight: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.text,
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  doneButtonText: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    fontWeight: '700'
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
