import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '../constants/theme';
import type { PostReactionGroup } from '../types/models';

type ReactionViewerSheetProps = {
  visible: boolean;
  groups: PostReactionGroup[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
};

const DEFAULT_PROFILE_IMAGE_URL = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80';

export function ReactionViewerSheet({ visible, groups, isLoading, error, onClose }: ReactionViewerSheetProps) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable accessibilityRole="button" style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.topBar}>
            <View style={styles.handle} />
            <Pressable
              accessibilityLabel="Close reactions"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : groups.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No reactions yet.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.groupList} showsVerticalScrollIndicator={false}>
              {groups.map((group) => (
                <View key={group.emoji} style={styles.group}>
                  <View style={styles.emojiBadge}>
                    <Text style={styles.groupEmoji}>{group.emoji}</Text>
                  </View>
                  <View style={styles.userList}>
                    {group.users.map((user) => (
                      <View key={`${group.emoji}-${user.id}`} style={styles.userRow}>
                        <Image source={{ uri: user.avatarUrl ?? DEFAULT_PROFILE_IMAGE_URL }} style={styles.avatar} />
                        <View style={styles.userText}>
                          <Text style={styles.displayName}>{user.displayName}</Text>
                          <Text style={styles.username}>@{user.username}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay
  },
  sheet: {
    maxHeight: '72%',
    minHeight: 220,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg
  },
  topBar: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 4,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border
  },
  centered: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 15
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20
  },
  groupList: {
    gap: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md
  },
  group: {
    gap: spacing.md
  },
  emojiBadge: {
    alignSelf: 'center',
    minWidth: 48,
    minHeight: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted
  },
  groupEmoji: {
    color: colors.text,
    fontSize: 24
  },
  userList: {
    gap: spacing.xs
  },
  userRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceMuted
  },
  userText: {
    flex: 1,
    minWidth: 0
  },
  displayName: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 16,
    fontWeight: '700'
  },
  username: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 13
  }
});
