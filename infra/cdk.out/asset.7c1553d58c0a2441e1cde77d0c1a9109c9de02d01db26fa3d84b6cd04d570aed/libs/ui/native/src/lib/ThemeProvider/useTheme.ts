import { useContext } from 'react';
import type { Theme } from '@ecclesia/ui-core';
import { ThemeContext } from './ThemeContext';

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function useColorScheme(): Theme['mode'] {
  return useContext(ThemeContext).mode;
}
