import type { ThemeMode } from '@ecclesia/ui-core';
/**
 * Reads the OS-level color-scheme preference (Design System v1.0 Part
 * 5.11: light mode is the default, dark mode is opt-in/system-driven, not
 * the reverse). `ThemeProvider` uses this internally to resolve a theme
 * when no explicit `colorScheme` prop overrides it; exported separately
 * so a future "Settings" screen could read the raw system preference
 * without needing the full theme object.
 */
export declare function useSystemColorScheme(): ThemeMode;
//# sourceMappingURL=useSystemColorScheme.d.ts.map