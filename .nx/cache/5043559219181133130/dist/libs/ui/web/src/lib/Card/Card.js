"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = Card;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ThemeProvider_1 = require("../ThemeProvider");
const utils_1 = require("../utils");
/**
 * Groups related content (Design System v1.0 Part 7.2). `interactive`
 * cards are rendered as a real `<button>`-semantics element (`role`,
 * `tabIndex`, Enter/Space activation) rather than a `<div>` with a click
 * handler, so assistive technology announces them correctly (Part 7.2's
 * own accessibility note).
 */
function Card({ children, padding = 4, elevation = 1, interactive = false, onClick, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const [hovered, setHovered] = (0, react_1.useState)(false);
    const hoverElevation = elevation === 2 ? 2 : (elevation + 1);
    const boxShadow = (0, utils_1.getBoxShadow)(theme, interactive && hovered ? hoverElevation : elevation);
    const handleKeyDown = (event) => {
        if (!interactive || !onClick)
            return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
        }
    };
    return ((0, jsx_runtime_1.jsx)("div", { role: interactive ? 'button' : undefined, tabIndex: interactive ? 0 : undefined, onClick: interactive ? onClick : undefined, onKeyDown: handleKeyDown, onMouseEnter: () => interactive && setHovered(true), onMouseLeave: () => setHovered(false), "data-testid": testId, style: {
            padding: theme.spacing[padding],
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface.raised,
            border: `1px solid ${theme.colors.border.subtle}`,
            boxShadow,
            cursor: interactive ? 'pointer' : 'default',
            transition: `box-shadow ${theme.motion.duration.fast}ms`,
        }, children: children }));
}
//# sourceMappingURL=Card.js.map