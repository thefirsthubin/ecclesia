"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTheme = useTheme;
exports.useColorScheme = useColorScheme;
const react_1 = require("react");
const ThemeContext_1 = require("./ThemeContext");
/**
 * The primary hook every `ui-web` component uses to read tokens (Design
 * System v1.0 Part 4). Never returns `undefined` - `ThemeContext` has a
 * `lightTheme` default - so this cannot throw, but components authored
 * outside a `<ThemeProvider>` silently get light mode regardless of the
 * user's system preference, which is worth knowing during development.
 */
function useTheme() {
    return (0, react_1.useContext)(ThemeContext_1.ThemeContext);
}
/** Convenience accessor for just the active mode - Part 4's "Hooks" list names this as its own hook, not only reachable via `useTheme().mode`. */
function useColorScheme() {
    return (0, react_1.useContext)(ThemeContext_1.ThemeContext).mode;
}
//# sourceMappingURL=useTheme.js.map