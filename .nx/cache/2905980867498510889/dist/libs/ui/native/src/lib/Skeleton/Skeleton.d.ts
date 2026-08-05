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
export declare function Skeleton({ width, height, radius, circle, testId }: SkeletonProps): import("react").JSX.Element;
//# sourceMappingURL=Skeleton.d.ts.map