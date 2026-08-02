"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = Card;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const utils_1 = require("../utils");
/** React Native equivalent of `ui-web`'s `Card` - `Pressable` when `interactive`, a plain `View` otherwise. */
function Card({ children, padding = 4, elevation = 1, interactive = false, onPress, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const baseStyle = {
        padding: theme.spacing[padding],
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface.raised,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        ...(0, utils_1.getElevationStyle)(theme, elevation),
    };
    if (!interactive) {
        return ((0, jsx_runtime_1.jsx)(react_native_1.View, { testID: testId, style: baseStyle, children: children }));
    }
    return ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { testID: testId, onPress: onPress, accessibilityRole: "button", style: ({ pressed }) => [baseStyle, pressed ? { opacity: 0.85 } : null], children: children }));
}
//# sourceMappingURL=Card.js.map