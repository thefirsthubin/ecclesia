"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSystemColorScheme = useSystemColorScheme;
const react_1 = require("react");
const QUERY = '(prefers-color-scheme: dark)';
function subscribe(callback) {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => undefined;
    }
    const mql = window.matchMedia(QUERY);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
}
function getSnapshot() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return 'light';
    }
    return window.matchMedia(QUERY).matches ? 'dark' : 'light';
}
/**
 * Reads the OS-level color-scheme preference (Design System v1.0 Part
 * 5.11: light mode is the default, dark mode is opt-in/system-driven, not
 * the reverse). `ThemeProvider` uses this internally to resolve a theme
 * when no explicit `colorScheme` prop overrides it; exported separately
 * so a future "Settings" screen could read the raw system preference
 * without needing the full theme object.
 */
function useSystemColorScheme() {
    return (0, react_1.useSyncExternalStore)(subscribe, getSnapshot, () => 'light');
}
//# sourceMappingURL=useSystemColorScheme.js.map