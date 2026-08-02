import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { useReducedMotion } from '../ThemeProvider';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  circle?: boolean;
  testId?: string;
}

/**
 * Loading placeholder. Mirrors `ui-web`'s `Skeleton`: pulse animation is
 * disabled when the platform's reduce-motion accessibility setting is on,
 * leaving a static neutral block instead.
 */
export function Skeleton({ width = '100%', height = 16, radius = 'sm', circle = false, testId }: SkeletonProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: theme.motion.duration.slow,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: theme.motion.duration.slow,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, opacity, theme.motion.duration.slow]);

  const borderRadius = circle
    ? (typeof height === 'number' ? height : 9999) / 2
    : radius === 'none'
      ? 0
      : radius === 'full'
        ? 9999
        : theme.radius[radius];

  return (
    <Animated.View
      testID={testId}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: circle ? height : width,
        height,
        borderRadius,
        backgroundColor: theme.colors.border.subtle,
        opacity,
      }}
    />
  );
}
