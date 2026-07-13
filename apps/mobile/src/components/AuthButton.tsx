import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MiniHeartLoader } from './MiniHeartLoader';
import { colors, radii, spacing, typography } from '../constants/theme';

type AuthButtonVariant = 'primary' | 'secondary' | 'ghost';

type AuthButtonProps = {
  label: string;
  variant?: AuthButtonVariant;
  icon?: ReactNode;
  onPress?: ComponentProps<typeof Pressable>['onPress'];
  disabled?: boolean;
  loading?: boolean;
};

export function AuthButton({ label, variant = 'secondary', icon, onPress, disabled = false, loading = false }: AuthButtonProps) {
  const isDisabled = disabled || loading;
  const loaderColor = variant === 'primary' ? colors.surface : '#7A5A3C';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && onPress ? styles.pressed : null,
        isDisabled ? styles.disabled : null
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <View style={styles.iconSlot}>
            <MiniHeartLoader color={loaderColor} />
          </View>
        ) : icon ? (
          <View style={styles.iconSlot}>{icon}</View>
        ) : null}
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 56,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  primary: {
    backgroundColor: colors.text
  },
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(64, 50, 37, 0.12)'
  },
  ghost: {
    minHeight: 48,
    backgroundColor: 'transparent'
  },
  content: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm
  },
  iconSlot: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {
    fontFamily: typography.bodyFamily,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0
  },
  primaryLabel: {
    color: colors.surface
  },
  secondaryLabel: {
    color: colors.text
  },
  ghostLabel: {
    color: '#6F553E'
  },
  pressed: {
    opacity: 0.86
  },
  disabled: {
    opacity: 0.58
  }
});
