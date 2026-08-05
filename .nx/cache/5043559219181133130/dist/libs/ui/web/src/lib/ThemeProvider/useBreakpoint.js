"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBreakpoint = useBreakpoint;
exports.useResponsiveValue = useResponsiveValue;
const react_1 = require("react");
const useTheme_1 = require("./useTheme");
function subscribe(callback) {
    if (typeof window === 'undefined')
        return () => undefined;
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
function useBreakpoint() {
    const { breakpoints } = (0, useTheme_1.useTheme)();
    const getSnapshot = () => {
        if (typeof window === 'undefined')
            return 'lg';
        const width = window.innerWidth;
        if (width >= breakpoints.xl)
            return 'xl';
        if (width >= breakpoints.lg)
            return 'lg';
        if (width >= breakpoints.md)
            return 'md';
        return 'sm';
    };
    return (0, react_1.useSyncExternalStore)(subscribe, getSnapshot, () => 'lg');
}
/**
 * Resolves a per-breakpoint value map to whichever entry matches the
 * current breakpoint, falling back to the next-smallest defined entry
 * (a "mobile-first" resolution order) - the `useResponsiveValue` utility
 * Part 4 calls for.
 */
function useResponsiveValue(values) {
    const current = useBreakpoint();
    const order = ['sm', 'md', 'lg', 'xl'];
    const currentIndex = order.indexOf(current);
    for (let i = currentIndex; i >= 0; i -= 1) {
        const candidate = values[order[i]];
        if (candidate !== undefined)
            return candidate;
    }
    return undefined;
}
//# sourceMappingURL=useBreakpoint.js.map