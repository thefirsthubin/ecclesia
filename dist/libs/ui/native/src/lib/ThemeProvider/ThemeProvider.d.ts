import { type ReactNode } from 'react';
import { type ThemeMode } from '@ecclesia/ui-core';
export interface ThemeProviderProps {
    children: ReactNode;
    colorScheme?: ThemeMode;
}
/**
 * The root theme context provider for `apps/mobile` (Design System v1.0
 * Part 4) - mirrors `ui-web`'s `ThemeProvider` exactly (same props, same
 * `buildTheme()` call), differing only in which platform API resolves the
 * system color-scheme preference.
 */
export declare function ThemeProvider({ children, colorScheme }: ThemeProviderProps): import("react").JSX.Element;
//# sourceMappingURL=ThemeProvider.d.ts.map