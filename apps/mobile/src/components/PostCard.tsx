import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import { colors, radii, spacing, typography } from '../constants/theme';
import { REACTION_EMOJIS } from '../services/posts';
import type { FeedPost, ReactionEmoji } from '../types/models';
import { formatPostLifespan, formatRelativeTime } from '../utils/date';

type PostCardProps = {
  post: FeedPost;
  cardHeight?: number;
  onUserPress?: (post: FeedPost) => void;
  onAvatarPress?: (post: FeedPost) => void;
  avatarAccessibilityLabel?: string | ((post: FeedPost) => string);
  onReactionPress?: (post: FeedPost, emoji: ReactionEmoji) => Promise<void>;
  onReactionDetailsPress?: (post: FeedPost, emoji: ReactionEmoji) => void;
  onCommentSubmit?: (post: FeedPost, body: string) => Promise<void>;
  onOpenComments?: (post: FeedPost) => void;
  onDeletePress?: (post: FeedPost) => void;
  deletionStatus?: 'deleting' | 'deleted';
  showAllComments?: boolean;
};

type IoniconName = keyof typeof Ionicons.glyphMap;
type MaterialCommunityIconName = keyof typeof MaterialCommunityIcons.glyphMap;

const IONICON_REACTION_ICON_BY_EMOJI: Partial<Record<ReactionEmoji, IoniconName>> = {
  '❤️': 'heart-outline',
  '🔥': 'flame-outline'
};

const ACTIVE_IONICON_REACTION_ICON_BY_EMOJI: Partial<Record<ReactionEmoji, IoniconName>> = {
  '❤️': 'heart',
  '🔥': 'flame'
};

const MATERIAL_REACTION_ICON_BY_EMOJI: Partial<Record<ReactionEmoji, MaterialCommunityIconName>> = {
  '🙏': 'hands-pray',
  '🙌': 'human-handsup'
};

const COLLAPSED_CAPTION_LINES = 2;
const EXPANDED_CAPTION_MAX_HEIGHT = 132;

