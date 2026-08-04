"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextArea = TextArea;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * React Native equivalent of `ui-web`'s `TextArea` - `Input`'s pattern
 * reapplied with `multiline` forced on and `textAlignVertical="top"` so
 * text starts at the top of the field like a real multi-line field rather
 * than vertically centering a single line (RN's default for multiline
 * TextInput on Android).
 */
function TextArea({ label, error, helperText, rows = 4, testId, editable = true, ...rest }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const [focused, setFocused] = (0, react_1.useState)(false);
    const borderColor = error
        ? theme.colors.status.danger.strong
        : focused
            ? theme.colors.border.focus
            : theme.colors.border.default;
    const lineHeight = theme.typography.body.lineHeight;
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { gap: theme.spacing[1] }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: {
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.label.fontSize,
                    fontWeight: '600',
                    letterSpacing: theme.typography.label.letterSpacing,
                    color: theme.colors.text.secondary,
                }, children: label }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { ...rest, multiline: true, textAlignVertical: "top", editable: editable, testID: testId, accessibilityLabel: label, accessibilityState: { disabled: !editable }, onFocus: (e) => {
                    setFocused(true);
                    rest.onFocus?.(e);
                }, onBlur: (e) => {
                    setFocused(false);
                    rest.onBlur?.(e);
                }, placeholderTextColor: theme.colors.text.disabled, style: {
                    minHeight: lineHeight * rows + theme.spacing[3],
                    paddingHorizontal: theme.spacing[3],
                    paddingVertical: theme.spacing[2],
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
//# sourceMappingURL=TextArea.js.map