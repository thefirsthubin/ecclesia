import { useWindowDimensions } from 'react-native';
import { useTheme } from './useTheme';
import type { BreakpointToken } from '@ecclesia/ui-core';

/**
 * Design System v1.0 Part 6.11 is explicit that Mobile does not use the
 * Web Admin breakpoint scale for its primary layout decisions (Mobile is
 * single-column, fluid). This hook exists anyway - RN's
 * `useWindowDimensions` is the natural building block for the "tablet-
 * aware React Native layout" possibility `ui-tokens/breakpoints.ts`
 * already names as a plausible, cheap-to-support future case, so the
 * hook is here and ready rather than needing to be invented later.
 */
export function useBreakpoint(): BreakpointToken {
  const { width } = useWindowDimensions();
  const { breakpoints } = useTheme();

  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  return 'sm';
}
