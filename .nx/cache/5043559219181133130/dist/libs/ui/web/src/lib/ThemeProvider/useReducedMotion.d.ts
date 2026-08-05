/**
 * Design System v1.0 Part 1.5/Part 6.7 (`motion.reduceMotion`): when the
 * OS-level "reduce motion" setting is on, every `ui-web` component that
 * animates collapses its transition to near-zero duration instead of
 * skipping the state change entirely - callers multiply `motion.duration.*`
 * by 0 (or a small constant) when this is `true`, they never branch on it
 * to omit the transition object altogether, so the same style-computation
 * code path runs either way.
 */
export declare function useReducedMotion(): boolean;
//# sourceMappingURL=useReducedMotion.d.ts.map