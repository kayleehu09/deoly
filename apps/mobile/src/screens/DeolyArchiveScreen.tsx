import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, radii, spacing, typography } from '../constants/theme';
import { useAppData } from '../hooks/useAppData';
import type { FeedPost } from '../types/models';
import type { RootStackParamList } from '../types/navigation';
import { getLatestDailyDeolies } from '../utils/postUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'DeolyArchive'>;

const MEMORY_PLACEHOLDER_COUNT = 12;

function formatMemoryDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function MemoryTile({ post }: { post: FeedPost }) {
  return (
    <View style={styles.memoryTile}>
      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.memoryImage} />
      ) : (
        <View style={styles.memoryTextTile}>
          <Text style={styles.memoryCaption} numberOfLines={4}>
            {post.caption || 'Deoly'}
          </Text>
        </View>
      )}
      <View style={styles.memoryMeta}>
        <Text style={styles.memoryDate}>{formatMemoryDate(post.createdAt)}</Text>
        {post.caption ? (
          <Text style={styles.memoryCaptionPreview} numberOfLines={2}>
            {post.caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function DeolyArchiveScreen({ navigation }: Props) {
  const { currentUser, feedPosts } = useAppData();
  const userDeolies = currentUser ? getLatestDailyDeolies(feedPosts, currentUser.id) : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Close deoly archive"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.surface} />
        </Pressable>
        <Text style={styles.headerTitle}>Memories</Text>
        <View style={styles.iconButtonSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Recent deolies</Text>
        <View style={styles.memoriesGrid}>
          {userDeolies.map((post) => (
            <MemoryTile post={post} key={post.id} />
          ))}
          {Array.from({ length: MEMORY_PLACEHOLDER_COUNT }, (_, index) => (
            <View style={styles.memoryPlaceholderTile} key={`memory-placeholder-${index}`}>
              <View style={[styles.memoryPlaceholderGlow, index % 3 === 0 ? styles.memoryPlaceholderGlowAlt : null]} />
              <Ionicons name="image-outline" size={24} color="rgba(255, 255, 255, 0.58)" />
              <Text style={styles.memoryPlaceholderText}>Empty</Text>
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
    backgroundColor: '#050505'
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconButtonSpacer: {
    width: 36,
    height: 36
  },
  headerTitle: {
    color: colors.surface,
    fontFamily: typography.titleFamily,
    fontSize: 18,
    fontWeight: '800'
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.surface,
    fontFamily: typography.titleFamily,
    fontSize: 22,
    fontWeight: '800'
  },
  memoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  memoryTile: {
    width: '48%',
    minHeight: 220,
    borderRadius: radii.sm,
    backgroundColor: '#191919',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  memoryImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#252525'
  },
  memoryTextTile: {
    width: '100%',
    aspectRatio: 1,
    padding: spacing.md,
    justifyContent: 'center',
    backgroundColor: '#252525'
  },
  memoryMeta: {
    padding: spacing.sm,
    gap: 5
  },
  memoryDate: {
    color: 'rgba(255, 255, 255, 0.68)',
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    lineHeight: 18
  },
  memoryCaption: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    lineHeight: 20
  },
  memoryCaptionPreview: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    lineHeight: 20
  },
  memoryPlaceholderTile: {
    width: '31%',
    aspectRatio: 0.74,
    borderRadius: radii.sm,
    backgroundColor: '#191919',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs
  },
  memoryPlaceholderGlow: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(200, 169, 106, 0.24)'
  },
  memoryPlaceholderGlowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)'
  },
  memoryPlaceholderText: {
    color: 'rgba(255, 255, 255, 0.68)',
    fontFamily: typography.bodyFamily,
    fontSize: 12,
    fontWeight: '700'
  },
  pressed: {
    opacity: 0.72
  }
});
