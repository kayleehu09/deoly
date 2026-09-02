import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';
import type { FeedPost, ReactionEmoji } from '../types/models';
import { PostCard } from './PostCard';

type FeedListProps = {
  posts: FeedPost[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onUserPress?: (post: FeedPost) => void;
  onAvatarPress?: (post: FeedPost) => void;
  avatarAccessibilityLabel?: string | ((post: FeedPost) => string);
  onReactionPress?: (post: FeedPost, emoji: ReactionEmoji) => Promise<void>;
  onReactionDetailsPress?: (post: FeedPost, emoji: ReactionEmoji) => void;
  onCommentSubmit?: (post: FeedPost, body: string) => Promise<void>;
  onOpenComments?: (post: FeedPost) => void;
  canDeletePost?: (post: FeedPost) => boolean;
  onDeletePost?: (post: FeedPost) => void;
  getDeletionStatus?: (post: FeedPost) => 'deleting' | 'deleted' | undefined;
};

export function FeedList({
  posts,
  isLoading,
  error,
  onRefresh,
  onUserPress,
  onAvatarPress,
  avatarAccessibilityLabel,
  onReactionPress,
  onReactionDetailsPress,
  onCommentSubmit,
  onOpenComments,
  canDeletePost,
  onDeletePost,
  getDeletionStatus
}: FeedListProps) {
  const [feedHeight, setFeedHeight] = useState(0);

  if (isLoading && posts.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Could not load posts</Text>
        <Text style={styles.emptyText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      onLayout={(event) => setFeedHeight(event.nativeEvent.layout.height)}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <PostCard
          post={item}
          cardHeight={feedHeight || undefined}
          onUserPress={onUserPress}
          onAvatarPress={onAvatarPress}
          avatarAccessibilityLabel={avatarAccessibilityLabel}
          onReactionPress={onReactionPress}
          onReactionDetailsPress={onReactionDetailsPress}
          onCommentSubmit={onCommentSubmit}
          onOpenComments={onOpenComments}
          onDeletePress={canDeletePost?.(item) ? onDeletePost : undefined}
          deletionStatus={getDeletionStatus?.(item)}
        />
      )}
      showsVerticalScrollIndicator={false}
      pagingEnabled
      bounces
      alwaysBounceVertical
      decelerationRate="fast"
      snapToInterval={feedHeight || undefined}
      snapToAlignment="start"
      disableIntervalMomentum
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.accent} />}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No devotional posts yet</Text>
          <Text style={styles.emptyText}>
            Once your friends start sharing, their daily moments will show up here.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    backgroundColor: colors.background
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 72,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm
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
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22
  }
});
