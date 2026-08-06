import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

/**
 * Design System v1.0 Part 1.5/Part 6.7 (`motion.reduceMotion`): when the
 * OS-level "reduce motion" setting is on, every `ui-web` component that
 * animates collapses its transition to near-zero duration instead of
 * skipping the state change entirely - callers multiply `motion.duration.*`
 * by 0 (or a small constant) when this is `true`, they never branch on it
 * to omit the transition object altogether, so the same style-computation
 * code path runs either way.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
