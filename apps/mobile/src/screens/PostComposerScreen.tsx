import { useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, radii, spacing, typography } from '../constants/theme';
import { useAppData } from '../hooks/useAppData';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'PostComposer'>;

export function PostComposerScreen({ navigation, route }: Props) {
  const { publishPost } = useAppData();
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = async () => {
    try {
      setIsPosting(true);
      await publishPost({
        imageUrl: route.params.imageUri,
        caption
      });

      navigation.navigate('MainTabs', {
        screen: 'HomeTab'
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
            placeholder="Optional short caption"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={140}
            style={styles.input}
          />
        </View>

        <Pressable onPress={handlePost} style={[styles.button, isPosting && styles.buttonDisabled]} disabled={isPosting}>
          <Text style={styles.buttonText}>{isPosting ? 'Posting...' : 'Post'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing.xl
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
  buttonText: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 16,
    fontWeight: '700'
  }
});
