import { Ionicons } from '@expo/vector-icons';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, radii, spacing, typography } from '../constants/theme';
import type { RootStackParamList } from '../types/navigation';

export function CreatePostCameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const isFocused = useIsFocused();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) {
      return;
    }

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8
      });

      if (photo?.uri) {
        rootNavigation.navigate('PostComposer', {
          imageUri: photo.uri
        });
      }
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>
          Deoly opens straight into the camera so posting feels quick and natural.
        </Text>
        <Pressable onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Enable Camera</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} mode="picture" />
      ) : null}

      <SafeAreaView style={styles.overlay}>
        <View style={styles.topRow} />

        <View style={styles.bottomRow}>
          <Pressable
            style={styles.sideControl}
            hitSlop={12}
            onPress={() =>
              rootNavigation.navigate('MainTabs', {
                screen: 'HomeTab'
              })
            }
          >
            <Ionicons name="close" size={28} color={colors.surface} />
          </Pressable>
          <Pressable onPress={handleCapture} style={styles.shutterOuter}>
            <View style={styles.shutterInner}>{isCapturing ? <ActivityIndicator color={colors.text} /> : null}</View>
          </Pressable>
          <Pressable
            onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
            style={styles.sideControl}
            hitSlop={12}
          >
            <Ionicons name="sync-outline" size={28} color={colors.surface} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg
  },
  topRow: {
    minHeight: 48
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.lg
  },
  sideControl: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center'
  },
  shutterOuter: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 4,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)'
  },
  shutterInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
    gap: spacing.sm
  },
  permissionTitle: {
    color: colors.text,
    fontFamily: typography.titleFamily,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center'
  },
  permissionText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  },
  permissionButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill
  },
  permissionButtonText: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    fontWeight: '700'
  }
});
