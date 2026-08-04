"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextArea = TextArea;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * Multi-line text entry (Design System v1.0 Part 7.4's "TextArea" field
 * type). Deliberately `Input`'s own pattern reapplied, not a new
 * accessibility design: real `<label htmlFor>`, `aria-describedby` +
 * `role="alert"` on error - see `Input.tsx` for the full rationale, not
 * repeated here.
 */
function TextArea({ label, error, helperText, rows = 4, testId, id, disabled, ...rest }) {
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
                }, children: label }), (0, jsx_runtime_1.jsx)("textarea", { ...rest, id: fieldId, rows: rows, disabled: disabled, "aria-invalid": Boolean(error) || undefined, "aria-describedby": error || helperText ? helperId : undefined, "data-testid": testId, onFocus: (e) => {
                    setFocused(true);
                    rest.onFocus?.(e);
                }, onBlur: (e) => {
                    setFocused(false);
                    rest.onBlur?.(e);
                }, style: {
                    padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
                    borderRadius: theme.radius.sm,
                    border: `1px solid ${borderColor}`,
                    outline: focused ? `2px solid ${theme.colors.border.focus}` : 'none',
                    outlineOffset: 1,
                    backgroundColor: disabled ? theme.colors.surface.default : theme.colors.surface.raised,
                    color: theme.colors.text.primary,
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.body.fontSize,
                    opacity: disabled ? theme.opacity.disabled : 1,
                    resize: 'vertical',
                } }), (error || helperText) && ((0, jsx_runtime_1.jsx)("span", { id: helperId, role: error ? 'alert' : undefined, style: {
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.caption.fontSize,
                    color: error ? theme.colors.status.danger.strong : theme.colors.text.secondary,
                }, children: error ?? helperText }))] }));
}
//# sourceMappingURL=TextArea.js.map