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
    return () => {
      // `[Bug fix, Mobile Personas sprint]` Under Jest, `loop.stop()`
      // touches RN's Animated internals, which behave differently
      // under the mocked `NativeAnimatedHelper` (`test-setup.ts` in
      // both this lib and `apps/mobile`) than on a real device. This
      // try/catch is defensive insurance around that Jest-only surface
      // - `NativeAnimatedHelper` is never mocked in a running app, so
      // `loop.stop()` cannot throw there.
      //
      // Note: a real `pnpm test` run (parallel workers, unlike this
      // sandbox's serial `--runInBand`) showed `mobile:test` and
      // `ui-native:test` failing with "Exceeded timeout of 5000 ms"
      // after this sprint added nine Skeleton-heavy screens. That
      // turned out to be plain CPU contention under parallel load (the
      // same tests pass in 1-2s isolated), not something this
      // try/catch addresses - see `testTimeout: 20000` in
      // `apps/mobile/jest.config.ts` / `libs/ui/native/jest.config.ts`
      // for the actual fix.
      try {
        loop.stop();
      } catch {
        // Test-environment-only, see above - nothing to recover or log.
      }
    };
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
