/**
 * Elevation tokens (Design System v1.0 Part 5.6, Part 6.6) - three levels
 * only, by design ("enough to express Ecclesia's flat, calm hierarchy
 * without sliding into skeuomorphic depth").
 *
 * Stored as platform-neutral shadow data rather than a pre-built CSS
 * `box-shadow` string or RN `shadow*`/`elevation` prop set, so each
 * platform lib can render it its own native way: web composes a
 * `box-shadow` string from this; native maps it to `shadowColor` /
 * `shadowOffset` / `shadowOpacity` / `shadowRadius` (iOS) and `elevation`
 * (Android, approximated from the same blur value).
 */
export interface ElevationStyle {
    offsetX: number;
    offsetY: number;
    blur: number;
    /** 0-1, applied to a black shadow color - both platform layers resolve the actual color. */
    opacity: number;
}
export declare const elevation: {
    0: {
        offsetX: number;
        offsetY: number;
        blur: number;
        opacity: number;
    };
    1: {
        offsetX: number;
        offsetY: number;
        blur: number;
        opacity: number;
    };
    2: {
        offsetX: number;
        offsetY: number;
        blur: number;
        opacity: number;
    };
};
export type ElevationLevel = keyof typeof elevation;
//# sourceMappingURL=elevation.d.ts.map