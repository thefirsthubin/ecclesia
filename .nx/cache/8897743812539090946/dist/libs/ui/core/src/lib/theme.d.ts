import { typography, spacing, radius, elevation, breakpoints, motion, zIndex, opacity, touchTarget, iconSize, avatarSize, fontFamily, type SemanticColorTokens } from '@ecclesia/ui-tokens';
export type ThemeMode = 'light' | 'dark';
/**
 * The fully-resolved theme object every `ui-web`/`ui-native` component
 * consumes via `useTheme()` (Design System v1.0 Part 4 - "Theme Provider,
 * Light theme, Dark theme, Context, Hooks"). `colors` is the only
 * mode-dependent slice; every other token category is already
 * mode-independent data straight from `ui-tokens`.
 */
export interface Theme {
    mode: ThemeMode;
    colors: SemanticColorTokens;
    typography: typeof typography;
    fontFamily: typeof fontFamily;
    spacing: typeof spacing;
    radius: typeof radius;
    elevation: typeof elevation;
    breakpoints: typeof breakpoints;
    motion: typeof motion;
    zIndex: typeof zIndex;
    opacity: typeof opacity;
    touchTarget: typeof touchTarget;
    iconSize: typeof iconSize;
    avatarSize: typeof avatarSize;
}
/**
 * Pure function, no platform dependency (Part 4's Theme Provider on each
 * platform is a thin React-context wrapper around this - see
 * `ui-web`/`ui-native`'s own `ThemeProvider`). Kept here, not duplicated
 * per platform, so "light mode is a resolved token map" and "dark mode is
 * the same map built from `darkPalette` instead" (Part 5.11) is
 * demonstrably one code path, not two independently-maintained ones.
 */
export declare function buildTheme(mode: ThemeMode): Theme;
export declare const lightTheme: Theme;
export declare const darkTheme: Theme;
//# sourceMappingURL=theme.d.ts.map