"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadioGroup = RadioGroup;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ThemeProvider_1 = require("../ThemeProvider");
const Radio_1 = require("./Radio");
/**
 * A mutually-exclusive single-select from a small, fully-visible set
 * (Design System v1.0 Part 7.4) - the same "follow `Input`'s established
 * pattern" plan `UI_DESIGN_NOTES.md` set out for this component: label +
 * error/helper text, token-driven styling. `<fieldset>`/`<legend>` (not a
 * `<div>` + visually-styled heading) is what gives every `Radio` inside it
 * a correctly-announced group context for free.
 */
function RadioGroup({ label, name, options, value, onChange, error, helperText, direction = 'column', testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const generatedId = (0, react_1.useId)();
    const helperId = `${generatedId}-helper`;
    return ((0, jsx_runtime_1.jsxs)("fieldset", { style: { border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }, "aria-describedby": error || helperText ? helperId : undefined, "aria-invalid": Boolean(error) || undefined, "data-testid": testId, children: [(0, jsx_runtime_1.jsx)("legend", { style: {
                    padding: 0,
                    marginBottom: theme.spacing[1],
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.label.fontSize,
                    fontWeight: theme.typography.label.fontWeight,
                    letterSpacing: theme.typography.label.letterSpacing,
                    color: theme.colors.text.secondary,
                }, children: label }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', flexDirection: direction, gap: direction === 'row' ? theme.spacing[4] : theme.spacing[2] }, children: options.map((option) => ((0, jsx_runtime_1.jsx)(Radio_1.Radio, { name: name, label: option.label, checked: value === option.value, disabled: option.disabled, onChange: () => onChange(option.value) }, option.value))) }), (error || helperText) && ((0, jsx_runtime_1.jsx)("span", { id: helperId, role: error ? 'alert' : undefined, style: {
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.caption.fontSize,
                    color: error ? theme.colors.status.danger.strong : theme.colors.text.secondary,
                }, children: error ?? helperText }))] }));
}
//# sourceMappingURL=RadioGroup.js.map