"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Heading = Heading;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeProvider_1 = require("../ThemeProvider");
function Heading({ children, level, as, color, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const styleKey = level === 'display' ? 'display' : `heading${level}`;
    const style = theme.typography[styleKey];
    const Component = as ?? (level === 'display' ? 'h1' : `h${level}`);
    const cssStyle = {
        margin: 0,
        fontFamily: theme.fontFamily.base,
        fontSize: style.fontSize,
        lineHeight: `${style.lineHeight}px`,
        fontWeight: style.fontWeight,
        letterSpacing: style.letterSpacing,
        color: color ?? theme.colors.text.primary,
    };
    return ((0, jsx_runtime_1.jsx)(Component, { style: cssStyle, "data-testid": testId, children: children }));
}
//# sourceMappingURL=Heading.js.map