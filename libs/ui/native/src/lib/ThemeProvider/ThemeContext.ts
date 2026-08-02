import { createContext } from 'react';
import { lightTheme, type Theme } from '@ecclesia/ui-core';

/** See `ui-web`'s identical `ThemeContext.ts` for why the default is `lightTheme`, not `undefined`. */
export const ThemeContext = createContext<Theme>(lightTheme);
