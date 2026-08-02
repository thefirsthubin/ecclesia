"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.darkTheme = exports.lightTheme = void 0;
exports.buildTheme = buildTheme;
const ui_tokens_1 = require("@ecclesia/ui-tokens");
/**
 * Pure function, no platform dependency (Part 4's Theme Provider on each
 * platform is a thin React-context wrapper around this - see
 * `ui-web`/`ui-native`'s own `ThemeProvider`). Kept here, not duplicated
 * per platform, so "light mode is a resolved token map" and "dark mode is
 * the same map built from `darkPalette` instead" (Part 5.11) is
 * demonstrably one code path, not two independently-maintained ones.
 */
function buildTheme(mode) {
    return {
        mode,
        colors: mode === 'dark' ? ui_tokens_1.darkPalette : ui_tokens_1.lightPalette,
        typography: ui_tokens_1.typography,
        fontFamily: ui_tokens_1.fontFamily,
        spacing: ui_tokens_1.spacing,
        radius: ui_tokens_1.radius,
        elevation: ui_tokens_1.elevation,
        breakpoints: ui_tokens_1.breakpoints,
        motion: ui_tokens_1.motion,
        zIndex: ui_tokens_1.zIndex,
        opacity: ui_tokens_1.opacity,
        touchTarget: ui_tokens_1.touchTarget,
        iconSize: ui_tokens_1.iconSize,
        avatarSize: ui_tokens_1.avatarSize,
    };
}
exports.lightTheme = buildTheme('light');
exports.darkTheme = buildTheme('dark');
//# sourceMappingURL=theme.js.map