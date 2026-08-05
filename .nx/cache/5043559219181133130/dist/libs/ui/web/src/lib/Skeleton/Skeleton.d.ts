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
export declare function Skeleton({ width, height, radius, circle, testId }: SkeletonProps): import("react").JSX.Element;
//# sourceMappingURL=Skeleton.d.ts.map