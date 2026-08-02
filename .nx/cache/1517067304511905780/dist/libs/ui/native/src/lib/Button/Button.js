"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = Button;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
const Spinner_1 = require("../Spinner");
const Text_1 = require("../Text");
const SIZE_HEIGHT = { sm: 36, md: 44, lg: 52 };
const SIZE_PADDING_X = { sm: 12, md: 16, lg: 20 };
/**
 * React Native equivalent of `ui-web`'s `Button` - same variant/size/
 * loading/icon API, `Pressable` instead of `<button>`. Height defaults
 * are RN's own touch-target floor (44pt iOS / 48dp Android,
 * `theme.touchTarget.minIOS`/`minAndroid` - Design System v1.0 Part 1.5),
 * not `ui-web`'s 40px default, since mobile is a stricter accessibility
 * floor by platform convention.
 */
function Button({ children, variant = 'primary', size = 'md', loading = false, disabled = false, iconLeft, iconRight, accessibilityLabel, onPress, testId, }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const isDisabled = disabled || loading;
    const palette = {
        primary: { background: theme.colors.brand.default, backgroundPressed: theme.colors.brand.active, text: theme.colors.text.inverse, border: 'transparent' },
        secondary: { background: 'transparent', backgroundPressed: theme.colors.border.subtle, text: theme.colors.text.primary, border: theme.colors.border.default },
        tertiary: { background: 'transparent', backgroundPressed: theme.colors.border.subtle, text: theme.colors.brand.default, border: 'transparent' },
        danger: { background: theme.colors.status.danger.strong, backgroundPressed: theme.colors.status.danger.strong, text: theme.colors.text.inverse, border: 'transparent' },
    }[variant];
    return ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: onPress, disabled: isDisabled, testID: testId, accessibilityRole: "button", accessibilityLabel: accessibilityLabel, accessibilityState: { disabled: isDisabled, busy: loading }, hitSlop: 8, style: ({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing[2],
            height: Math.max(SIZE_HEIGHT[size], theme.touchTarget.minIOS),
            minWidth: theme.touchTarget.minIOS,
            paddingHorizontal: SIZE_PADDING_X[size],
            borderRadius: theme.radius.sm,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: pressed && !isDisabled ? palette.backgroundPressed : palette.background,
            opacity: disabled && !loading ? theme.opacity.disabled : 1,
        }), children: loading ? ((0, jsx_runtime_1.jsx)(Spinner_1.Spinner, { size: "sm", color: palette.text })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [iconLeft && (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: iconLeft, size: "sm", color: palette.text }), children && ((0, jsx_runtime_1.jsx)(Text_1.Text, { variant: "body", color: palette.text, children: children })), iconRight && (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: iconRight, size: "sm", color: palette.text })] })) }));
}
//# sourceMappingURL=Button.js.map