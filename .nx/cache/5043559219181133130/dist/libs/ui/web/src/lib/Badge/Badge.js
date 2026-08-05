"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Badge = Badge;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * A small inline status/count/label indicator (Design System v1.0 Part
 * 7.9). Note Part 7.9's own rule: a badge is never the *sole* means of
 * conveying urgency - callers are responsible for also reflecting urgency
 * in list position/ordering (Part 4.2's priority zone), this component
 * only renders the visual chip itself.
 */
function Badge({ children, status = 'neutral', variant = 'subtle', testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const statusColors = theme.colors.status[status];
    const background = variant === 'solid' ? statusColors.strong : statusColors.background;
    const color = variant === 'solid' ? theme.colors.text.inverse : statusColors.foreground;
    return ((0, jsx_runtime_1.jsx)("span", { "data-testid": testId, style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: theme.spacing[1],
            padding: `${theme.spacing[1] / 2}px ${theme.spacing[2]}px`,
            borderRadius: theme.radius.full,
            backgroundColor: background,
            color,
            fontFamily: theme.fontFamily.base,
            fontSize: theme.typography.label.fontSize,
            fontWeight: theme.typography.label.fontWeight,
            letterSpacing: theme.typography.label.letterSpacing,
            lineHeight: `${theme.typography.label.lineHeight}px`,
        }, children: children }));
}
//# sourceMappingURL=Badge.js.map