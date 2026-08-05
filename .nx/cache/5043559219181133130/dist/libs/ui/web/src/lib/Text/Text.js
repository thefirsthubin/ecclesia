"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Text = Text;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * The base text primitive every other component's copy renders through
 * (Design System v1.0 Part 7). Never hard-codes a font size/weight
 * outside the `typography` token table (Part 6.12 - "no component may
 * use a raw, non-token value").
 */
function Text({ children, variant = 'body', color, as: Component = 'p', testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const style = theme.typography[variant];
    const cssStyle = {
        margin: 0,
        fontFamily: theme.fontFamily.base,
        fontSize: style.fontSize,
        lineHeight: `${style.lineHeight}px`,
        fontWeight: style.fontWeight,
        letterSpacing: style.letterSpacing,
        color: color ?? theme.colors.text.primary,
        fontVariantNumeric: style.tabularNumbers ? 'tabular-nums' : undefined,
    };
    return ((0, jsx_runtime_1.jsx)(Component, { style: cssStyle, "data-testid": testId, children: children }));
}
//# sourceMappingURL=Text.js.map