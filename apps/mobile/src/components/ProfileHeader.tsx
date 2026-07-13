import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';
import type { User } from '../types/models';

type ProfileHeaderProps = {
  user: User;
  permanentPostCount: number;
};

export function ProfileHeader({ user, permanentPostCount }: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
      <View style={styles.meta}>
        <Text style={styles.displayName}>{user.displayName}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        <Text style={styles.bio}>{user.bio || 'Bio coming soon'}</Text>
        <Text style={styles.count}>{permanentPostCount} permanent posts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center'
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43
  },
  meta: {
    flex: 1,
    gap: 4
  },
  displayName: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 22,
    fontWeight: '700'
  },
  username: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 14
  },
  bio: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    lineHeight: 20
  },
  count: {
    color: colors.accent,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '600'
  }
});
