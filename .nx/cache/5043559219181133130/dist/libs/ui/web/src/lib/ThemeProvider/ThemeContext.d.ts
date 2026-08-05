import { type Theme } from '@ecclesia/ui-core';
/**
 * Defaults to `lightTheme` (not `undefined`) so a component rendered in a
 * test or story without a wrapping `<ThemeProvider>` still gets real
 * tokens instead of a crash - `useTheme()` still warns in that case (see
 * useTheme.ts) so a missing Provider in real app code is not silently
 * invisible, but a unit test for a single component doesn't need to know
 * that.
 */
export declare const ThemeContext: import("react").Context<Theme>;
//# sourceMappingURL=ThemeContext.d.ts.map