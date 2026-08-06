import { useContext } from 'react';
import type { Theme } from '@ecclesia/ui-core';
import { ThemeContext } from './ThemeContext';

/**
 * The primary hook every `ui-web` component uses to read tokens (Design
 * System v1.0 Part 4). Never returns `undefined` - `ThemeContext` has a
 * `lightTheme` default - so this cannot throw, but components authored
 * outside a `<ThemeProvider>` silently get light mode regardless of the
 * user's system preference, which is worth knowing during development.
 */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/** Convenience accessor for just the active mode - Part 4's "Hooks" list names this as its own hook, not only reachable via `useTheme().mode`. */
export function useColorScheme(): Theme['mode'] {
  return useContext(ThemeContext).mode;
}
