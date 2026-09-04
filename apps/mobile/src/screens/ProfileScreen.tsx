import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { colors, radii, spacing, typography } from '../constants/theme';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { getFriends, type FriendListItem } from '../services/friends';
import type { FeedPost } from '../types/models';
import type { RootStackParamList } from '../types/navigation';
import { getLatestDailyDeolies } from '../utils/postUtils';

type ProfileTab = 'deolies' | 'posts';

const FRIENDS_TIMEOUT_MS = 12000;
const RECENT_DEOLY_LIMIT = 7;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeout: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

function ProfileStat({
  label,
  value,
  onPress
}: {
  label: string;
  value: number;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.stat, pressed ? styles.pressed : null]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.stat}>{content}</View>;
}

function formatDeolyDay(dateString: string) {
  const postDate = new Date(dateString);
  const today = new Date();

  if (postDate.toDateString() === today.toDateString()) {
    return 'Today';
  }

  return postDate.toLocaleDateString(undefined, { weekday: 'short' });
}

function formatDeolyDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, { day: 'numeric' });
}

function RecentDeoliesStrip({
  posts,
  onSeeMore
}: {
  posts: FeedPost[];
  onSeeMore: () => void;
}) {
  const recentPosts = posts.slice(0, RECENT_DEOLY_LIMIT);
  const placeholderCount = Math.max(0, RECENT_DEOLY_LIMIT - recentPosts.length);

  return (
    <View style={styles.deoliesPanel}>
      <View style={styles.deoliesHeader}>
        <View>
          <Text style={styles.panelTitle}>Recent deolies</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onSeeMore} style={({ pressed }) => pressed ? styles.pressed : null}>
          <Text style={styles.seeMoreText}>See more</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deolyStrip}>
        {recentPosts.map((post) => (
          <View style={styles.deolyTile} key={post.id}>
            {post.imageUrl ? (
              <Image source={{ uri: post.imageUrl }} style={styles.deolyImage} />
            ) : (
              <View style={styles.deolyTextTile}>
                <Text style={styles.deolyCaption} numberOfLines={3}>
                  {post.caption || 'Deoly'}
                </Text>
              </View>
            )}
            <View style={styles.deolyDateBadge}>
              <Text style={styles.deolyDay}>{formatDeolyDay(post.createdAt)}</Text>
              <Text style={styles.deolyDate}>{formatDeolyDate(post.createdAt)}</Text>
            </View>
          </View>
        ))}
        {Array.from({ length: placeholderCount }, (_, index) => (
          <View style={[styles.deolyTile, styles.deolyPlaceholderTile]} key={`placeholder-${index}`}>
            <View style={[styles.deolyTileGlow, index % 2 === 0 ? styles.deolyTileGlowAlt : null]} />
            <Text style={styles.deolyPlaceholderDay}>{recentPosts.length === 0 && index === 0 ? 'Today' : 'Empty'}</Text>
            <Text style={styles.deolyPlaceholderDate}>{recentPosts.length + index + 1}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currentUser, feedPosts, profilePosts, isLoading } = useAppData();
  const { auth } = useAuth();
  const token = auth?.session.token;
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('deolies');

  const acceptedFriends = friends.filter((item) => item.direction === 'accepted' && item.status === 'accepted');
  const userDeolies = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return getLatestDailyDeolies(feedPosts, currentUser.id);
  }, [currentUser, feedPosts]);
  const deolyCount = useMemo(() => {
    return userDeolies.length;
  }, [userDeolies]);

  const refreshFriends = useCallback(async () => {
    if (!token) {
      setFriends([]);
      setIsLoadingFriends(false);
      return;
    }

    setIsLoadingFriends(true);
    setFriendsError(null);

    try {
      const response = await withTimeout(
        getFriends(token),
        FRIENDS_TIMEOUT_MS,
        'Friends are taking too long to load.'
      );
      setFriends(response.friends);
    } catch (err) {
      setFriendsError(err instanceof Error ? err.message : 'Could not load friends.');
    } finally {
      setIsLoadingFriends(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void refreshFriends();
    }, [refreshFriends])
  );

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fallbackState}>
          {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
          <Text style={styles.emptyText}>{isLoading ? 'Loading profile...' : 'Sign in to view your profile.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileIntro}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: currentUser.profileImageUrl }} style={styles.avatar} />
          </View>
          <View style={styles.profileMeta}>
            <View style={styles.identityRow}>
              <View style={styles.nameStack}>
                <Text style={styles.displayName} numberOfLines={1}>{currentUser.displayName}</Text>
                <Text style={styles.username} numberOfLines={1}>@{currentUser.username}</Text>
              </View>
              <Pressable
                accessibilityLabel="Open settings"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => navigation.navigate('Settings')}
                style={({ pressed }) => [styles.settingsButton, pressed ? styles.pressed : null]}
              >
                <Ionicons name="settings-outline" size={23} color={colors.text} />
              </Pressable>
            </View>
            <View style={styles.statsRow}>
              <ProfileStat label="deolies" value={deolyCount} />
              <ProfileStat label="posts" value={profilePosts.length} />
              <ProfileStat
                label="friends"
                value={acceptedFriends.length}
                onPress={() => navigation.navigate('ProfileFriends')}
              />
            </View>
          </View>
        </View>

        <Text style={styles.bio}>{currentUser.bio || 'Bio coming soon'}</Text>
        {friendsError ? <Text style={styles.errorText}>{friendsError}</Text> : null}

        <View style={styles.tabs}>
          {(['deolies', 'posts'] as ProfileTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                accessibilityRole="button"
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, isActive ? styles.activeTab : null]}
              >
                <Text style={[styles.tabText, isActive ? styles.activeTabText : null]}>
                  {tab === 'deolies' ? 'Deolies' : 'Posts'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === 'deolies' ? (
          <RecentDeoliesStrip posts={userDeolies} onSeeMore={() => navigation.navigate('DeolyArchive')} />
        ) : (
          <View style={styles.postsSection}>
            {profilePosts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No posts yet</Text>
                <Text style={styles.emptyText}>Saved posts can come later.</Text>
              </View>
            ) : null}
            <View style={styles.grid}>
              {profilePosts.map((item) =>
                item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.gridImage} key={item.id} />
                ) : (
                  <View style={[styles.gridImage, styles.textGridItem]} key={item.id}>
                    <Text style={styles.textGridItemLabel}>Text</Text>
                  </View>
                )
              )}
            </View>
          </View>
        )}

        {isLoadingFriends ? (
          <View style={styles.friendLoading}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md
  },
  fallbackState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm
  },
  profileIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  avatarWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    overflow: 'hidden'
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 52,
    backgroundColor: colors.surfaceMuted
  },
  profileMeta: {
    flex: 1,
    gap: spacing.sm
  },
  identityRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  nameStack: {
    flex: 1,
    minWidth: 0,
    gap: 2
  },
  displayName: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 22,
    fontWeight: '400'
  },
  username: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '400'
  },
  settingsButton: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: spacing.md,
    alignSelf: 'flex-start'
  },
  stat: {
    minWidth: 54,
    alignItems: 'center',
    gap: 2
  },
  statValue: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 18,
    fontWeight: '400'
  },
  statLabel: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 13
  },
  bio: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    lineHeight: 21
  },
  tabs: {
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.sm
  },
  tab: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  activeTab: {
    borderBottomColor: colors.text
  },
  tabText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    fontWeight: '400'
  },
  activeTabText: {
    color: colors.text
  },
  deoliesPanel: {
    gap: spacing.md
  },
  deoliesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  panelTitle: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 18,
    fontWeight: '400'
  },
  panelSubtitle: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 13
  },
  seeMoreText: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '400'
  },
  deolyStrip: {
    gap: spacing.sm,
    paddingRight: spacing.md
  },
  deolyTile: {
    width: 92,
    height: 124,
    borderRadius: radii.sm,
    backgroundColor: '#171717',
    overflow: 'hidden',
    alignItems: 'stretch'
  },
  deolyImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%'
  },
  deolyTextTile: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
    backgroundColor: '#191919'
  },
  deolyCaption: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 12,
    lineHeight: 16
  },
  deolyPlaceholderTile: {
    padding: spacing.sm,
    justifyContent: 'space-between'
  },
  deolyTileGlow: {
    position: 'absolute',
    left: -24,
    top: -18,
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(200, 169, 106, 0.32)'
  },
  deolyTileGlowAlt: {
    left: 38,
    top: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.18)'
  },
  deolyDateBadge: {
    position: 'absolute',
    left: spacing.xs,
    right: spacing.xs,
    bottom: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 5,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    alignSelf: 'stretch'
  },
  deolyDay: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 12,
    fontWeight: '400'
  },
  deolyPlaceholderDay: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 12,
    fontWeight: '400'
  },
  deolyPlaceholderDate: {
    color: colors.surface,
    fontFamily: typography.titleFamily,
    fontSize: 28,
    fontWeight: '400',
    textAlign: 'right'
  },
  deolyDate: {
    color: colors.surface,
    fontFamily: typography.titleFamily,
    fontSize: 22,
    fontWeight: '400',
    textAlign: 'right'
  },
  postsSection: {
    gap: spacing.md
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  gridImage: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted
  },
  textGridItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs
  },
  textGridItemLabel: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 12,
    fontWeight: '400'
  },
  emptyState: {
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center'
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 18,
    fontWeight: '400'
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center'
  },
  friendLoading: {
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    lineHeight: 19
  },
  pressed: {
    opacity: 0.72
  }
});
