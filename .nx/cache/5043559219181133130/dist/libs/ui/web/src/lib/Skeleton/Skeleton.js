"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Skeleton = Skeleton;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeProvider_1 = require("../ThemeProvider");
const ThemeProvider_2 = require("../ThemeProvider");
/**
 * A structural loading placeholder (Design System v1.0 Part 7.19 -
 * "matching the eventual content's layout"). The pulse animation is
 * disabled under `useReducedMotion` (Part 6.7's `motion.reduceMotion`),
 * leaving a static, still-informative placeholder shape rather than
 * removing it - unlike Spinner, a skeleton's shape alone (not its motion)
 * carries the "content is coming" information, so this is safe to still
 * without losing meaning.
 */
function Skeleton({ width = '100%', height = 16, radius = 'sm', circle = false, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const reducedMotion = (0, ThemeProvider_2.useReducedMotion)();
    return ((0, jsx_runtime_1.jsx)("div", { "data-testid": testId, "aria-hidden": "true", style: {
            width,
            height,
            borderRadius: circle ? theme.radius.full : theme.radius[radius],
            backgroundColor: theme.colors.border.subtle,
            animation: reducedMotion ? 'none' : 'ecclesia-skeleton-pulse 1.4s ease-in-out infinite',
        }, children: !reducedMotion && ((0, jsx_runtime_1.jsx)("style", { children: '@keyframes ecclesia-skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }' })) }));
}
//# sourceMappingURL=Skeleton.js.map