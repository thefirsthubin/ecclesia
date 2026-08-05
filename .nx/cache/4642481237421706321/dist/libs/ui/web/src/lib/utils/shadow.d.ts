import type { ElevationLevel, Theme } from '@ecclesia/ui-core';
/**
 * Composes `ui-tokens`' platform-neutral elevation data (Design System
 * v1.0 Part 5.6/6.6) into a CSS `box-shadow` value. The equivalent
 * translation for React Native (the shadow/elevation style props) lives in
 * `libs/ui/native` - same source data, two native renderings, per this
 * package's whole reason for existing (`UI_DESIGN_NOTES.md`).
 */
export declare function getBoxShadow(theme: Theme, level: ElevationLevel): string;
//# sourceMappingURL=shadow.d.ts.map