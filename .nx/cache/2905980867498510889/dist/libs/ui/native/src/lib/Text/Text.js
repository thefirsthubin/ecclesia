"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Text = Text;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
/** Converts `ui-tokens`' numeric `FontWeight` (400/500/600/700) into the string literal RN's `TextStyle.fontWeight` expects. */
function toRNFontWeight(weight) {
    return String(weight);
}
/** React Native equivalent of `ui-web`'s `Text` - same token-driven rule, RN's `<Text>` primitive instead of `<p>`/`<span>`. */
function Text({ children, variant = 'body', color, testId, ...rest }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const style = theme.typography[variant];
    return ((0, jsx_runtime_1.jsx)(react_native_1.Text, { ...rest, testID: testId, style: {
            fontFamily: theme.fontFamily.base,
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            fontWeight: toRNFontWeight(style.fontWeight),
            letterSpacing: style.letterSpacing,
            color: color ?? theme.colors.text.primary,
            fontVariant: style.tabularNumbers ? ['tabular-nums'] : undefined,
        }, children: children }));
}
//# sourceMappingURL=Text.js.map