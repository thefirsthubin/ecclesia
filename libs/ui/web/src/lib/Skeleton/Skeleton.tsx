import { useTheme } from '../ThemeProvider';
import { useReducedMotion } from '../ThemeProvider';
import type { RadiusToken } from '@ecclesia/ui-core';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: RadiusToken;
  /** A round skeleton (e.g. standing in for an Avatar) - overrides `radius`. */
  circle?: boolean;
  testId?: string;
}

/**
 * A structural loading placeholder (Design System v1.0 Part 7.19 -
 * "matching the eventual content's layout"). The pulse animation is
 * disabled under `useReducedMotion` (Part 6.7's `motion.reduceMotion`),
 * leaving a static, still-informative placeholder shape rather than
 * removing it - unlike Spinner, a skeleton's shape alone (not its motion)
 * carries the "content is coming" information, so this is safe to still
 * without losing meaning.
 */
export function Skeleton({ width = '100%', height = 16, radius = 'sm', circle = false, testId }: SkeletonProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();

  return (
    <div
      data-testid={testId}
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: circle ? theme.radius.full : theme.radius[radius],
        backgroundColor: theme.colors.border.subtle,
        animation: reducedMotion ? 'none' : 'ecclesia-skeleton-pulse 1.4s ease-in-out infinite',
      }}
    >
      {!reducedMotion && (
        <style>
          {'@keyframes ecclesia-skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }'}
        </style>
      )}
    </div>
  );
}
