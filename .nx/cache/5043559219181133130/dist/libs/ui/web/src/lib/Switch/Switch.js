"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Switch = Switch;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * An immediate-effect setting toggle (Design System v1.0 Part 7.4) -
 * deliberately distinct from `Checkbox`, which is a form-field selection
 * that only takes effect on submit. Real semantics come from
 * `role="switch"`+`aria-checked` on a native `<button>` (not a styled
 * `<input type="checkbox">` the way `Checkbox` uses - a switch's toggle
 * behavior is a button click, not a form checkbox check) - `aria-checked`
 * is what makes assistive tech announce "on"/"off" rather than
 * "checked"/"unchecked".
 */
function Switch({ label, checked, onChange, disabled = false, helperText, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const generatedId = (0, react_1.useId)();
    const helperId = `${generatedId}-helper`;
    const trackColor = checked ? theme.colors.brand.default : theme.colors.border.default;
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'inline-flex', alignItems: 'center', gap: theme.spacing[2] }, children: [(0, jsx_runtime_1.jsx)("button", { type: "button", role: "switch", "aria-checked": checked, "aria-label": label, "aria-describedby": helperText ? helperId : undefined, disabled: disabled, "data-testid": testId, onClick: () => onChange(!checked), style: {
                            position: 'relative',
                            width: 40,
                            height: 24,
                            padding: 0,
                            border: 'none',
                            borderRadius: theme.radius.full,
                            backgroundColor: trackColor,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? theme.opacity.disabled : 1,
                            transition: `background-color ${theme.motion.duration.fast}ms`,
                            flexShrink: 0,
                        }, children: (0, jsx_runtime_1.jsx)("span", { "aria-hidden": true, style: {
                                position: 'absolute',
                                top: 2,
                                left: checked ? 18 : 2,
                                width: 20,
                                height: 20,
                                borderRadius: theme.radius.full,
                                backgroundColor: theme.colors.surface.raised,
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                                transition: `left ${theme.motion.duration.fast}ms`,
                            } }) }), (0, jsx_runtime_1.jsx)("span", { style: {
                            fontFamily: theme.fontFamily.base,
                            fontSize: theme.typography.body.fontSize,
                            color: theme.colors.text.primary,
                        }, children: label })] }), helperText && ((0, jsx_runtime_1.jsx)("span", { id: helperId, style: {
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.caption.fontSize,
                    color: theme.colors.text.secondary,
                }, children: helperText }))] }));
}
//# sourceMappingURL=Switch.js.map