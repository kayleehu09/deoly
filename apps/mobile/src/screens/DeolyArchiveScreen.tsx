import { Ionicons } from '@expo/vector-icons';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, radii, spacing, typography } from '../constants/theme';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'DeolyArchive'>;

const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const calendarDays = Array.from({ length: 31 }, (_, index) => index + 1);

export function DeolyArchiveScreen({ navigation }: Props) {
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
        <Text style={styles.monthTitle}>July 2026</Text>
        <View style={styles.weekRow}>
          {weekDays.map((day) => (
            <Text style={styles.weekDay} key={day}>{day}</Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {calendarDays.map((day) => (
            <View style={styles.dayTile} key={day}>
              <View style={[styles.dayGlow, day % 3 === 0 ? styles.dayGlowAlt : null]} />
              <Text style={styles.dayNumber}>{day}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.archiveNote}>
          Deoly history will fill this calendar once archive storage is ready.
        </Text>
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
  monthTitle: {
    color: colors.surface,
    fontFamily: typography.titleFamily,
    fontSize: 22,
    fontWeight: '800'
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  weekDay: {
    width: '14.2%',
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: typography.bodyFamily,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center'
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  dayTile: {
    width: '12.5%',
    aspectRatio: 0.74,
    borderRadius: radii.sm,
    backgroundColor: '#191919',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center'
  },
  dayGlow: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(200, 169, 106, 0.28)'
  },
  dayGlowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)'
  },
  dayNumber: {
    color: colors.surface,
    fontFamily: typography.titleFamily,
    fontSize: 18,
    fontWeight: '800'
  },
  archiveNote: {
    color: 'rgba(255, 255, 255, 0.68)',
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    lineHeight: 19
  },
  pressed: {
    opacity: 0.72
  }
});
