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
export declare const motion: {
    readonly duration: {
        readonly fast: 120;
        readonly standard: 220;
        readonly slow: 350;
    };
    readonly easing: {
        readonly standard: {
            x1: number;
            y1: number;
            x2: number;
            y2: number;
        };
        readonly emphasized: {
            x1: number;
            y1: number;
            x2: number;
            y2: number;
        };
    };
};
export type MotionDuration = keyof typeof motion.duration;
export type MotionEasing = keyof typeof motion.easing;
//# sourceMappingURL=motion.d.ts.map