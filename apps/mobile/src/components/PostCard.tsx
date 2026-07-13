import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../constants/theme';
import type { FeedPost } from '../types/models';
import { formatPostLifespan, formatRelativeTime } from '../utils/date';

type PostCardProps = {
  post: FeedPost;
  onUserPress?: (post: FeedPost) => void;
  onAvatarPress?: (post: FeedPost) => void;
};

export function PostCard({ post, onUserPress, onAvatarPress }: PostCardProps) {
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
  }
});
