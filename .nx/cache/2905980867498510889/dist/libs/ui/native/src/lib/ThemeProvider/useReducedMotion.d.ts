/**
 * React Native's equivalent of `ui-web`'s `prefers-reduced-motion` media
 * query - `AccessibilityInfo` has no synchronous snapshot getter (unlike
 * `matchMedia().matches`), only an async `isReduceMotionEnabled()`
 * promise, so this is a plain `useState`/`useEffect` hook rather than
 * `useSyncExternalStore` (which requires a synchronous snapshot).
 * Defaults to `false` until the async check resolves.
 */
export declare function useReducedMotion(): boolean;
//# sourceMappingURL=useReducedMotion.d.ts.map