export function PostCard({
  post,
  cardHeight,
  onUserPress,
  onAvatarPress,
  avatarAccessibilityLabel,
  onReactionPress,
  onReactionDetailsPress,
  onCommentSubmit,
  onOpenComments,
  onDeletePress,
  deletionStatus,
  showAllComments = false
}: PostCardProps) {
  const [commentBody, setCommentBody] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [interactionError, setInteractionError] = useState<string | null>(null);
  const [isReactionRailExpanded, setIsReactionRailExpanded] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCommentComposerOpen, setIsCommentComposerOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const commentInputRef = useRef<TextInput>(null);
  const commentBodyRef = useRef('');
  const isSubmittingCommentRef = useRef(false);
  const visibleComments = showAllComments ? post.recentComments : [];
  const totalReactionCount = Object.values(post.reactionCounts).reduce((total, count) => total + (count ?? 0), 0);
  const shouldShowCaptionMore = post.caption.length > 96;
  const commentThreadLabel = post.commentCount > 0 ? `View all ${post.commentCount} comments` : 'Be the first to comment';
  const avatarLabel = typeof avatarAccessibilityLabel === 'function'
    ? avatarAccessibilityLabel(post)
    : avatarAccessibilityLabel;
  const isDeletePending = Boolean(deletionStatus);

  const renderReactionIcon = (emoji: ReactionEmoji, isActive: boolean) => {
    const materialIconName = MATERIAL_REACTION_ICON_BY_EMOJI[emoji];

    if (materialIconName) {
      return (
        <MaterialCommunityIcons
          name={materialIconName}
          size={26}
          color={colors.surface}
          style={[styles.railIcon, isActive && styles.activeRailIcon]}
        />
      );
    }

    const iconName = isActive ? ACTIVE_IONICON_REACTION_ICON_BY_EMOJI[emoji] : IONICON_REACTION_ICON_BY_EMOJI[emoji];

    return iconName ? (
      <Ionicons
        name={iconName}
        size={25}
        color={colors.surface}
        style={[styles.railIcon, isActive && styles.activeRailIcon]}
      />
    ) : null;
  };

  const handleReactionPress = async (emoji: ReactionEmoji) => {
    if (isDeletePending || !onReactionPress) {
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
    const trimmedBody = commentBodyRef.current.trim();

    if (isDeletePending || isUpdating || isSubmittingCommentRef.current || !trimmedBody || !onCommentSubmit) {
      return;
    }

    try {
      isSubmittingCommentRef.current = true;
      setIsUpdating(true);
      setIsSubmittingComment(true);
      setInteractionError(null);
      setIsCommentComposerOpen(false);
      Keyboard.dismiss();
      await onCommentSubmit(post, trimmedBody);
      commentBodyRef.current = '';
      setCommentBody('');
    } catch (err) {
      setIsCommentComposerOpen(true);
      setInteractionError(err instanceof Error ? err.message : 'Could not add comment.');
    } finally {
      isSubmittingCommentRef.current = false;
      setIsSubmittingComment(false);
      setIsUpdating(false);
    }
  };

  const handleCommentBodyChange = (nextBody: string) => {
    commentBodyRef.current = nextBody;
    setCommentBody(nextBody);
  };

  const openCommentComposer = () => {
    if (isDeletePending || isSubmittingComment || !onCommentSubmit) {
      return;
    }

    setInteractionError(null);
    setIsCommentComposerOpen(true);
  };

  const closeCommentComposer = () => {
    if (isSubmittingComment) {
      return;
    }

    setIsCommentComposerOpen(false);
    Keyboard.dismiss();
    setKeyboardHeight(0);
  };

  useEffect(() => {
    if (!isCommentComposerOpen) {
      return;
    }

    const focusTimer = setTimeout(() => {
      commentInputRef.current?.focus();
    }, 80);

    return () => clearTimeout(focusTimer);
  }, [isCommentComposerOpen]);

  useEffect(() => {
    const handleKeyboardFrameChange = (event: { endCoordinates: { height: number } }) => {
      setKeyboardHeight(event.endCoordinates.height);
    };
    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    const subscriptions = [
      Keyboard.addListener('keyboardWillChangeFrame', handleKeyboardFrameChange),
      Keyboard.addListener('keyboardDidShow', handleKeyboardFrameChange),
      Keyboard.addListener('keyboardWillHide', handleKeyboardHide),
      Keyboard.addListener('keyboardDidHide', handleKeyboardHide)
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, []);

  return (
    <>
      <View style={[styles.section, cardHeight ? { height: cardHeight } : null]}>
        <View style={styles.card}>
          <View style={styles.mediaStage}>
            {post.imageUrl ? (
              <Image source={{ uri: post.imageUrl }} style={styles.image} />
            ) : (
              <View style={styles.textPostPanel}>
                <Text style={styles.textPostBody}>{post.caption}</Text>
              </View>
            )}

            <View style={styles.mediaScrim} />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(0, 0, 0, 0.42)', 'rgba(0, 0, 0, 0.16)', 'rgba(0, 0, 0, 0)']}
              locations={[0, 0.4, 1]}
              style={styles.mediaTopGradient}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.18)', 'rgba(0, 0, 0, 0.36)']}
              locations={[0, 0.58, 1]}
              style={styles.mediaBottomGradient}
            />

            <View style={styles.header}>
              <View style={styles.userRow}>
                <Pressable
                  accessibilityLabel={avatarLabel ?? `Preview ${post.user.displayName}'s profile picture`}
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
              {onDeletePress ? (
                <Pressable
                  accessibilityLabel="Delete this post"
                  accessibilityRole="button"
                  onPress={() => onDeletePress(post)}
                  disabled={isDeletePending}
                  style={[styles.deleteButton, isDeletePending && styles.deleteButtonDisabled]}
                >
                  <Ionicons
                    name={deletionStatus === 'deleted' ? 'checkmark-circle-outline' : 'trash-outline'}
                    size={20}
                    color={colors.surface}
                    style={styles.railIcon}
                  />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.mediaMeta}>
              <View style={styles.metaActionRow}>
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

                <View style={styles.reactionRail}>
                  {isReactionRailExpanded ? (
                    <View style={styles.reactionFlyout}>
                      {REACTION_EMOJIS.map((emoji) => {
                        const isActive = post.viewerReactions.includes(emoji);
                        const count = post.reactionCounts[emoji] ?? 0;

                        return (
                          <View key={emoji} style={styles.reactionFlyoutButton}>
                            <Pressable
                              accessibilityLabel={`${isActive ? 'Remove' : 'Add'} ${emoji} reaction`}
                              accessibilityRole="button"
                              accessibilityState={{ selected: isActive }}
                              disabled={isDeletePending || isUpdating || !onReactionPress}
                              onPress={() => handleReactionPress(emoji)}
                              style={styles.reactionIconButton}
                            >
                              {renderReactionIcon(emoji, isActive)}
                            </Pressable>
                            <Pressable
                              accessibilityLabel={`See who reacted with ${emoji}`}
                              accessibilityRole="button"
                              disabled={isDeletePending || count === 0}
                              onPress={() => onReactionDetailsPress?.(post, emoji)}
                              style={styles.reactionCountButton}
                            >
                              <Text style={[styles.reactionCount, count === 0 && styles.hiddenReactionCount]}>
                                {count}
                              </Text>
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}

                  <Pressable
                    accessibilityLabel={isReactionRailExpanded ? 'Collapse reactions' : 'See all reactions'}
                    accessibilityRole="button"
                    disabled={isDeletePending}
                    onPress={() => setIsReactionRailExpanded((isExpanded) => !isExpanded)}
                    style={styles.generalReactionButton}
                  >
                    <Ionicons name="people-outline" size={26} color={colors.surface} style={styles.railIcon} />
                    <Text style={[styles.generalReactionCount, totalReactionCount === 0 && styles.hiddenReactionCount]}>
                      {totalReactionCount}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {post.caption && post.imageUrl ? (
                <View style={styles.captionBlock}>
                  {isCaptionExpanded ? (
                    <ScrollView
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                      style={styles.expandedCaptionScroll}
                    >
                      <Text style={styles.caption}>
                        <Text style={styles.captionUsername}>@{post.user.username}</Text> {post.caption}
                      </Text>
                    </ScrollView>
                  ) : (
                    <Text numberOfLines={COLLAPSED_CAPTION_LINES} style={styles.caption}>
                      <Text style={styles.captionUsername}>@{post.user.username}</Text> {post.caption}
                    </Text>
                  )}
                  {shouldShowCaptionMore ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setIsCaptionExpanded((isExpanded) => !isExpanded)}
                      style={styles.captionToggle}
                    >
                      <Text style={styles.captionToggleText}>{isCaptionExpanded ? 'less' : 'more'}</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

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

              {!showAllComments && onOpenComments ? (
                <Pressable accessibilityRole="button" disabled={isDeletePending} onPress={() => onOpenComments(post)}>
                  <Text style={styles.viewThreadText}>{commentThreadLabel}</Text>
                </Pressable>
              ) : null}

              <View style={styles.commentComposer}>
                <Pressable
                  accessibilityLabel="Write a supportive reply"
                  accessibilityRole="button"
                  disabled={isDeletePending || isSubmittingComment || !onCommentSubmit}
                  onPress={openCommentComposer}
                  style={styles.inlineCommentTrigger}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.inlineCommentText, !commentBody.trim() && styles.inlineCommentPlaceholder]}
                  >
                    {commentBody.trim() ? commentBody : 'Leave a short supportive reply...'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={isDeletePending || isSubmittingComment || !onCommentSubmit}
                  onPressIn={handleCommentSubmit}
                  onPress={handleCommentSubmit}
                  style={[styles.replyButton, (!commentBody.trim() || isSubmittingComment) && styles.replyButtonDisabled]}
                >
                  <Text style={styles.replyButtonText}>{isSubmittingComment ? 'Sending' : 'Reply'}</Text>
                </Pressable>
              </View>

              {interactionError ? <Text style={styles.interactionError}>{interactionError}</Text> : null}
            </View>

            {deletionStatus ? (
              <View style={styles.deletedOverlay} pointerEvents="auto">
                <View style={styles.deletedMessage}>
                  <Ionicons
                    name={deletionStatus === 'deleted' ? 'checkmark-circle-outline' : 'hourglass-outline'}
                    size={28}
                    color={colors.surface}
                  />
                  <Text style={styles.deletedTitle}>
                    {deletionStatus === 'deleted' ? 'Post deleted' : 'Deleting...'}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </View>
      <Modal
        animationType="none"
        presentationStyle="overFullScreen"
        transparent
        visible={isCommentComposerOpen}
        onRequestClose={closeCommentComposer}
      >
        <View style={styles.keyboardComposerOverlay}>
          <Pressable accessibilityRole="button" style={styles.keyboardComposerBackdrop} onPress={closeCommentComposer} />
          <View
            style={[styles.keyboardComposerWrap, { bottom: keyboardHeight }]}
            onStartShouldSetResponder={() => true}
          >
            <TextInput
              ref={commentInputRef}
              value={commentBody}
              onChangeText={handleCommentBodyChange}
              placeholder="Leave a short supportive reply..."
              placeholderTextColor={colors.textMuted}
              maxLength={200}
              editable={!isSubmittingComment && Boolean(onCommentSubmit)}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleCommentSubmit}
              style={styles.keyboardCommentInput}
            />
            <Pressable
              accessibilityRole="button"
              disabled={isSubmittingComment || !onCommentSubmit}
              onPressIn={handleCommentSubmit}
              onPress={handleCommentSubmit}
              style={[
                styles.keyboardReplyButton,
                (!commentBody.trim() || isSubmittingComment) && styles.replyButtonDisabled
              ]}
            >
              <Text style={styles.keyboardReplyButtonText}>{isSubmittingComment ? 'Sending' : 'Reply'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 4,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background
  },
  card: {
    flex: 1,
    borderRadius: radii.md,
    overflow: 'hidden'
  },
  header: {
    position: 'absolute',
    top: spacing.sm,
    left: 0,
    right: 0,
    zIndex: 2,
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
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.28)'
  },
  deleteButtonDisabled: {
    opacity: 0.72
  },
  displayName: {
    color: colors.surface,
    fontFamily: typography.titleFamily,
    fontSize: 16,
    fontWeight: '700'
  },
  meta: {
    color: 'rgba(255, 255, 255, 0.68)',
    fontFamily: typography.bodyFamily,
    fontSize: 12
  },
  metaPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: radii.pill,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  badgeClose: {
    backgroundColor: '#FEF3D6'
  },
  badgeText: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 11,
    fontWeight: '700'
  },
  badgeTextClose: {
    color: '#8A5A00'
  },
  mediaStage: {
    flex: 1,
    minHeight: 420,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: colors.surfaceMuted
  },
  mediaScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.08)'
  },
  mediaTopGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '20%'
  },
  mediaBottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '34%'
  },
  mediaMeta: {
    zIndex: 2,
    paddingLeft: spacing.md,
    paddingRight: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm
  },
  metaActionRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  textPostPanel: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg
  },
  textPostBody: {
    color: colors.surface,
    fontFamily: typography.titleFamily,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28
  },
  captionBlock: {
    gap: 2,
    maxWidth: '92%'
  },
  expandedCaptionScroll: {
    maxHeight: EXPANDED_CAPTION_MAX_HEIGHT
  },
  caption: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8
  },
  captionUsername: {
    fontWeight: '700'
  },
  captionToggle: {
    alignSelf: 'flex-start',
    minHeight: 22,
    justifyContent: 'center'
  },
  captionToggleText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8
  },
  reactionRail: {
    position: 'relative',
    alignItems: 'center',
    flexShrink: 0,
    width: 42
  },
  reactionFlyout: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
    gap: 10
  },
  generalReactionButton: {
    width: 42,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2
  },
  reactionFlyoutButton: {
    width: 42,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  reactionIconButton: {
    width: 42,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  railIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5
  },
  activeRailIcon: {
    opacity: 0.96
  },
  reactionCountButton: {
    minWidth: 42,
    minHeight: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  reactionCount: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  generalReactionCount: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  hiddenReactionCount: {
    opacity: 0
  },
  commentList: {
    gap: spacing.xs
  },
  comment: {
    gap: 2
  },
  commentMeta: {
    color: 'rgba(255, 255, 255, 0.62)',
    fontFamily: typography.bodyFamily,
    fontSize: 12
  },
  commentBody: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    lineHeight: 20
  },
  viewThreadText: {
    color: 'rgba(255, 255, 255, 0.68)',
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700'
  },
  commentComposer: {
    minHeight: 38,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(17, 17, 17, 0.34)',
    paddingLeft: 14,
    paddingRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  inlineCommentTrigger: {
    flex: 1,
    minWidth: 0,
    minHeight: 32,
    justifyContent: 'center'
  },
  inlineCommentText: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 13
  },
  inlineCommentPlaceholder: {
    color: 'rgba(255, 255, 255, 0.5)'
  },
  replyButton: {
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  replyButtonDisabled: {
    opacity: 0.45
  },
  replyButtonText: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700'
  },
  interactionError: {
    color: '#FCA5A5',
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    lineHeight: 18
  },
  deletedOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.54)'
  },
  deletedMessage: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  deletedTitle: {
    color: colors.surface,
    fontFamily: typography.titleFamily,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center'
  },
  keyboardComposerOverlay: {
    ...StyleSheet.absoluteFill
  },
  keyboardComposerBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent'
  },
  keyboardComposerWrap: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    minHeight: 58,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8
  },
  keyboardCommentInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 8
  },
  keyboardReplyButton: {
    minHeight: 46,
    borderRadius: radii.pill,
    backgroundColor: colors.text,
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  keyboardReplyButtonText: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    fontWeight: '800'
  }
});
