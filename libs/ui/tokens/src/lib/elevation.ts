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

export const elevation = {
  0: { offsetX: 0, offsetY: 0, blur: 0, opacity: 0 },
  1: { offsetX: 0, offsetY: 1, blur: 3, opacity: 0.12 },
  2: { offsetX: 0, offsetY: 4, blur: 12, opacity: 0.16 },
} satisfies Record<number, ElevationStyle>;

export type ElevationLevel = keyof typeof elevation;
