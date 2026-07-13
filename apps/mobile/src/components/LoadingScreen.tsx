import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors, radii } from '../constants/theme';

export function LoadingScreen() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const markScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08]
  });
  const markOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.78, 1]
  });
  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1.28]
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0]
  });

  return (
    <View accessibilityLabel="Loading Deoly" accessibilityRole="progressbar" style={styles.screen}>
      <View style={styles.markWrap}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }]
            }
          ]}
        />
        <Animated.View
          style={[
            styles.mark,
            {
              opacity: markOpacity,
              transform: [{ scale: markScale }]
            }
          ]}
        >
          <Ionicons name="heart-outline" size={28} color="#7A5A3C" />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCF7F1'
  },
  markWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ring: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(122, 90, 60, 0.18)'
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(122, 90, 60, 0.16)',
    shadowColor: '#7A5A3C',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8
    },
    elevation: 4
  }
});
