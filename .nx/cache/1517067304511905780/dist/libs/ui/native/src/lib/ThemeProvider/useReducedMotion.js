"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useReducedMotion = useReducedMotion;
const react_1 = require("react");
const react_native_1 = require("react-native");
/**
 * React Native's equivalent of `ui-web`'s `prefers-reduced-motion` media
 * query - `AccessibilityInfo` has no synchronous snapshot getter (unlike
 * `matchMedia().matches`), only an async `isReduceMotionEnabled()`
 * promise, so this is a plain `useState`/`useEffect` hook rather than
 * `useSyncExternalStore` (which requires a synchronous snapshot).
 * Defaults to `false` until the async check resolves.
 */
function useReducedMotion() {
    const [reducedMotion, setReducedMotion] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        let cancelled = false;
        react_native_1.AccessibilityInfo.isReduceMotionEnabled()
            .then((enabled) => {
            if (!cancelled)
                setReducedMotion(enabled);
        })
            .catch(() => {
            // No-op: if the platform can't report reduce-motion state, fall back
            // to the `false` default rather than surfacing an unhandled rejection.
        });
        const subscription = react_native_1.AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
        return () => {
            cancelled = true;
            subscription.remove();
        };
    }, []);
    return reducedMotion;
}
//# sourceMappingURL=useReducedMotion.js.map