"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadioGroup = RadioGroup;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const Radio_1 = require("./Radio");
/**
 * React Native equivalent of `ui-web`'s `RadioGroup`. RN has no
 * `<fieldset>`/`<legend>` concept - `accessibilityRole="radiogroup"` on the
 * wrapping `View` is the platform's own analogue, with the visible label
 * `Text` linked via `accessibilityLabelledBy`/`nativeID` where supported
 * and duplicated into the group's own `accessibilityLabel` as a fallback,
 * the same belt-and-suspenders approach `Input`/`TextArea` use.
 */
function RadioGroup({ label, options, value, onChange, error, helperText, direction = 'column', testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { gap: theme.spacing[2] }, testID: testId, accessibilityRole: "radiogroup", accessibilityLabel: label, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: {
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.label.fontSize,
                    fontWeight: '600',
                    letterSpacing: theme.typography.label.letterSpacing,
                    color: theme.colors.text.secondary,
                }, children: label }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: { flexDirection: direction === 'row' ? 'row' : 'column', gap: direction === 'row' ? theme.spacing[4] : theme.spacing[2] }, children: options.map((option) => ((0, jsx_runtime_1.jsx)(Radio_1.Radio, { label: option.label, checked: value === option.value, disabled: option.disabled, onPress: () => onChange(option.value) }, option.value))) }), (error || helperText) && ((0, jsx_runtime_1.jsx)(react_native_1.Text, { accessibilityRole: error ? 'alert' : undefined, style: {
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.caption.fontSize,
                    color: error ? theme.colors.status.danger.strong : theme.colors.text.secondary,
                }, children: error ?? helperText }))] }));
}
//# sourceMappingURL=RadioGroup.js.map