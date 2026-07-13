import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, radii, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'default' | 'danger';
  onPress: () => void;
};

function SettingsRow({ icon, label, tone = 'default', onPress }: SettingsRowProps) {
  const isDanger = tone === 'danger';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={isDanger ? colors.danger : colors.text} />
        <Text style={[styles.rowLabel, isDanger ? styles.dangerText : null]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const { deleteAccount, signOut } = useAuth();

  function handleComingSoon(label: string) {
    Alert.alert(label, 'This section will be built out soon.');
  }

  function handleLogOut() {
    Alert.alert('Log out?', 'You can sign back in with your email and password.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          void signOut();
        }
      }
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and removes your posts, comments, reactions, friendships, and sessions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteAccount().catch((err) => {
              Alert.alert('Could not delete account', err instanceof Error ? err.message : 'Please try again.');
            });
          }
        }
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Close settings"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Account, help, and app preferences</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <SettingsRow icon="person-outline" label="Your Account" onPress={() => handleComingSoon('Your Account')} />
          <SettingsRow icon="help-circle-outline" label="FAQs" onPress={() => handleComingSoon('FAQs')} />
          <SettingsRow icon="notifications-outline" label="Notifications" onPress={() => handleComingSoon('Notifications')} />
          <SettingsRow icon="chatbubble-ellipses-outline" label="Help" onPress={() => handleComingSoon('Help')} />
        </View>

        <View style={styles.dangerSection}>
          <SettingsRow icon="log-out-outline" label="Log out" onPress={handleLogOut} />
          <SettingsRow icon="trash-outline" label="Delete" tone="danger" onPress={handleDeleteAccount} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  headerText: {
    flex: 1,
    gap: 2
  },
  title: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 26,
    fontWeight: '800'
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 13
  },
  content: {
    gap: spacing.lg,
    padding: spacing.md,
    paddingBottom: spacing.xl
  },
  section: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface
  },
  dangerSection: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface
  },
  row: {
    minHeight: 54,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  rowLabel: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    fontWeight: '700'
  },
  dangerText: {
    color: colors.danger
  },
  pressed: {
    opacity: 0.72
  }
});
