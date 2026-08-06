import { useSyncExternalStore } from 'react';
import type { ThemeMode } from '@ecclesia/ui-core';

const QUERY = '(prefers-color-scheme: dark)';

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): ThemeMode {
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
export function useSystemColorScheme(): ThemeMode {
  return useSyncExternalStore(subscribe, getSnapshot, () => 'light');
}
