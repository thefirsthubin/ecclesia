"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = Button;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
const Spinner_1 = require("../Spinner");
const SIZE_HEIGHT = { sm: 32, md: 40, lg: 48 };
const SIZE_PADDING_X = { sm: 12, md: 16, lg: 20 };
/**
 * The primary action trigger (Design System v1.0 Part 7.1). Exactly one
 * `variant="primary"` per screen is a *usage* rule for consumers, not
 * something this component can enforce structurally - documented in
 * `../../../UI_DESIGN_NOTES.md`.
 */
function Button({ children, variant = 'primary', size = 'md', loading = false, disabled = false, iconLeft, iconRight, accessibilityLabel, testId, onClick, type = 'button', ...rest }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const [interactionState, setInteractionState] = (0, react_1.useState)('idle');
    const isDisabled = disabled || loading;
    const palette = {
        primary: {
            background: theme.colors.brand.default,
            backgroundHover: theme.colors.brand.hover,
            backgroundActive: theme.colors.brand.active,
            text: theme.colors.text.inverse,
            border: 'transparent',
        },
        secondary: {
            background: 'transparent',
            backgroundHover: theme.colors.surface.raised,
            backgroundActive: theme.colors.border.subtle,
            text: theme.colors.text.primary,
            border: theme.colors.border.default,
        },
        tertiary: {
            background: 'transparent',
            backgroundHover: theme.colors.surface.raised,
            backgroundActive: theme.colors.border.subtle,
            text: theme.colors.brand.default,
            border: 'transparent',
        },
        danger: {
            background: theme.colors.status.danger.strong,
            backgroundHover: theme.colors.status.danger.strong,
            backgroundActive: theme.colors.status.danger.strong,
            text: theme.colors.text.inverse,
            border: 'transparent',
        },
    }[variant];
    const background = interactionState === 'active' && !isDisabled
        ? palette.backgroundActive
        : interactionState === 'hover' && !isDisabled
            ? palette.backgroundHover
            : palette.background;
    return ((0, jsx_runtime_1.jsx)("button", { ...rest, type: type, disabled: isDisabled, onClick: onClick, onMouseEnter: () => setInteractionState('hover'), onMouseLeave: () => setInteractionState('idle'), onMouseDown: () => setInteractionState('active'), onMouseUp: () => setInteractionState('hover'), onFocus: () => setInteractionState((s) => (s === 'idle' ? 'focus' : s)), onBlur: () => setInteractionState('idle'), "aria-label": accessibilityLabel, "aria-busy": loading || undefined, "data-testid": testId, style: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing[2],
            height: SIZE_HEIGHT[size],
            minWidth: theme.touchTarget.minWeb,
            padding: `0 ${SIZE_PADDING_X[size]}px`,
            borderRadius: theme.radius.sm,
            border: `1px solid ${palette.border}`,
            background,
            color: palette.text,
            fontFamily: theme.fontFamily.base,
            fontSize: theme.typography.body.fontSize,
            fontWeight: 600,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: disabled && !loading ? theme.opacity.disabled : 1,
            outline: interactionState === 'focus' ? `2px solid ${theme.colors.border.focus}` : 'none',
            outlineOffset: 2,
            transition: `background-color ${theme.motion.duration.fast}ms`,
        }, children: loading ? ((0, jsx_runtime_1.jsx)(Spinner_1.Spinner, { size: "sm", color: palette.text })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [iconLeft && (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: iconLeft, size: "sm", color: palette.text }), children, iconRight && (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: iconRight, size: "sm", color: palette.text })] })) }));
}
//# sourceMappingURL=Button.js.map