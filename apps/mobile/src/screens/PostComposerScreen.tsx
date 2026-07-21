import { useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, radii, spacing, typography } from '../constants/theme';
import { useAppData } from '../hooks/useAppData';
import type { PostProgressStage } from '../services/posts';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'PostComposer'>;

const POST_PROGRESS_LABELS: Record<PostProgressStage, string> = {
  preparing: 'Preparing photo...',
  uploading: 'Uploading photo...',
  creating: 'Creating deoly...',
  refreshing: 'Refreshing feed...',
  done: 'Deoly ready.'
};

const KEYBOARD_DISMISS_SCROLL_UP_THRESHOLD = 24;
const POST_ERROR_MESSAGE = "Couldn't post right now. Check your internet connection and try again.";

export function PostComposerScreen({ navigation, route }: Props) {
  const { publishPost } = useAppData();
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [progressStage, setProgressStage] = useState<PostProgressStage | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const lastScrollYRef = useRef(0);

  const handlePost = async () => {
    try {
      setPostError(null);
      setProgressStage('preparing');
      setIsPosting(true);
      await publishPost({
        imageUrl: route.params.imageUri,
        caption,
        onProgress: setProgressStage
      });

      navigation.navigate('MainTabs', {
        screen: 'HomeTab'
      });
    } catch (err) {
      console.warn('Post failed', err);
      setProgressStage(null);
      setPostError(POST_ERROR_MESSAGE);
    } finally {
      setIsPosting(false);
    }
  };

  const buttonLabel = isPosting ? 'Posting...' : postError ? 'Retry' : 'Post';
  const progressLabel = progressStage ? POST_PROGRESS_LABELS[progressStage] : null;
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const isScrollingTowardTop = currentScrollY < lastScrollYRef.current - KEYBOARD_DISMISS_SCROLL_UP_THRESHOLD;

    if (isScrollingTowardTop) {
      Keyboard.dismiss();
    }

    lastScrollYRef.current = currentScrollY;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Compose post</Text>
            <Text style={styles.subtitle}>Keep it short. The photo leads.</Text>
          </View>

          <Image source={{ uri: route.params.imageUri }} style={styles.preview} />

          <View style={styles.section}>
            <Text style={styles.label}>Caption</Text>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="verses, conversation pts, takeaways, & more..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={140}
              editable={!isPosting}
              style={styles.input}
            />
          </View>

          {progressLabel ? <Text style={styles.statusText}>{progressLabel}</Text> : null}
          {postError ? <Text style={styles.errorText}>{postError}</Text> : null}

          <Pressable onPress={handlePost} style={[styles.button, isPosting && styles.buttonDisabled]} disabled={isPosting}>
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  keyboardAvoidingView: {
    flex: 1
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: 160
  },
  header: {
    gap: 4
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
    fontSize: 15
  },
  preview: {
    width: '100%',
    aspectRatio: 0.82,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceMuted
  },
  section: {
    gap: spacing.sm
  },
  label: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    fontWeight: '700'
  },
  input: {
    minHeight: 108,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    textAlignVertical: 'top'
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.7
  },
  statusText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    textAlign: 'center'
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
  },
  buttonText: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 16,
    fontWeight: '700'
  }
});
