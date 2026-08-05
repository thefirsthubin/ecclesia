"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Checkbox = Checkbox;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
/**
 * A binary form selection (Design System v1.0 Part 7.4) - distinct from
 * `Switch`, which is an immediate-effect setting toggle, not a form field
 * (Part 7.4's own distinction, reused here rather than re-litigated).
 * Renders a real `<input type="checkbox">` (never a styled `<div>`) so
 * native keyboard activation (Space), checked-state announcement, and
 * label association all come from the platform for free - the box
 * artwork on top is purely decorative (`aria-hidden`), the real input is
 * visually hidden but still in the accessibility tree and tab order.
 */
function Checkbox({ label, error, helperText, indeterminate = false, testId, id, disabled, checked, ...rest }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const generatedId = (0, react_1.useId)();
    const fieldId = id ?? generatedId;
    const helperId = `${fieldId}-helper`;
    const inputRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (inputRef.current) {
            inputRef.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);
    const boxBackground = checked || indeterminate ? theme.colors.brand.default : 'transparent';
    const boxBorder = error
        ? theme.colors.status.danger.strong
        : checked || indeterminate
            ? theme.colors.brand.default
            : theme.colors.border.default;
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }, children: [(0, jsx_runtime_1.jsxs)("label", { htmlFor: fieldId, style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: theme.spacing[2],
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? theme.opacity.disabled : 1,
                }, children: [(0, jsx_runtime_1.jsxs)("span", { style: { position: 'relative', display: 'inline-flex', width: 20, height: 20 }, children: [(0, jsx_runtime_1.jsx)("input", { ...rest, ref: inputRef, type: "checkbox", id: fieldId, checked: checked, disabled: disabled, "aria-invalid": Boolean(error) || undefined, "aria-describedby": error || helperText ? helperId : undefined, "data-testid": testId, style: {
                                    position: 'absolute',
                                    inset: 0,
                                    width: 20,
                                    height: 20,
                                    margin: 0,
                                    opacity: 0,
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                } }), (0, jsx_runtime_1.jsx)("span", { "aria-hidden": true, style: {
                                    width: 20,
                                    height: 20,
                                    borderRadius: theme.radius.sm,
                                    border: `1.5px solid ${boxBorder}`,
                                    backgroundColor: boxBackground,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pointerEvents: 'none',
                                }, children: indeterminate ? ((0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "minus", size: "sm", color: theme.colors.text.inverse })) : checked ? ((0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "check", size: "sm", color: theme.colors.text.inverse })) : null })] }), (0, jsx_runtime_1.jsx)("span", { style: {
                            fontFamily: theme.fontFamily.base,
                            fontSize: theme.typography.body.fontSize,
                            color: theme.colors.text.primary,
                        }, children: label })] }), (error || helperText) && ((0, jsx_runtime_1.jsx)("span", { id: helperId, role: error ? 'alert' : undefined, style: {
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.caption.fontSize,
                    color: error ? theme.colors.status.danger.strong : theme.colors.text.secondary,
                }, children: error ?? helperText }))] }));
}
//# sourceMappingURL=Checkbox.js.map