import type { ElevationLevel, Theme } from '@ecclesia/ui-core';
/**
 * The React Native translation of `ui-tokens`' platform-neutral elevation
 * data (see `ui-web`'s `getBoxShadow` for the web equivalent - same
 * source, two native renderings). iOS uses the `shadow*` style props;
 * Android has no shadow-blur concept and instead uses the single
 * `elevation` prop, approximated here from the same blur value so a
 * given `ElevationLevel` reads as "about as elevated" on both platforms
 * even though neither implementation is a direct translation of the
 * other.
 */
export declare function getElevationStyle(theme: Theme, level: ElevationLevel): {
    elevation: number;
} | {
    elevation?: undefined;
};
//# sourceMappingURL=shadow.d.ts.map