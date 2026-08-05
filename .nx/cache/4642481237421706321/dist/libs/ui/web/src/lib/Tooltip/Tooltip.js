"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tooltip = Tooltip;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ThemeProvider_1 = require("../ThemeProvider");
const PLACEMENT_STYLE = {
    top: { bottom: '100%', left: '50%', transform: 'translate(-50%, -8px)' },
    bottom: { top: '100%', left: '50%', transform: 'translate(-50%, 8px)' },
    left: { right: '100%', top: '50%', transform: 'translate(-8px, -50%)' },
    right: { left: '100%', top: '50%', transform: 'translate(8px, -50%)' },
};
/**
 * A brief, supplementary hover/focus label (Design System v1.0 Part 7.8) -
 * never the *only* place a piece of information lives (that rule is a
 * caller discipline concern, same as `Button`'s "one primary per screen"
 * or `Modal`'s "never stack a second modal" - not something this
 * component enforces structurally). Shown on `mouseenter`/`focus`, hidden
 * on `mouseleave`/`blur`/`Escape` - both a mouse *and* keyboard user can
 * trigger it, which is the accessibility bar a hover-only implementation
 * would fail.
 */
function Tooltip({ content, children, placement = 'top', testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const [visible, setVisible] = (0, react_1.useState)(false);
    const tooltipId = (0, react_1.useId)();
    const child = children;
    const show = () => setVisible(true);
    const hide = () => setVisible(false);
    const trigger = (0, react_1.cloneElement)(child, {
        'aria-describedby': visible ? tooltipId : undefined,
        onMouseEnter: (event) => {
            show();
            child.props.onMouseEnter?.(event);
        },
        onMouseLeave: (event) => {
            hide();
            child.props.onMouseLeave?.(event);
        },
        onFocus: (event) => {
            show();
            child.props.onFocus?.(event);
        },
        onBlur: (event) => {
            hide();
            child.props.onBlur?.(event);
        },
        onKeyDown: (event) => {
            if (event.key === 'Escape') {
                hide();
            }
            child.props.onKeyDown?.(event);
        },
    });
    return ((0, jsx_runtime_1.jsxs)("span", { style: { position: 'relative', display: 'inline-flex' }, children: [trigger, visible && ((0, jsx_runtime_1.jsx)("span", { id: tooltipId, role: "tooltip", "data-testid": testId, style: {
                    position: 'absolute',
                    zIndex: theme.zIndex.overlay,
                    whiteSpace: 'nowrap',
                    padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.colors.text.primary,
                    color: theme.colors.surface.raised,
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.caption.fontSize,
                    pointerEvents: 'none',
                    ...PLACEMENT_STYLE[placement],
                }, children: content }))] }));
}
//# sourceMappingURL=Tooltip.js.map