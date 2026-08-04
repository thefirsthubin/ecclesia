"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBreakpoint = useBreakpoint;
const react_native_1 = require("react-native");
const useTheme_1 = require("./useTheme");
/**
 * Design System v1.0 Part 6.11 is explicit that Mobile does not use the
 * Web Admin breakpoint scale for its primary layout decisions (Mobile is
 * single-column, fluid). This hook exists anyway - RN's
 * `useWindowDimensions` is the natural building block for the "tablet-
 * aware React Native layout" possibility `ui-tokens/breakpoints.ts`
 * already names as a plausible, cheap-to-support future case, so the
 * hook is here and ready rather than needing to be invented later.
 */
function useBreakpoint() {
    const { width } = (0, react_native_1.useWindowDimensions)();
    const { breakpoints } = (0, useTheme_1.useTheme)();
    if (width >= breakpoints.xl)
        return 'xl';
    if (width >= breakpoints.lg)
        return 'lg';
    if (width >= breakpoints.md)
        return 'md';
    return 'sm';
}
//# sourceMappingURL=useBreakpoint.js.map