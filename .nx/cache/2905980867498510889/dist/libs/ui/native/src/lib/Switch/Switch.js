"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Switch = Switch;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * React Native equivalent of `ui-web`'s `Switch`, built on RN's own
 * `Switch` primitive (the same "use the platform's real control rather
 * than reimplement it" choice `Modal` made for its portal/overlay) -
 * `Switch` is one of the few form controls RN ships natively with correct
 * platform-conventional visuals and built-in `accessibilityRole="switch"`
 * behavior on both iOS and Android.
 */
function Switch({ label, checked, onChange, disabled = false, helperText, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { gap: theme.spacing[1] }, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Switch, { value: checked, onValueChange: onChange, disabled: disabled, testID: testId, accessibilityLabel: label, trackColor: { false: theme.colors.border.default, true: theme.colors.brand.default }, thumbColor: theme.colors.surface.raised }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }, children: label })] }), helperText && ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: theme.colors.text.secondary }, children: helperText }))] }));
}
//# sourceMappingURL=Switch.js.map