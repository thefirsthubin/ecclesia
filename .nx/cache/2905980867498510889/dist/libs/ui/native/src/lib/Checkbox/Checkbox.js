"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Checkbox = Checkbox;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
/**
 * React Native equivalent of `ui-web`'s `Checkbox`. No native RN checkbox
 * primitive exists, so this is a `Pressable` box + `Icon` rendered
 * conditionally, with `accessibilityRole="checkbox"` and
 * `accessibilityState.checked` (`true`/`false`/`'mixed'`) carrying the real
 * semantics for VoiceOver/TalkBack - the same "the artwork is decorative,
 * the accessibility props carry the meaning" split as web.
 */
function Checkbox({ label, checked, onChange, error, helperText, indeterminate = false, disabled = false, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const boxBackground = checked || indeterminate ? theme.colors.brand.default : 'transparent';
    const boxBorder = error
        ? theme.colors.status.danger.strong
        : checked || indeterminate
            ? theme.colors.brand.default
            : theme.colors.border.default;
    const handlePress = (_event) => {
        if (disabled) {
            return;
        }
        onChange(!checked);
    };
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { gap: theme.spacing[1] }, children: [(0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { onPress: handlePress, disabled: disabled, testID: testId, accessibilityRole: "checkbox", accessibilityLabel: label, accessibilityState: { checked: indeterminate ? 'mixed' : checked, disabled }, hitSlop: 8, style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing[2],
                    opacity: disabled ? theme.opacity.disabled : 1,
                    minHeight: theme.touchTarget.minIOS,
                }, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: {
                            width: 20,
                            height: 20,
                            borderRadius: theme.radius.sm,
                            borderWidth: 1.5,
                            borderColor: boxBorder,
                            backgroundColor: boxBackground,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }, children: indeterminate ? ((0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "minus", size: "sm", color: theme.colors.text.inverse })) : checked ? ((0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "check", size: "sm", color: theme.colors.text.inverse })) : null }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: {
                            fontFamily: theme.fontFamily.base,
                            fontSize: theme.typography.body.fontSize,
                            color: theme.colors.text.primary,
                        }, children: label })] }), (error || helperText) && ((0, jsx_runtime_1.jsx)(react_native_1.Text, { accessibilityRole: error ? 'alert' : undefined, style: {
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.caption.fontSize,
                    color: error ? theme.colors.status.danger.strong : theme.colors.text.secondary,
                }, children: error ?? helperText }))] }));
}
//# sourceMappingURL=Checkbox.js.map