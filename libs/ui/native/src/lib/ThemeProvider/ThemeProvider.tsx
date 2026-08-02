import { useMemo, type ReactNode } from 'react';
import { buildTheme, type ThemeMode } from '@ecclesia/ui-core';
import { ThemeContext } from './ThemeContext';
import { useSystemColorScheme } from './useSystemColorScheme';

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
export function ThemeProvider({ children, colorScheme }: ThemeProviderProps) {
  const systemScheme = useSystemColorScheme();
  const mode = colorScheme ?? systemScheme;
  const theme = useMemo(() => buildTheme(mode), [mode]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
