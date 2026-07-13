import { Ionicons } from '@expo/vector-icons';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';

type AvatarPreviewModalProps = {
  imageUri: string | null;
  displayName: string;
  username: string;
  visible: boolean;
  onClose: () => void;
};

export function AvatarPreviewModal({ imageUri, displayName, username, visible, onClose }: AvatarPreviewModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.backdrop}>
        <Pressable style={styles.content}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.avatar} /> : null}
          <View style={styles.identity}>
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.username}>@{username}</Text>
          </View>
        </Pressable>
        <Pressable accessibilityLabel="Close avatar preview" accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={26} color={colors.surface} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    padding: spacing.lg
  },
  content: {
    alignItems: 'center',
    gap: spacing.md
  },
  avatar: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.surfaceMuted
  },
  identity: {
    alignItems: 'center',
    gap: 4
  },
  displayName: {
    color: colors.surface,
    fontFamily: typography.titleFamily,
    fontSize: 24,
    fontWeight: '700'
  },
  username: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    opacity: 0.76
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 24,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
