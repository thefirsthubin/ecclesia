import { useSyncExternalStore } from 'react';
import { useTheme } from './useTheme';
import type { BreakpointToken } from '@ecclesia/ui-core';

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

/**
 * Resolves the current viewport to the largest breakpoint it satisfies
 * (Design System v1.0 Part 6.11 / Part 4's "Responsive utilities"). Web
 * Admin only in practice - Part 6.11 is explicit that Mobile does not use
 * these breakpoints - but the hook itself lives here in `ui-web`, not
 * gated behind a platform check, since only `apps/web-admin` will ever
 * import from `ui-web` in the first place (module-boundary enforced).
 */
export function useBreakpoint(): BreakpointToken {
  const { breakpoints } = useTheme();

  const getSnapshot = (): BreakpointToken => {
    if (typeof window === 'undefined') return 'lg';
    const width = window.innerWidth;
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    return 'sm';
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => 'lg');
}

/**
 * Resolves a per-breakpoint value map to whichever entry matches the
 * current breakpoint, falling back to the next-smallest defined entry
 * (a "mobile-first" resolution order) - the `useResponsiveValue` utility
 * Part 4 calls for.
 */
export function useResponsiveValue<T>(values: Partial<Record<BreakpointToken, T>>): T | undefined {
  const current = useBreakpoint();
  const order: BreakpointToken[] = ['sm', 'md', 'lg', 'xl'];
  const currentIndex = order.indexOf(current);
  for (let i = currentIndex; i >= 0; i -= 1) {
    const candidate = values[order[i]];
    if (candidate !== undefined) return candidate;
  }
  return undefined;
}
