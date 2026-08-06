import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';
import type { ThemeMode } from '@ecclesia/ui-core';

function subscribe(callback: () => void): () => void {
  const subscription = Appearance.addChangeListener(callback);
  return () => subscription.remove();
}

function getSnapshot(): ThemeMode {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

/**
 * React Native's equivalent of `ui-web`'s `matchMedia`-based hook - same
 * role (Design System v1.0 Part 5.11), platform-native API
 * (`Appearance`, not a media query).
 */
export function useSystemColorScheme(): ThemeMode {
  return useSyncExternalStore(subscribe, getSnapshot, () => 'light');
}
