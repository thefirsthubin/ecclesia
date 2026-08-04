"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Select = Select;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
const Modal_1 = require("../Modal");
/**
 * React Native equivalent of `ui-web`'s `Select`. RN has no native
 * `<select>` element, so this composes two components already in this
 * library rather than inventing a new overlay strategy: a `Pressable`
 * trigger styled to match `Input`, and this library's own `Modal`
 * (`variant="dialog"`) presenting the option list - `Modal` already proved
 * out the portal/focus-trap/dismissal behavior this needs, so `Select`
 * reuses it instead of re-solving the same problem.
 */
function Select({ label, options, value, onChange, placeholder, error, helperText, disabled = false, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const [open, setOpen] = (0, react_1.useState)(false);
    const selected = options.find((option) => option.value === value);
    const borderColor = error ? theme.colors.status.danger.strong : theme.colors.border.default;
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { gap: theme.spacing[1] }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: {
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.label.fontSize,
                    fontWeight: '600',
                    letterSpacing: theme.typography.label.letterSpacing,
                    color: theme.colors.text.secondary,
                }, children: label }), (0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { onPress: () => !disabled && setOpen(true), disabled: disabled, testID: testId, accessibilityRole: "button", accessibilityLabel: label, accessibilityValue: { text: selected?.label ?? placeholder }, accessibilityState: { disabled }, style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: theme.touchTarget.minIOS,
                    paddingHorizontal: theme.spacing[3],
                    borderRadius: theme.radius.sm,
                    borderWidth: 1,
                    borderColor,
                    backgroundColor: disabled ? theme.colors.surface.default : theme.colors.surface.raised,
                    opacity: disabled ? theme.opacity.disabled : 1,
                }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: {
                            fontFamily: theme.fontFamily.base,
                            fontSize: theme.typography.body.fontSize,
                            color: selected ? theme.colors.text.primary : theme.colors.text.disabled,
                        }, children: selected?.label ?? placeholder ?? ' ' }), (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "chevronDown", size: "sm" })] }), (error || helperText) && ((0, jsx_runtime_1.jsx)(react_native_1.Text, { accessibilityRole: error ? 'alert' : undefined, style: {
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.caption.fontSize,
                    color: error ? theme.colors.status.danger.strong : theme.colors.text.secondary,
                }, children: error ?? helperText })), (0, jsx_runtime_1.jsx)(Modal_1.Modal, { isOpen: open, onClose: () => setOpen(false), title: label, variant: "dialog", testId: testId ? `${testId}-modal` : undefined, children: (0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { style: { maxHeight: 320 }, children: options.map((option) => {
                        const isSelected = option.value === value;
                        return ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { disabled: option.disabled, onPress: () => {
                                onChange(option.value);
                                setOpen(false);
                            }, accessibilityRole: "menuitem", accessibilityState: { selected: isSelected, disabled: option.disabled }, style: {
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                minHeight: theme.touchTarget.minIOS,
                                paddingHorizontal: theme.spacing[2],
                                opacity: option.disabled ? theme.opacity.disabled : 1,
                            }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }, children: option.label }), isSelected && (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "check", size: "sm", color: theme.colors.brand.default })] }, option.value));
                    }) }) })] }));
}
//# sourceMappingURL=Select.js.map