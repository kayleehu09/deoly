import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { FeedList } from '../components/FeedList';
import { HeartPeopleButton } from '../components/HeartPeopleButton';
import { ReactionViewerSheet } from '../components/ReactionViewerSheet';
import { colors, spacing, typography } from '../constants/theme';
import { useAppData } from '../hooks/useAppData';
import type { FeedPost, PostReactionGroup, ReactionEmoji } from '../types/models';
import type { RootStackParamList } from '../types/navigation';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    currentUser,
    feedPosts,
    isLoading,
    loadError,
    refreshAppData,
    togglePostReaction,
    loadPostReactions,
    commentOnPost
  } = useAppData();
  const [reactionPost, setReactionPost] = useState<FeedPost | null>(null);
  const [reactionGroups, setReactionGroups] = useState<PostReactionGroup[]>([]);
  const [isLoadingReactions, setIsLoadingReactions] = useState(false);
  const [reactionError, setReactionError] = useState<string | null>(null);

  const handleUserPress = (post: FeedPost) => {
    if (post.userId === currentUser?.id) {
      navigation.navigate('MainTabs', { screen: 'ProfileTab' });
      return;
    }

    navigation.navigate('FriendProfile', {
      userId: post.userId,
      user: {
        id: post.user.id,
        username: post.user.username,
        displayName: post.user.displayName,
        profileImageUrl: post.user.profileImageUrl,
        bio: post.user.bio
      }
    });
  };

  const handleReactionDetailsPress = async (post: FeedPost, emoji: ReactionEmoji) => {
    setReactionPost(post);
    setReactionGroups([]);
    setReactionError(null);
    setIsLoadingReactions(true);

    try {
      setReactionGroups(await loadPostReactions(post.id, emoji));
    } catch (err) {
      setReactionError(err instanceof Error ? err.message : 'Could not load reactions.');
    } finally {
      setIsLoadingReactions(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Deoly</Text>
              <Text style={styles.subtitle}>Friends-only devotional posts</Text>
              {currentUser ? <Text style={styles.helper}>Signed in as @{currentUser.username}</Text> : null}
            </View>
            <HeartPeopleButton onPress={() => navigation.navigate('Activity')} />
          </View>
        </View>

        <FeedList
          posts={feedPosts}
          isLoading={isLoading}
          error={loadError}
          onRefresh={refreshAppData}
          onUserPress={handleUserPress}
          onAvatarPress={handleUserPress}
          avatarAccessibilityLabel={(post) => `Open ${post.user.displayName}'s profile`}
          onReactionPress={togglePostReaction}
          onReactionDetailsPress={handleReactionDetailsPress}
          onCommentSubmit={(post, body) => commentOnPost(post.id, body)}
          onOpenComments={(post) => navigation.navigate('PostDetail', { postId: post.id })}
        />
      </View>
      <ReactionViewerSheet
        visible={Boolean(reactionPost)}
        groups={reactionGroups}
        isLoading={isLoadingReactions}
        error={reactionError}
        onClose={() => setReactionPost(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    flex: 1
  },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerTopRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  headerText: {
    flex: 1,
    gap: 2
  },
  title: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 28,
    fontWeight: '700'
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 13
  },
  helper: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 12
  }
});
