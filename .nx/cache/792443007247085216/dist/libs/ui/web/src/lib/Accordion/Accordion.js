"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Accordion = Accordion;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
/**
 * Expand/collapse panels (Design System v1.0 Part 7.8) - the second of
 * the two components (alongside `Tabs`) `UI_DESIGN_NOTES.md` flagged as
 * needing real shared interaction-state logic. Each header is a real
 * `<button aria-expanded aria-controls>` (never a `<div onClick>`), each
 * panel a `role="region" aria-labelledby` landmark - so a screen-reader
 * user gets "collapsed"/"expanded" announced on toggle and can navigate
 * directly to an expanded region via the landmarks list, not just by
 * reading linearly.
 */
function Accordion({ items, expandedIds, onChange, allowMultiple = false, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const idBase = (0, react_1.useId)();
    const toggle = (id) => {
        const isExpanded = expandedIds.includes(id);
        if (allowMultiple) {
            onChange(isExpanded ? expandedIds.filter((existing) => existing !== id) : [...expandedIds, id]);
        }
        else {
            onChange(isExpanded ? [] : [id]);
        }
    };
    return ((0, jsx_runtime_1.jsx)("div", { "data-testid": testId, style: { display: 'flex', flexDirection: 'column' }, children: items.map((item, index) => {
            const isExpanded = expandedIds.includes(item.id);
            const headerId = `${idBase}-header-${item.id}`;
            const panelId = `${idBase}-panel-${item.id}`;
            return ((0, jsx_runtime_1.jsxs)("div", { style: { borderBottom: index === items.length - 1 ? 'none' : `1px solid ${theme.colors.border.subtle}` }, children: [(0, jsx_runtime_1.jsx)("h3", { style: { margin: 0 }, children: (0, jsx_runtime_1.jsxs)("button", { type: "button", id: headerId, "aria-expanded": isExpanded, "aria-controls": panelId, disabled: item.disabled, onClick: () => toggle(item.id), style: {
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: `${theme.spacing[3]}px 0`,
                                border: 'none',
                                background: 'none',
                                cursor: item.disabled ? 'not-allowed' : 'pointer',
                                opacity: item.disabled ? theme.opacity.disabled : 1,
                                fontFamily: theme.fontFamily.base,
                                fontSize: theme.typography.body.fontSize,
                                fontWeight: 600,
                                color: theme.colors.text.primary,
                                textAlign: 'left',
                            }, children: [item.title, (0, jsx_runtime_1.jsx)("span", { "aria-hidden": true, style: {
                                        display: 'inline-flex',
                                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                                        transition: `transform ${theme.motion.duration.fast}ms`,
                                    }, children: (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "chevronDown", size: "sm" }) })] }) }), isExpanded && ((0, jsx_runtime_1.jsx)("div", { id: panelId, role: "region", "aria-labelledby": headerId, style: { paddingBottom: theme.spacing[3], color: theme.colors.text.primary }, children: item.content }))] }, item.id));
        }) }));
}
//# sourceMappingURL=Accordion.js.map