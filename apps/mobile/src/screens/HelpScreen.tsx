import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, radii, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../hooks/useAppData';
import { submitPostReport } from '../services/safety';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Help'>;
const reasons = ['Inappropriate content', 'Bullying or harassment', 'Spam', 'Something else'];

export function HelpScreen({ navigation }: Props) {
  const { auth } = useAuth();
  const { feedPosts, currentUser } = useAppData();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reportablePosts = feedPosts.filter((post) => post.userId !== currentUser?.id);

  async function sendReport() {
    if (!auth || !selectedPostId || !reason || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitPostReport(selectedPostId, reason, details, auth.session.token);
      Alert.alert('Report sent', 'Thanks for letting us know. Your report is private and will be reviewed.', [
        { text: 'Done', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Could not send report', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
        <View><Text style={styles.title}>Help</Text><Text style={styles.subtitle}>Report something that needs attention</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Report a post</Text>
        <Text style={styles.copy}>Choose the post and tell us what concerns you. Reports are private and reviewed by the app owner.</Text>
        <Text style={styles.label}>Choose a post</Text>
        {reportablePosts.length ? reportablePosts.map((post) => (
          <Pressable key={post.id} onPress={() => setSelectedPostId(post.id)} style={[styles.post, selectedPostId === post.id && styles.selected]}>
            <Text style={styles.postTitle}>@{post.user.username}</Text>
            <Text numberOfLines={2} style={styles.copy}>{post.caption || 'Photo post'}</Text>
          </Pressable>
        )) : <Text style={styles.copy}>No other people’s posts are available in your feed right now.</Text>}
        {selectedPostId ? <>
          <Text style={styles.label}>Reason</Text>
          <View style={styles.reasonList}>{reasons.map((item) => (
            <Pressable key={item} onPress={() => setReason(item)} style={[styles.reason, reason === item && styles.selected]}>
              <Text style={styles.reasonText}>{item}</Text>
            </Pressable>
          ))}</View>
          <Text style={styles.label}>More detail (optional)</Text>
          <TextInput value={details} onChangeText={setDetails} maxLength={1000} multiline placeholder="Add context to help us review" placeholderTextColor={colors.textMuted} style={styles.input} />
          <Pressable disabled={!reason || isSubmitting} onPress={() => void sendReport()} style={[styles.submit, (!reason || isSubmitting) && styles.disabled]}>
            <Text style={styles.submitText}>{isSubmitting ? 'Sending…' : 'Send report'}</Text>
          </Pressable>
        </> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 32 },
  title: { color: colors.text, fontFamily: typography.titleFamily, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontFamily: typography.bodyFamily, fontSize: 13 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  heading: { color: colors.text, fontFamily: typography.titleFamily, fontSize: 21, fontWeight: '800' },
  copy: { color: colors.textMuted, fontFamily: typography.bodyFamily, fontSize: 14, lineHeight: 20 },
  label: { marginTop: spacing.sm, color: colors.text, fontFamily: typography.bodyFamily, fontWeight: '700' },
  post: { padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 4 },
  selected: { borderColor: colors.text, borderWidth: 2 },
  postTitle: { color: colors.text, fontWeight: '700' },
  reasonList: { gap: spacing.sm },
  reason: { padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  reasonText: { color: colors.text },
  input: { minHeight: 90, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, textAlignVertical: 'top' },
  submit: { padding: spacing.md, alignItems: 'center', borderRadius: radii.md, backgroundColor: colors.text },
  submitText: { color: colors.surface, fontWeight: '700' },
  disabled: { opacity: 0.45 }
});
