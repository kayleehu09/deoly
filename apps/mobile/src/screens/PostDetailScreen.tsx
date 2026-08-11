import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PostCard } from '../components/PostCard';
import { ReactionViewerSheet } from '../components/ReactionViewerSheet';
import { colors, spacing, typography } from '../constants/theme';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { getPostById } from '../services/posts';
import type { FeedPost, PostReactionGroup, ReactionEmoji } from '../types/models';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

export function PostDetailScreen({ route }: Props) {
  const { auth } = useAuth();
  const { togglePostReaction, loadPostReactions, commentOnPost } = useAppData();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactionGroups, setReactionGroups] = useState<PostReactionGroup[]>([]);
  const [isLoadingReactions, setIsLoadingReactions] = useState(false);
  const [reactionError, setReactionError] = useState<string | null>(null);
  const [isReactionSheetVisible, setIsReactionSheetVisible] = useState(false);

  const loadPost = async () => {
    if (!auth) {
      return;
    }

    try {
      setError(null);
      setPost(await getPostById(route.params.postId, auth.session.token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this post.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPost();
  }, [auth, route.params.postId]);

  const handleReactionPress: Parameters<typeof PostCard>[0]['onReactionPress'] = async (selectedPost, emoji) => {
    await togglePostReaction(selectedPost, emoji);
    await loadPost();
  };

  const handleCommentSubmit: Parameters<typeof PostCard>[0]['onCommentSubmit'] = async (selectedPost, body) => {
    await commentOnPost(selectedPost.id, body);
    await loadPost();
  };

  const handleReactionDetailsPress = async (selectedPost: FeedPost, emoji: ReactionEmoji) => {
    setIsReactionSheetVisible(true);
    setReactionGroups([]);
    setReactionError(null);
    setIsLoadingReactions(true);

    try {
      setReactionGroups(await loadPostReactions(selectedPost.id, emoji));
    } catch (err) {
      setReactionError(err instanceof Error ? err.message : 'Could not load reactions.');
    } finally {
      setIsLoadingReactions(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Could not load comments</Text>
          <Text style={styles.errorText}>{error ?? 'This post is unavailable.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PostCard
          post={post}
          showAllComments
          onReactionPress={handleReactionPress}
          onReactionDetailsPress={handleReactionDetailsPress}
          onCommentSubmit={handleCommentSubmit}
        />
      </ScrollView>
      <ReactionViewerSheet
        visible={isReactionSheetVisible}
        groups={reactionGroups}
        isLoading={isLoadingReactions}
        error={reactionError}
        onClose={() => setIsReactionSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    paddingBottom: spacing.xl
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm
  },
  errorTitle: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 18,
    fontWeight: '700'
  },
  errorText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  }
});
