import { type ReactNode } from 'react';
import { type ThemeMode } from '@ecclesia/ui-core';
export interface ThemeProviderProps {
    children: ReactNode;
    /**
     * Forces a specific mode instead of following the OS preference - the
     * manual override Design System v1.0 Part 5.11 allows alongside the
     * system-driven default. Leave unset to follow `prefers-color-scheme`.
     */
    colorScheme?: ThemeMode;
}
/**
 * The root theme context provider (Design System v1.0 Part 4). Every
 * `apps/web-admin` screen renders under exactly one of these, mounted
 * once near the application root - see `apps/web-admin/src/app/app.tsx`
 * for the acceptance-criteria wiring this foundation sprint adds.
 */
export declare function ThemeProvider({ children, colorScheme }: ThemeProviderProps): import("react").JSX.Element;
//# sourceMappingURL=ThemeProvider.d.ts.map