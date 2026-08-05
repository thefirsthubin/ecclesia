"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spinner = Spinner;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeProvider_1 = require("../ThemeProvider");
const DIAMETER = { sm: 16, md: 24, lg: 32 };
/**
 * A determinate-duration rotation is deliberately NOT gated behind
 * `useReducedMotion` here: WCAG 2.1's reduced-motion guidance (2.3.3)
 * targets non-essential motion, and a loading spinner's rotation is the
 * one piece of information it exists to convey ("this is still working"),
 * not decoration - removing it would remove functionality, not just
 * flourish. Every other animated component in this package (Skeleton,
 * transitions) does respect `useReducedMotion`.
 */
function Spinner({ size = 'md', color, label = 'Loading' }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const diameter = DIAMETER[size];
    const trackColor = theme.colors.border.subtle;
    const activeColor = color ?? theme.colors.brand.default;
    return ((0, jsx_runtime_1.jsx)("span", { role: "status", "aria-label": label, style: {
            display: 'inline-block',
            width: diameter,
            height: diameter,
            border: `${Math.max(2, diameter / 8)}px solid ${trackColor}`,
            borderTopColor: activeColor,
            borderRadius: theme.radius.full,
            animation: 'ecclesia-spinner-rotate 0.8s linear infinite',
        }, children: (0, jsx_runtime_1.jsx)("style", { children: '@keyframes ecclesia-spinner-rotate { to { transform: rotate(360deg); } }' }) }));
}
//# sourceMappingURL=Spinner.js.map