import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { colors, radii } from '../constants/theme';

type HeartPeopleButtonProps = {
  onPress: () => void;
};

const CHAMPAGNE_GOLD = '#C8A96A';

export function HeartPeopleButton({ onPress }: HeartPeopleButtonProps) {
  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shineAnimation = Animated.sequence([
      Animated.delay(420),
      Animated.timing(shine, {
        toValue: 1,
        duration: 680,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(shine, {
        toValue: 0,
        duration: 720,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      })
    ]);

    shineAnimation.start();
    return () => shineAnimation.stop();
  }, [shine]);

  const rayScale = shine.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1.24]
  });
  const rayOpacity = shine.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.32]
  });

  return (
    <Pressable
      accessibilityLabel="Open friends"
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}
    >
      <View style={styles.icon}>
        <View style={[styles.sidePerson, styles.leftPerson]}>
          <View style={styles.sideHead} />
          <View style={styles.sideBody} />
        </View>
        <View style={[styles.sidePerson, styles.rightPerson]}>
          <View style={styles.sideHead} />
          <View style={styles.sideBody} />
        </View>
        <View style={styles.centerPerson}>
          <View style={styles.centerHead} />
          <View style={styles.centerBody} />
        </View>
        <Animated.View
          pointerEvents="none"
          style={[styles.rayGroup, { opacity: rayOpacity, transform: [{ scale: rayScale }] }]}
        >
          <View style={[styles.ray, styles.rayOne]} />
          <View style={[styles.ray, styles.rayTwo]} />
          <View style={[styles.ray, styles.rayThree]} />
        </Animated.View>
        <View style={styles.heart}>
          <Ionicons name="heart" size={9} color={CHAMPAGNE_GOLD} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonPressed: {
    backgroundColor: colors.surfaceMuted,
    transform: [{ scale: 0.96 }]
  },
  icon: {
    width: 28,
    height: 26
  },
  sidePerson: {
    position: 'absolute',
    top: 4,
    width: 10,
    alignItems: 'center'
  },
  leftPerson: {
    left: 1
  },
  rightPerson: {
    right: 1
  },
  centerPerson: {
    position: 'absolute',
    top: 1,
    left: 8,
    width: 12,
    alignItems: 'center',
    zIndex: 2
  },
  sideHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text
  },
  sideBody: {
    width: 10,
    height: 11,
    marginTop: 2,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.text
  },
  centerHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.text
  },
  centerBody: {
    width: 13,
    height: 12,
    marginTop: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: colors.text
  },
  heart: {
    position: 'absolute',
    top: 12,
    right: 5,
    zIndex: 6
  },
  rayGroup: {
    position: 'absolute',
    top: 7,
    right: 0,
    width: 18,
    height: 17,
    zIndex: 5
  },
  ray: {
    position: 'absolute',
    width: 1,
    height: 4,
    borderRadius: 1,
    backgroundColor: CHAMPAGNE_GOLD
  },
  rayOne: {
    top: 0,
    right: 8,
    transform: [{ rotate: '0deg' }]
  },
  rayTwo: {
    top: 4,
    right: 2,
    transform: [{ rotate: '50deg' }]
  },
  rayThree: {
    top: 11,
    right: 4,
    transform: [{ rotate: '112deg' }]
  }
});
