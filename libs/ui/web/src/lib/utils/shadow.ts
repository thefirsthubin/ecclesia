import type { ElevationLevel, Theme } from '@ecclesia/ui-core';

/**
 * Composes `ui-tokens`' platform-neutral elevation data (Design System
 * v1.0 Part 5.6/6.6) into a CSS `box-shadow` value. The equivalent
 * translation for React Native (the shadow/elevation style props) lives in
 * `libs/ui/native` - same source data, two native renderings, per this
 * package's whole reason for existing (`UI_DESIGN_NOTES.md`).
 */
export function getBoxShadow(theme: Theme, level: ElevationLevel): string {
  const e = theme.elevation[level];
  if (e.opacity === 0) return 'none';
  return `${e.offsetX}px ${e.offsetY}px ${e.blur}px rgba(0, 0, 0, ${e.opacity})`;
}
