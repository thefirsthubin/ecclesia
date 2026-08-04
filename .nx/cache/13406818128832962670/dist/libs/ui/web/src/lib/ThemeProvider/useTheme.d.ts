import type { Theme } from '@ecclesia/ui-core';
/**
 * The primary hook every `ui-web` component uses to read tokens (Design
 * System v1.0 Part 4). Never returns `undefined` - `ThemeContext` has a
 * `lightTheme` default - so this cannot throw, but components authored
 * outside a `<ThemeProvider>` silently get light mode regardless of the
 * user's system preference, which is worth knowing during development.
 */
export declare function useTheme(): Theme;
/** Convenience accessor for just the active mode - Part 4's "Hooks" list names this as its own hook, not only reachable via `useTheme().mode`. */
export declare function useColorScheme(): Theme['mode'];
//# sourceMappingURL=useTheme.d.ts.map