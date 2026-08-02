import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * React Native's equivalent of `ui-web`'s `prefers-reduced-motion` media
 * query - `AccessibilityInfo` has no synchronous snapshot getter (unlike
 * `matchMedia().matches`), only an async `isReduceMotionEnabled()`
 * promise, so this is a plain `useState`/`useEffect` hook rather than
 * `useSyncExternalStore` (which requires a synchronous snapshot).
 * Defaults to `false` until the async check resolves.
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Wrapped in `Promise.resolve` because `isReduceMotionEnabled()` is
    // only a real Promise on a real device/simulator - under Jest's own
    // React Native mock (no native module backing it), it returns
    // `undefined` synchronously instead of rejecting, and calling
    // `.then` directly on that throws. `Promise.resolve(undefined)`
    // still resolves to the same safe `false` fallback either way.
    Promise.resolve(AccessibilityInfo.isReduceMotionEnabled())
      .then((enabled) => {
        if (!cancelled) setReducedMotion(Boolean(enabled));
      })
      .catch(() => {
        // No-op: if the platform can't report reduce-motion state, fall back
        // to the `false` default rather than surfacing an unhandled rejection.
      });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}
