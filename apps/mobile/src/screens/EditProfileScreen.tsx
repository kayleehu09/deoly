import { useEffect, useRef, useState } from 'react';
import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BIO_MAX_LENGTH, DISPLAY_NAME_MAX_LENGTH, USERNAME_MAX_LENGTH, type UpdateProfileInput } from '@deoly/shared';
import { colors, radii, spacing, typography } from '../constants/theme';
import { DEFAULT_AVATAR_URI } from '../constants/avatar';
import { useAuth } from '../hooks/useAuth';
import { isUnauthorizedApiError } from '../services/auth';
import { saveProfile, type ProfileSaveStage } from '../services/profile';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const { auth, updateUser, clearSavedAuth } = useAuth();
  const original = useRef(auth!.user).current;
  const [displayName, setDisplayName] = useState(original.displayName);
  const [username, setUsername] = useState(original.username);
  const [bio, setBio] = useState(original.bio ?? '');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [removedPhoto, setRemovedPhoto] = useState(false);
  const [stage, setStage] = useState<ProfileSaveStage | null>(null);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);
  const dirty = displayName !== original.displayName || username !== original.username || bio !== (original.bio ?? '') || Boolean(photo) || removedPhoto;
  const errors = {
    displayName: displayName.trim().length < 2 || displayName.trim().length > DISPLAY_NAME_MAX_LENGTH ? 'Use 2–40 characters.' : '',
    username: !/^[a-zA-Z0-9_]{3,24}$/.test(username.trim()) ? 'Use 3–24 letters, numbers, or underscores.' : '',
    bio: bio.trim().length > BIO_MAX_LENGTH ? 'Keep your bio to 160 characters.' : ''
  };
  usePreventRemove(!saved && (dirty || Boolean(stage)), ({ data }) => {
    if (busy.current) return;
    Alert.alert('Discard changes?', 'Your profile changes have not been saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(data.action) }
    ]);
  });
  useEffect(() => { if (saved) navigation.goBack(); }, [saved, navigation]);

  async function choosePhoto() {
    if (busy.current || picking) return;
    setPicking(true);
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Photo access is off. Allow Deoly access to photos in your phone settings, then try again.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
      if (!result.canceled) { setPhoto(result.assets[0]); setRemovedPhoto(false); }
    } catch { setError('Could not open your photo library. Please try again.'); }
    finally { setPicking(false); }
  }

  async function save() {
    if (busy.current || picking || !auth) return;
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    busy.current = true;
    setError(null);
    setStage('saving');
    try {
      const input: UpdateProfileInput = {};
      if (displayName !== original.displayName) input.displayName = displayName.trim();
      if (username !== original.username) input.username = username.trim().toLowerCase();
      if (bio !== (original.bio ?? '')) input.bio = bio.trim();
      if (removedPhoto) input.avatarObjectKey = null;
      const response = await saveProfile(input, photo, auth.session.token, setStage);
      const persisted = await updateUser(response.user, auth.session.token);
      if (!persisted) Alert.alert('Profile saved', 'Your changes are saved on the server, but this phone could not save its local copy. Reconnect before restarting the app.');
      setSaved(true);
    } catch (err) {
      if (isUnauthorizedApiError(err)) { await clearSavedAuth(); return; }
      setError(err instanceof Error ? err.message : 'Could not save your profile. Please try again.');
    } finally { busy.current = false; setStage(null); }
  }

  const disabled = Boolean(stage) || picking;
  const fields = [
    { key: 'displayName' as const, label: 'Display name', value: displayName, set: setDisplayName, max: DISPLAY_NAME_MAX_LENGTH },
    { key: 'username' as const, label: 'Username', value: username, set: setUsername, max: USERNAME_MAX_LENGTH },
    { key: 'bio' as const, label: 'Bio', value: bio, set: setBio, max: BIO_MAX_LENGTH }
  ];
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" disabled={disabled} onPress={() => navigation.goBack()}><Text style={styles.action}>Cancel</Text></Pressable>
        <Text style={styles.title}>Edit profile</Text>
        <Pressable accessibilityRole="button" disabled={disabled || !dirty} onPress={() => void save()}><Text style={[styles.action, (disabled || !dirty) && styles.disabled]}>Save</Text></Pressable>
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.photoSection}>
            <Image accessibilityLabel="Profile photo preview" source={{ uri: photo?.uri ?? (removedPhoto ? DEFAULT_AVATAR_URI : auth?.user.avatarUrl ?? DEFAULT_AVATAR_URI) }} style={styles.avatar} />
            <Pressable accessibilityRole="button" disabled={disabled} onPress={() => void choosePhoto()}><Text style={styles.action}>{picking ? 'Opening library…' : 'Choose photo'}</Text></Pressable>
            {(photo || (!removedPhoto && original.avatarUrl)) ? <Pressable accessibilityRole="button" disabled={disabled} onPress={() => { setPhoto(null); setRemovedPhoto(Boolean(original.avatarUrl)); }}><Text style={styles.remove}>Remove photo</Text></Pressable> : null}
          </View>
          {fields.map((field) => (
            <View key={field.key} style={styles.field}>
              <View style={styles.labelRow}><Text style={styles.label}>{field.label}</Text><Text style={styles.counter}>{field.value.length}/{field.max}</Text></View>
              <TextInput accessibilityLabel={field.label} editable={!disabled} value={field.value} onChangeText={field.set} maxLength={field.max} multiline={field.key === 'bio'} autoCapitalize={field.key === 'username' ? 'none' : 'sentences'} autoCorrect={field.key !== 'username'} style={[styles.input, field.key === 'bio' && styles.bio]} />
              {submitted && errors[field.key] ? <Text style={styles.error}>{errors[field.key]}</Text> : null}
            </View>
          ))}
          <Text style={styles.helper}>Your name, username, bio, and photo are visible to signed-in people you haven’t blocked. Posts keep their existing privacy settings.</Text>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {stage ? <View accessibilityLiveRegion="polite" style={styles.progress}><ActivityIndicator color={colors.accent} /><Text style={styles.label}>{stage === 'preparing' ? 'Preparing photo…' : stage === 'uploading' ? 'Uploading photo…' : 'Saving profile…'}</Text></View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontFamily: typography.titleFamily, fontSize: 22, color: colors.text },
  action: { color: colors.text, fontSize: 16, fontWeight: '600', paddingVertical: 10 },
  disabled: { opacity: 0.4 },
  content: { padding: spacing.lg, gap: spacing.lg },
  photoSection: { alignItems: 'center' },
  avatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.surface },
  remove: { color: colors.danger, padding: 8 },
  field: { gap: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.text, fontSize: 15, fontWeight: '600' },
  counter: { color: colors.textMuted, fontSize: 13 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.surface, color: colors.text, padding: 12, fontSize: 16 },
  bio: { minHeight: 100, textAlignVertical: 'top' },
  helper: { color: colors.textMuted, lineHeight: 20 },
  error: { color: colors.danger, lineHeight: 20 },
  progress: { flexDirection: 'row', gap: 10, alignItems: 'center' }
});
