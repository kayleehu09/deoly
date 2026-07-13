import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../constants/theme';
import type { PostDuration } from '../types/models';

type PostTypeToggleProps = {
  value: PostDuration;
  onChange: (value: PostDuration) => void;
};

const options: Array<{ label: string; value: PostDuration }> = [
  { label: '24 Hours', value: '24h' },
  { label: 'Permanent', value: 'permanent' }
];

export function PostTypeToggle({ value, onChange }: PostTypeToggleProps) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.option, active && styles.activeOption]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    padding: 4
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    paddingVertical: spacing.sm
  },
  activeOption: {
    backgroundColor: colors.surface
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    fontWeight: '600'
  },
  activeLabel: {
    color: colors.text
  }
});
