"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Badge = Badge;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const Text_1 = require("../Text");
/** React Native equivalent of `ui-web`'s `Badge` - identical token usage, `View`+`Text` instead of a styled `<span>`. */
function Badge({ children, status = 'neutral', variant = 'subtle', testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const statusColors = theme.colors.status[status];
    const background = variant === 'solid' ? statusColors.strong : statusColors.background;
    const color = variant === 'solid' ? theme.colors.text.inverse : statusColors.foreground;
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { testID: testId, style: {
            alignSelf: 'flex-start',
            paddingHorizontal: theme.spacing[2],
            paddingVertical: theme.spacing[1] / 2,
            borderRadius: theme.radius.full,
            backgroundColor: background,
        }, children: (0, jsx_runtime_1.jsx)(Text_1.Text, { variant: "label", color: color, children: children }) }));
}
//# sourceMappingURL=Badge.js.map