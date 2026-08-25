import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
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
import { useAuth } from '../hooks/useAuth';
import { blockUser, getBlockedUsers, unblockUser, type BlockListItem } from '../services/safety';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'BlockedUsers'>;
type BlockStatus = 'blocked' | 'unblocked';
type BlockedRowItem = BlockListItem & {
  status: BlockStatus;
};

const DEFAULT_AVATAR_URL = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80';
const BLOCKS_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeout: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

function BlockedIdentity({ item }: { item: BlockedRowItem }) {
  return (
    <View style={styles.identity}>
      <Image source={{ uri: item.user.avatarUrl ?? DEFAULT_AVATAR_URL }} style={styles.avatar} />
      <View style={styles.identityText}>
        <Text style={styles.displayName}>{item.user.displayName}</Text>
        <Text style={styles.username}>@{item.user.username}</Text>
      </View>
    </View>
  );
}

export function BlockedUsersScreen({ navigation }: Props) {
  const { auth } = useAuth();
  const { refreshAppData } = useAppData();
  const token = auth?.session.token;
  const [blocks, setBlocks] = useState<BlockedRowItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const trimmedQuery = query.trim().toLowerCase();
  const visibleBlocks = useMemo(() => {
    const sortedBlocks = [...blocks].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'blocked' ? -1 : 1;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (!trimmedQuery) {
      return sortedBlocks;
    }

    return sortedBlocks.filter((item) => {
      return (
        item.user.displayName.toLowerCase().includes(trimmedQuery) ||
        item.user.username.toLowerCase().includes(trimmedQuery)
      );
    });
  }, [blocks, trimmedQuery]);

  const refreshBlocks = useCallback(async () => {
    if (!token) {
      setBlocks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await withTimeout(
        getBlockedUsers(token),
        BLOCKS_TIMEOUT_MS,
        'Blocked users are taking too long to load.'
      );
      setBlocks(response.blocks.map((block) => ({ ...block, status: 'blocked' })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load blocked users.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void refreshBlocks();

      return () => {
        setBlocks((currentBlocks) => currentBlocks.filter((block) => block.status === 'blocked'));
      };
    }, [refreshBlocks])
  );

  function handleBlockToggle(item: BlockedRowItem) {
    if (!token || busyUserId) {
      return;
    }

    const previousBlocks = blocks;
    const nextStatus: BlockStatus = item.status === 'blocked' ? 'unblocked' : 'blocked';
    setBusyUserId(item.user.id);
    setError(null);
    setBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.id === item.id
          ? {
              ...block,
              status: nextStatus
            }
          : block
      )
    );

    void (async () => {
      try {
        if (nextStatus === 'unblocked') {
          await withTimeout(
            unblockUser(item.user.id, token),
            BLOCKS_TIMEOUT_MS,
            'Unblock is taking too long to update. Make sure the API is running, then try again.'
          );
        } else {
          await withTimeout(
            blockUser(item.user.id, token),
            BLOCKS_TIMEOUT_MS,
            'Block is taking too long to update. Make sure the API is running, then try again.'
          );
        }

        await refreshAppData();
      } catch (err) {
        setBlocks(previousBlocks);
        setError(err instanceof Error ? err.message : 'Could not update this block.');
      } finally {
        setBusyUserId(null);
      }
    })();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Close blocked users"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Blocked</Text>
          <Text style={styles.subtitle}>People hidden from your account</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshBlocks} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search blocked"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          {query ? (
            <Pressable
              accessibilityLabel="Clear blocked search"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setQuery('')}
              style={({ pressed }) => pressed ? styles.pressed : null}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {isLoading && visibleBlocks.length === 0 ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : null}
        {!isLoading && blocks.length === 0 ? <Text style={styles.emptyText}>No blocked people</Text> : null}
        {!isLoading && blocks.length > 0 && visibleBlocks.length === 0 ? (
          <Text style={styles.emptyText}>No blocked people match that search</Text>
        ) : null}

        {visibleBlocks.map((item) => {
          const isBusy = busyUserId === item.user.id;
          const isUnblocked = item.status === 'unblocked';

          return (
            <View style={styles.row} key={item.id}>
              <BlockedIdentity item={item} />
              <Pressable
                accessibilityLabel={isUnblocked ? `Block ${item.user.displayName}` : `Unblock ${item.user.displayName}`}
                accessibilityRole="button"
                disabled={isBusy}
                onPress={() => handleBlockToggle(item)}
                style={({ pressed }) => [
                  styles.statusPill,
                  isUnblocked ? styles.unblockedStatusPill : styles.blockedStatusPill,
                  pressed ? styles.pressed : null,
                  isBusy ? styles.disabled : null
                ]}
              >
                <Text style={[styles.statusPillText, isUnblocked ? styles.unblockedStatusText : styles.blockedStatusText]}>
                  {isUnblocked ? 'Unblocked' : 'Blocked'}
                </Text>
              </Pressable>
            </View>
          );
        })}
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
    gap: spacing.xs,
    padding: spacing.md,
    paddingBottom: spacing.xl
  },
  searchBox: {
    minHeight: 46,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    paddingVertical: spacing.sm
  },
  row: {
    minHeight: 56,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  identity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceMuted
  },
  identityText: {
    flex: 1,
    minWidth: 0,
    gap: 2
  },
  displayName: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 15,
    fontWeight: '800'
  },
  username: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 13
  },
  statusPill: {
    minHeight: 34,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  blockedStatusPill: {
    borderColor: colors.danger,
    backgroundColor: colors.danger
  },
  unblockedStatusPill: {
    borderColor: colors.border,
    backgroundColor: colors.accentSoft
  },
  statusPillText: {
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700'
  },
  blockedStatusText: {
    color: colors.surface
  },
  unblockedStatusText: {
    color: colors.textMuted
  },
  loadingRow: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    lineHeight: 20
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    lineHeight: 19
  },
  pressed: {
    opacity: 0.72
  },
  disabled: {
    opacity: 0.54
  }
});
