"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandPalette = CommandPalette;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
/**
 * A Cmd/Ctrl+K launcher for quick navigation and actions (Design System
 * v1.0 Part 7.8's command-palette concept) - **web only**. This is a
 * disclosed platform gap, not an oversight: there is no equivalent
 * keyboard-shortcut-launcher convention on mobile (no hardware keyboard
 * to bind Cmd+K to in the common case), so `ui-native` has no
 * `CommandPalette`. Reuses the same `createPortal`-to-`document.body` +
 * `zIndex.overlay`/`zIndex.modal` strategy `Modal`/`Drawer` established,
 * but with its own keyboard model - this is a `combobox` (WAI-ARIA
 * "editable combobox with list autocomplete" pattern: a text input with
 * `role="combobox"`, `aria-expanded`, `aria-controls` pointing at a
 * `role="listbox"`, and `aria-activedescendant` tracking the highlighted
 * option) rather than `Modal`'s own Tab-trap - arrow keys move the
 * active option, Enter activates it, Escape closes.
 *
 * This component does not itself own opening on a `Cmd+K`/`Ctrl+K`
 * keypress - that global listener is an app-shell concern (needs to
 * know whether focus is already inside a text field, whether another
 * overlay is open, etc.), out of this library's scope. The caller wires
 * the keypress to `isOpen`; this component only renders the palette
 * once open.
 */
function CommandPalette({ isOpen, onClose, items, placeholder = 'Search for a page or action…', testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const [query, setQuery] = (0, react_1.useState)('');
    const [activeIndex, setActiveIndex] = (0, react_1.useState)(0);
    const inputRef = (0, react_1.useRef)(null);
    const listboxId = (0, react_1.useId)();
    const filtered = (0, react_1.useMemo)(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized)
            return items;
        return items.filter((item) => item.label.toLowerCase().includes(normalized));
    }, [items, query]);
    (0, react_1.useEffect)(() => {
        if (isOpen) {
            setQuery('');
            setActiveIndex(0);
            inputRef.current?.focus();
        }
    }, [isOpen]);
    (0, react_1.useEffect)(() => {
        setActiveIndex(0);
    }, [query]);
    if (!isOpen) {
        return null;
    }
    const select = (item) => {
        item.onSelect();
        onClose();
    };
    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            onClose();
            return;
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
            return;
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            const item = filtered[activeIndex];
            if (item) {
                select(item);
            }
        }
    };
    const activeItem = filtered[activeIndex];
    return (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)("div", { "data-testid": testId ? `${testId}-scrim` : undefined, onClick: onClose, style: {
            position: 'fixed',
            inset: 0,
            zIndex: theme.zIndex.overlay,
            backgroundColor: theme.colors.surface.overlay,
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '15vh',
        }, children: (0, jsx_runtime_1.jsxs)("div", { role: "dialog", "aria-label": "Command palette", "data-testid": testId, onClick: (event) => event.stopPropagation(), style: {
                zIndex: theme.zIndex.modal,
                width: 560,
                maxWidth: '90vw',
                maxHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colors.surface.raised,
                boxShadow: '0 20px 48px rgba(0, 0, 0, 0.24)',
                overflow: 'hidden',
            }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: theme.spacing[2], padding: theme.spacing[4], borderBottom: `1px solid ${theme.colors.border.subtle}` }, children: [(0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "search", size: "sm" }), (0, jsx_runtime_1.jsx)("input", { ref: inputRef, role: "combobox", "aria-expanded": "true", "aria-controls": listboxId, "aria-activedescendant": activeItem ? `${listboxId}-${activeItem.id}` : undefined, "aria-autocomplete": "list", value: query, onChange: (e) => setQuery(e.target.value), onKeyDown: handleKeyDown, placeholder: placeholder, style: {
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                background: 'none',
                                fontFamily: theme.fontFamily.base,
                                fontSize: theme.typography.body.fontSize,
                                color: theme.colors.text.primary,
                            } })] }), (0, jsx_runtime_1.jsx)("div", { id: listboxId, role: "listbox", "aria-label": "Results", style: { overflowY: 'auto', padding: theme.spacing[2] }, children: filtered.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { style: { padding: theme.spacing[4], textAlign: 'center', color: theme.colors.text.secondary, fontFamily: theme.fontFamily.base, fontSize: theme.typography.bodySmall.fontSize }, children: "No matches" })) : (filtered.map((item, index) => {
                        // Groups are a caller-ordering convention, not a sort this
                        // component performs (see `CommandItem.group`'s doc
                        // comment) - a heading renders whenever `group` changes
                        // from the previous *filtered* item, so filtering never
                        // leaves an orphaned heading with no items under it.
                        const previousGroup = index > 0 ? filtered[index - 1].group : undefined;
                        const showGroupHeading = item.group && item.group !== previousGroup;
                        return ((0, jsx_runtime_1.jsxs)("div", { children: [showGroupHeading && ((0, jsx_runtime_1.jsx)("div", { role: "presentation", style: {
                                        padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
                                        fontFamily: theme.fontFamily.base,
                                        fontSize: theme.typography.label.fontSize,
                                        fontWeight: theme.typography.label.fontWeight,
                                        color: theme.colors.text.secondary,
                                    }, children: item.group })), (0, jsx_runtime_1.jsxs)("div", { id: `${listboxId}-${item.id}`, role: "option", "aria-selected": index === activeIndex, onMouseEnter: () => setActiveIndex(index), onClick: () => select(item), style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: theme.spacing[2],
                                        padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
                                        borderRadius: theme.radius.sm,
                                        cursor: 'pointer',
                                        backgroundColor: index === activeIndex ? theme.colors.brand.subtle : 'transparent',
                                        fontFamily: theme.fontFamily.base,
                                        fontSize: theme.typography.body.fontSize,
                                        color: theme.colors.text.primary,
                                    }, children: [item.icon && (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: item.icon, size: "sm" }), item.label] })] }, item.id));
                    })) })] }) }), document.body);
}
//# sourceMappingURL=CommandPalette.js.map