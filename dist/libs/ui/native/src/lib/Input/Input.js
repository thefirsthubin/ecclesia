"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Input = Input;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * React Native equivalent of `ui-web`'s `Input`. RN's `TextInput` has no
 * native `<label>` association - the label is rendered as sibling text
 * and linked via `accessibilityLabelledBy`/`nativeID` where the platform
 * supports it, falling back to `accessibilityLabel` mirroring the visible
 * label text so screen readers always announce it regardless of RN
 * version/platform quirks in `labelledBy` support.
 */
function Input({ label, error, helperText, testId, editable = true, ...rest }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const [focused, setFocused] = (0, react_1.useState)(false);
    const borderColor = error
        ? theme.colors.status.danger.strong
        : focused
            ? theme.colors.border.focus
            : theme.colors.border.default;
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { gap: theme.spacing[1] }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: {
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.label.fontSize,
                    fontWeight: '600',
                    letterSpacing: theme.typography.label.letterSpacing,
                    color: theme.colors.text.secondary,
                }, children: label }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { ...rest, editable: editable, testID: testId, accessibilityLabel: label, accessibilityState: { disabled: !editable }, onFocus: (e) => {
                    setFocused(true);
                    rest.onFocus?.(e);
                }, onBlur: (e) => {
                    setFocused(false);
                    rest.onBlur?.(e);
                }, placeholderTextColor: theme.colors.text.disabled, style: {
                    height: theme.touchTarget.minIOS,
                    paddingHorizontal: theme.spacing[3],
                    borderRadius: theme.radius.sm,
                    borderWidth: focused ? 2 : 1,
                    borderColor,
                    backgroundColor: editable ? theme.colors.surface.raised : theme.colors.surface.default,
                    color: theme.colors.text.primary,
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.body.fontSize,
                    opacity: editable ? 1 : theme.opacity.disabled,
                } }), (error || helperText) && ((0, jsx_runtime_1.jsx)(react_native_1.Text, { accessibilityRole: error ? 'alert' : undefined, style: {
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.caption.fontSize,
                    color: error ? theme.colors.status.danger.strong : theme.colors.text.secondary,
                }, children: error ?? helperText }))] }));
}
//# sourceMappingURL=Input.js.map