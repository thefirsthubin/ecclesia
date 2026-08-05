"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Select = Select;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
/**
 * Labeled dropdown selection from a closed set of options (Design System
 * v1.0 Part 7.4) - `Input`'s established pattern reapplied
 * (`UI_DESIGN_NOTES.md`'s own plan for this component). Renders a real
 * `<select>` (never a custom listbox built from `<div>`s) so native
 * keyboard navigation, type-ahead, and mobile-native picker UI all come
 * from the platform; the chevron icon on top is decorative
 * (`pointerEvents: none`), the real interactive surface is the `<select>`
 * itself, styled to match `Input`'s visual language via `appearance: none`.
 */
function Select({ label, options, placeholder, error, helperText, testId, id, disabled, ...rest }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const generatedId = (0, react_1.useId)();
    const fieldId = id ?? generatedId;
    const helperId = `${fieldId}-helper`;
    const [focused, setFocused] = (0, react_1.useState)(false);
    const borderColor = error
        ? theme.colors.status.danger.strong
        : focused
            ? theme.colors.border.focus
            : theme.colors.border.default;
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }, children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: fieldId, style: {
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.label.fontSize,
                    fontWeight: theme.typography.label.fontWeight,
                    letterSpacing: theme.typography.label.letterSpacing,
                    color: theme.colors.text.secondary,
                }, children: label }), (0, jsx_runtime_1.jsxs)("div", { style: { position: 'relative' }, children: [(0, jsx_runtime_1.jsxs)("select", { ...rest, id: fieldId, disabled: disabled, "aria-invalid": Boolean(error) || undefined, "aria-describedby": error || helperText ? helperId : undefined, "data-testid": testId, onFocus: (e) => {
                            setFocused(true);
                            rest.onFocus?.(e);
                        }, onBlur: (e) => {
                            setFocused(false);
                            rest.onBlur?.(e);
                        }, style: {
                            width: '100%',
                            height: theme.touchTarget.minWeb,
                            padding: `0 ${theme.spacing[8]}px 0 ${theme.spacing[3]}px`,
                            borderRadius: theme.radius.sm,
                            border: `1px solid ${borderColor}`,
                            outline: focused ? `2px solid ${theme.colors.border.focus}` : 'none',
                            outlineOffset: 1,
                            backgroundColor: disabled ? theme.colors.surface.default : theme.colors.surface.raised,
                            color: theme.colors.text.primary,
                            fontFamily: theme.fontFamily.base,
                            fontSize: theme.typography.body.fontSize,
                            opacity: disabled ? theme.opacity.disabled : 1,
                            appearance: 'none',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                        }, children: [placeholder && ((0, jsx_runtime_1.jsx)("option", { value: "", disabled: true, hidden: rest.value !== undefined && rest.value !== '', children: placeholder })), options.map((option) => ((0, jsx_runtime_1.jsx)("option", { value: option.value, disabled: option.disabled, children: option.label }, option.value)))] }), (0, jsx_runtime_1.jsx)("span", { "aria-hidden": true, style: {
                            position: 'absolute',
                            right: theme.spacing[3],
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                        }, children: (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "chevronDown", size: "sm" }) })] }), (error || helperText) && ((0, jsx_runtime_1.jsx)("span", { id: helperId, role: error ? 'alert' : undefined, style: {
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.caption.fontSize,
                    color: error ? theme.colors.status.danger.strong : theme.colors.text.secondary,
                }, children: error ?? helperText }))] }));
}
//# sourceMappingURL=Select.js.map