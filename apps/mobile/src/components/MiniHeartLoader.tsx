import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

type MiniHeartLoaderProps = {
  size?: number;
  color?: string;
  accessibilityLabel?: string;
};

export function MiniHeartLoader({
  size = 18,
  color = '#7A5A3C',
  accessibilityLabel = 'Loading'
}: MiniHeartLoaderProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.12]
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1]
  });

  return (
    <Animated.View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      style={[
        styles.loader,
        {
          opacity,
          transform: [{ scale }]
        }
      ]}
    >
      <Ionicons name="heart-outline" size={size} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loader: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});
