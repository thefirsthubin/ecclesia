/**
 * Animation/motion tokens (Design System v1.0 Part 5's motion discipline,
 * Part 6.7). Durations in milliseconds; easing as cubic-bezier control
 * points (works directly as a CSS `cubic-bezier()` argument list on web,
 * and as `Easing.bezier(...)` arguments via `react-native-reanimated` or
 * the core `Animated` API on native - one source value, two native
 * consumption shapes).
 */
export interface CubicBezier {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const motion = {
  duration: {
    fast: 120,
    standard: 220,
    slow: 350,
  },
  easing: {
    standard: { x1: 0, y1: 0, x2: 0.2, y2: 1 } satisfies CubicBezier, // ease-out
    emphasized: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 } satisfies CubicBezier, // ease-in-out
  },
} as const;

export type MotionDuration = keyof typeof motion.duration;
export type MotionEasing = keyof typeof motion.easing;
