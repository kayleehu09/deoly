import { Ionicons } from '@expo/vector-icons';
import { ImageBackground, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, radii, spacing, typography } from '../constants/theme';
import { useAppData } from '../hooks/useAppData';
import type { RootStackParamList } from '../types/navigation';
import { getLatestDailyDeolies, getLocalDateKey } from '../utils/postUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'DeolyArchive'>;

const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const CALENDAR_COLUMNS = 7;
const CALENDAR_GAP = 6;
const MONTHS_TO_SHOW = 3;
const TILE_ASPECT_RATIO = 0.72;

function getMonthDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const emptyStartDays = Array.from({ length: firstWeekday }, (_, index) => ({
    day: null,
    dateKey: `empty-start-${index}`
  }));
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dayDate = new Date(year, month, day, 12, 0, 0, 0);

    return {
      day,
      dateKey: getLocalDateKey(dayDate.toISOString())
    };
  });

  return [...emptyStartDays, ...monthDays];
}

function formatMonthTitle(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function getRecentMonths(startDate: Date) {
  return Array.from({ length: MONTHS_TO_SHOW }, (_, index) => {
    return new Date(startDate.getFullYear(), startDate.getMonth() - index, 1, 12, 0, 0, 0);
  });
}

export function DeolyArchiveScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { currentUser, profileDeolies } = useAppData();
  const userDeolies = currentUser ? getLatestDailyDeolies(profileDeolies, currentUser.id) : [];
  const visibleMonth = userDeolies[0] ? new Date(userDeolies[0].createdAt) : new Date();
  const postByDate = new Map(userDeolies.map((post) => [getLocalDateKey(post.createdAt), post]));
  const months = getRecentMonths(visibleMonth);
  const tileWidth = Math.floor((width - spacing.sm * 2 - CALENDAR_GAP * (CALENDAR_COLUMNS - 1)) / CALENDAR_COLUMNS);
  const tileSize = {
    width: tileWidth,
    height: Math.round(tileWidth / TILE_ASPECT_RATIO)
  };

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
        <Text style={styles.headerTitle}>Recent deolies</Text>
        <View style={styles.iconButtonSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {months.map((month) => (
          <View style={styles.monthSection} key={`${month.getFullYear()}-${month.getMonth()}`}>
            <Text style={styles.monthTitle}>{formatMonthTitle(month)}</Text>
            <View style={styles.weekRow}>
              {weekDays.map((day) => (
                <Text style={[styles.weekDay, { width: tileWidth }]} key={day}>{day}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {getMonthDays(month).map(({ day, dateKey }) => {
                if (!day) {
                  return <View style={[styles.emptyDayTile, tileSize]} key={dateKey} />;
                }

                const post = postByDate.get(dateKey);

                if (post?.imageUrl) {
                  return (
                    <ImageBackground source={{ uri: post.imageUrl }} style={[styles.dayTile, tileSize]} imageStyle={styles.dayImage} key={dateKey}>
                      <View style={styles.dayImageOverlay} />
                      <Text style={styles.dayNumber}>{day}</Text>
                    </ImageBackground>
                  );
                }

                return (
                  <View style={[styles.dayTile, tileSize, post ? styles.dayTileSaved : day % 3 === 0 ? styles.dayTileMuted : null]} key={dateKey}>
                    <Text style={styles.dayNumber}>{day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
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
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.xl
  },
  monthSection: {
    gap: spacing.sm
  },
  monthTitle: {
    color: colors.surface,
    fontFamily: typography.titleFamily,
    fontSize: 22,
    fontWeight: '800'
  },
  weekRow: {
    flexDirection: 'row',
    gap: CALENDAR_GAP
  },
  weekDay: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: typography.bodyFamily,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center'
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CALENDAR_GAP
  },
  dayTile: {
    borderRadius: radii.sm,
    backgroundColor: '#4A422C',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyDayTile: {
    opacity: 0
  },
  dayTileSaved: {
    backgroundColor: '#221f17',
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 106, 0.62)'
  },
  dayTileMuted: {
    backgroundColor: '#484848'
  },
  dayImage: {
    borderRadius: radii.sm
  },
  dayImageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.2)'
  },
  dayNumber: {
    color: colors.surface,
    fontFamily: typography.titleFamily,
    fontSize: 22,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: {
      width: 0,
      height: 1
    },
    textShadowRadius: 3
  },
  pressed: {
    opacity: 0.72
  }
});
