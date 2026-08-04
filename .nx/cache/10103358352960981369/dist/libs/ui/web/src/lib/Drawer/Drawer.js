"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Drawer = Drawer;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * A side panel for supplementary content or filters that doesn't need a
 * centered `Modal`'s full-attention framing (Design System v1.0 Part 7.8
 * names Drawer alongside Modal/Toast/Tooltip as needing the same
 * portal/overlay strategy - this is that strategy reapplied, not
 * re-solved: same `createPortal`-to-`document.body`, same
 * `zIndex.overlay`/`zIndex.modal` tokens, same minimal dependency-free
 * focus trap and focus-return-on-close behavior as `Modal.tsx` - see that
 * file's doc comment for the full rationale, not repeated here). The one
 * real difference is layout: full-height, edge-anchored, slides in rather
 * than fading in centered.
 */
function Drawer({ isOpen, onClose, title, children, side = 'right', dismissible = true, footer, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const panelRef = (0, react_1.useRef)(null);
    const previouslyFocusedElement = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!isOpen) {
            return;
        }
        previouslyFocusedElement.current = document.activeElement;
        panelRef.current?.focus();
        return () => {
            previouslyFocusedElement.current?.focus?.();
        };
    }, [isOpen]);
    if (!isOpen) {
        return null;
    }
    const getFocusableElements = () => {
        if (!panelRef.current) {
            return [];
        }
        return Array.from(panelRef.current.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    };
    const handleKeyDown = (event) => {
        if (event.key === 'Escape' && dismissible) {
            event.stopPropagation();
            onClose();
            return;
        }
        if (event.key !== 'Tab') {
            return;
        }
        const focusable = getFocusableElements();
        if (focusable.length === 0) {
            event.preventDefault();
            return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        }
        else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };
    return (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)("div", { "data-testid": testId ? `${testId}-scrim` : undefined, onClick: dismissible ? onClose : undefined, style: {
            position: 'fixed',
            inset: 0,
            zIndex: theme.zIndex.overlay,
            backgroundColor: theme.colors.surface.overlay,
            display: 'flex',
            justifyContent: side === 'right' ? 'flex-end' : 'flex-start',
        }, children: (0, jsx_runtime_1.jsxs)("div", { ref: panelRef, role: "dialog", "aria-modal": "true", "aria-labelledby": testId ? `${testId}-title` : undefined, tabIndex: -1, "data-testid": testId, onClick: (event) => event.stopPropagation(), onKeyDown: handleKeyDown, style: {
                zIndex: theme.zIndex.modal,
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing[4],
                width: 400,
                maxWidth: '100%',
                height: '100%',
                overflowY: 'auto',
                padding: theme.spacing[5],
                backgroundColor: theme.colors.surface.raised,
                boxShadow: side === 'right' ? '-8px 0 24px rgba(0, 0, 0, 0.16)' : '8px 0 24px rgba(0, 0, 0, 0.16)',
            }, children: [(0, jsx_runtime_1.jsx)("h2", { id: testId ? `${testId}-title` : undefined, style: {
                        margin: 0,
                        fontFamily: theme.fontFamily.base,
                        fontSize: theme.typography.heading3.fontSize,
                        fontWeight: theme.typography.heading3.fontWeight,
                        color: theme.colors.text.primary,
                    }, children: title }), (0, jsx_runtime_1.jsx)("div", { style: { flex: 1, color: theme.colors.text.primary }, children: children }), footer && (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: theme.spacing[2] }, children: footer })] }) }), document.body);
}
//# sourceMappingURL=Drawer.js.map