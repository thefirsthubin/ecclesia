import type { CubicBezier } from '@ecclesia/ui-core';

/**
 * `[Product Experience Sprint II, Phase 2]` Composes `ui-tokens`'
 * platform-neutral cubic-bezier data (`motion.easing.*`) into a CSS
 * `cubic-bezier()` value - the same "shared data, one CSS translation on
 * web" pattern `getBoxShadow` already establishes for elevation. Not
 * previously needed: every existing transition (`Button`'s
 * background-color, `Card`'s hover shadow) used only a duration, relying
 * on the browser's default easing - the first component that needs a
 * *deliberate* easing curve (the Church Pulse gauge's draw-in) is what
 * closes this real, previously-unneeded gap.
 */
export function getCubicBezier(easing: CubicBezier): string {
  return `cubic-bezier(${easing.x1}, ${easing.y1}, ${easing.x2}, ${easing.y2})`;
}
