import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '../constants/theme';
import { REACTION_EMOJIS } from '../services/posts';
import type { FeedPost, ReactionEmoji } from '../types/models';
import { formatPostLifespan, formatRelativeTime } from '../utils/date';

type PostCardProps = {
  post: FeedPost;
  onUserPress?: (post: FeedPost) => void;
  onAvatarPress?: (post: FeedPost) => void;
  onReactionPress?: (post: FeedPost, emoji: ReactionEmoji) => Promise<void>;
  onCommentSubmit?: (post: FeedPost, body: string) => Promise<void>;
  onOpenComments?: (post: FeedPost) => void;
  showAllComments?: boolean;
};

export function PostCard({
  post,
  onUserPress,
  onAvatarPress,
  onReactionPress,
  onCommentSubmit,
  onOpenComments,
  showAllComments = false
}: PostCardProps) {
  const [commentBody, setCommentBody] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [interactionError, setInteractionError] = useState<string | null>(null);
  const visibleComments = showAllComments ? post.recentComments : post.recentComments.slice(0, 2);
  const hiddenCommentCount = Math.max(post.commentCount - visibleComments.length, 0);

  const handleReactionPress = async (emoji: ReactionEmoji) => {
    if (!onReactionPress) {
      return;
    }

    try {
      setIsUpdating(true);
      setInteractionError(null);
      await onReactionPress(post, emoji);
    } catch (err) {
      setInteractionError(err instanceof Error ? err.message : 'Could not update reaction.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCommentSubmit = async () => {
    const trimmedBody = commentBody.trim();

    if (!trimmedBody || !onCommentSubmit) {
      return;
    }

    try {
      setIsUpdating(true);
      setInteractionError(null);
      await onCommentSubmit(post, trimmedBody);
      setCommentBody('');
    } catch (err) {
      setInteractionError(err instanceof Error ? err.message : 'Could not add comment.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userRow}>
          <Pressable
            accessibilityLabel={`Preview ${post.user.displayName}'s profile picture`}
            accessibilityRole="imagebutton"
            onPress={() => onAvatarPress?.(post)}
            style={[styles.avatarRing, post.isCloseFriend && styles.avatarRingClose]}
          >
            <Image source={{ uri: post.user.profileImageUrl }} style={styles.avatar} />
          </Pressable>
          <Pressable
            accessibilityLabel={`Open ${post.user.displayName}'s profile`}
            accessibilityRole="button"
            onPress={() => onUserPress?.(post)}
            style={styles.userTextButton}
          >
            <Text style={styles.displayName}>{post.user.username}</Text>
            <Text style={styles.meta}>{formatRelativeTime(post.createdAt)}</Text>
          </Pressable>
        </View>
        <Pressable hitSlop={10}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
        </Pressable>
      </View>

      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.textPostPanel}>
          <Text style={styles.textPostBody}>{post.caption}</Text>
        </View>
      )}

      <View style={styles.metaRow}>
        <View style={styles.metaPills}>
          {post.isCloseFriend ? (
            <View style={[styles.badge, styles.badgeClose]}>
              <Text style={[styles.badgeText, styles.badgeTextClose]}>Close Friends</Text>
            </View>
          ) : null}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formatPostLifespan(post.expiresAt, post.isPermanent)}</Text>
          </View>
        </View>
      </View>

      {post.caption && post.imageUrl ? (
        <Text style={styles.caption}>
          <Text style={styles.captionUsername}>@{post.user.username}</Text> {post.caption}
        </Text>
      ) : null}

      <View style={styles.interactions}>
        <View style={styles.reactionRow}>
          {REACTION_EMOJIS.map((emoji) => {
            const isActive = post.viewerReactions.includes(emoji);
            const count = post.reactionCounts[emoji] ?? 0;

            return (
              <Pressable
                key={emoji}
                accessibilityLabel={`${isActive ? 'Remove' : 'Add'} ${emoji} reaction`}
                accessibilityRole="button"
                disabled={isUpdating || !onReactionPress}
                onPress={() => handleReactionPress(emoji)}
                style={[styles.reactionPill, isActive && styles.reactionPillActive]}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {count > 0 ? <Text style={styles.reactionCount}>{count}</Text> : null}
              </Pressable>
            );
          })}
        </View>

        {visibleComments.length > 0 ? (
          <View style={styles.commentList}>
            {visibleComments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <Text style={styles.commentMeta}>
                  @{comment.author.username} · {formatRelativeTime(comment.createdAt)}
                </Text>
                <Text style={styles.commentBody}>{comment.body}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {post.commentCount > 0 && onOpenComments ? (
          <Pressable accessibilityRole="button" onPress={() => onOpenComments(post)}>
            <Text style={styles.viewThreadText}>
              {hiddenCommentCount > 0 ? `View all ${post.commentCount} comments` : 'Open comments'}
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.commentComposer}>
          <TextInput
            value={commentBody}
            onChangeText={setCommentBody}
            placeholder="Leave a short supportive reply..."
            placeholderTextColor={colors.textMuted}
            maxLength={200}
            editable={!isUpdating && Boolean(onCommentSubmit)}
            style={styles.commentInput}
          />
          <Pressable
            accessibilityRole="button"
            disabled={isUpdating || !commentBody.trim() || !onCommentSubmit}
            onPress={handleCommentSubmit}
            style={[styles.replyButton, (!commentBody.trim() || isUpdating) && styles.replyButtonDisabled]}
          >
            <Text style={styles.replyButtonText}>Reply</Text>
          </Pressable>
        </View>

        {interactionError ? <Text style={styles.interactionError}>{interactionError}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1
  },
  avatarRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#D8D8D8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarRingClose: {
    borderColor: '#F2B54A'
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16
  },
  userTextButton: {
    flex: 1,
    minWidth: 0
  },
  displayName: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 16,
    fontWeight: '700'
  },
  meta: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 12
  },
  metaRow: {
    paddingHorizontal: spacing.md
  },
  metaPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  badge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  badgeClose: {
    backgroundColor: '#FEF3D6'
  },
  badgeText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 11,
    fontWeight: '700'
  },
  badgeTextClose: {
    color: '#8A5A00'
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceMuted
  },
  textPostPanel: {
    marginHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg
  },
  textPostBody: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28
  },
  caption: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.md
  },
  captionUsername: {
    fontWeight: '700'
  },
  interactions: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  reactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  reactionPill: {
    minWidth: 48,
    minHeight: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  reactionPillActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.text
  },
  reactionEmoji: {
    fontSize: 16
  },
  reactionCount: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 12,
    fontWeight: '700'
  },
  commentList: {
    gap: spacing.xs
  },
  comment: {
    gap: 2
  },
  commentMeta: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 12
  },
  commentBody: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    lineHeight: 20
  },
  viewThreadText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700'
  },
  commentComposer: {
    minHeight: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingLeft: spacing.md,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  commentInput: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    paddingVertical: 10
  },
  replyButton: {
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  replyButtonDisabled: {
    opacity: 0.45
  },
  replyButtonText: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700'
  },
  interactionError: {
    color: colors.danger,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    lineHeight: 18
  }
});
