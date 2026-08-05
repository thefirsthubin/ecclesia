"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Heading = Heading;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
function toRNFontWeight(weight) {
    return String(weight);
}
/**
 * React Native equivalent of `ui-web`'s `Heading`. React Native has no
 * native `<h1>`-`<h6>` semantic hierarchy - the closest accessibility
 * equivalent is `accessibilityRole="header"` on every heading regardless
 * of level (RN/iOS/Android screen readers do not expose a numeric heading
 * level the way HTML does), so document-order is what conveys hierarchy
 * on this platform, not a level-specific role.
 */
function Heading({ children, level, color, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const styleKey = level === 'display' ? 'display' : `heading${level}`;
    const style = theme.typography[styleKey];
    return ((0, jsx_runtime_1.jsx)(react_native_1.Text, { testID: testId, accessibilityRole: "header", style: {
            fontFamily: theme.fontFamily.base,
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            fontWeight: toRNFontWeight(style.fontWeight),
            letterSpacing: style.letterSpacing,
            color: color ?? theme.colors.text.primary,
        }, children: children }));
}
//# sourceMappingURL=Heading.js.map