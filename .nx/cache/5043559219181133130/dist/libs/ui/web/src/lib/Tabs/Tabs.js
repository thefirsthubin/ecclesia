"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tabs = Tabs;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * Switches between mutually-exclusive content panels (Design System v1.0
 * Part 7.8) - one of the two base components (alongside `Accordion`) that
 * needs real shared interaction-state logic beyond every prior component
 * in this library (`UI_DESIGN_NOTES.md`'s own framing). Only the active
 * panel's content is rendered (not all panels hidden via CSS) - simpler,
 * and matches this codebase's existing preference for controlled,
 * single-source-of-truth state over DOM-visibility toggling.
 *
 * Implements the WAI-ARIA "automatic activation" tabs pattern:
 * `role="tablist"`/`"tab"`/`"tabpanel"`, roving `tabIndex` (only the
 * active tab is in the natural Tab order; `ArrowLeft`/`ArrowRight` move
 * *and activate* between tabs, `Home`/`End` jump to the first/last
 * enabled tab) - not the "manual activation" variant (arrow moves focus,
 * Enter/Space activates), which is the other WAI-ARIA-sanctioned pattern
 * but a heavier interaction model this component doesn't need for the
 * closed, always-visible tab sets this codebase uses it for.
 */
function Tabs({ tabs, activeTabId, onChange, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const idBase = (0, react_1.useId)();
    const tabRefs = (0, react_1.useRef)(new Map());
    const enabledTabs = tabs.filter((tab) => !tab.disabled);
    const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
    const focusAndSelect = (id) => {
        onChange(id);
        tabRefs.current.get(id)?.focus();
    };
    const handleKeyDown = (event) => {
        const currentIndex = enabledTabs.findIndex((tab) => tab.id === activeTabId);
        if (currentIndex === -1) {
            return;
        }
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            focusAndSelect(enabledTabs[(currentIndex + 1) % enabledTabs.length].id);
        }
        else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            focusAndSelect(enabledTabs[(currentIndex - 1 + enabledTabs.length) % enabledTabs.length].id);
        }
        else if (event.key === 'Home') {
            event.preventDefault();
            focusAndSelect(enabledTabs[0].id);
        }
        else if (event.key === 'End') {
            event.preventDefault();
            focusAndSelect(enabledTabs[enabledTabs.length - 1].id);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { "data-testid": testId, children: [(0, jsx_runtime_1.jsx)("div", { role: "tablist", onKeyDown: handleKeyDown, style: { display: 'flex', gap: theme.spacing[1], borderBottom: `1px solid ${theme.colors.border.subtle}` }, children: tabs.map((tab) => {
                    const isActive = tab.id === activeTabId;
                    return ((0, jsx_runtime_1.jsx)("button", { ref: (el) => {
                            if (el) {
                                tabRefs.current.set(tab.id, el);
                            }
                        }, type: "button", role: "tab", id: `${idBase}-tab-${tab.id}`, "aria-selected": isActive, "aria-controls": `${idBase}-panel-${tab.id}`, disabled: tab.disabled, tabIndex: isActive ? 0 : -1, onClick: () => onChange(tab.id), style: {
                            padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
                            border: 'none',
                            borderBottom: `2px solid ${isActive ? theme.colors.brand.default : 'transparent'}`,
                            background: 'none',
                            cursor: tab.disabled ? 'not-allowed' : 'pointer',
                            opacity: tab.disabled ? theme.opacity.disabled : 1,
                            fontFamily: theme.fontFamily.base,
                            fontSize: theme.typography.body.fontSize,
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? theme.colors.text.primary : theme.colors.text.secondary,
                        }, children: tab.label }, tab.id));
                }) }), activeTab && ((0, jsx_runtime_1.jsx)("div", { role: "tabpanel", id: `${idBase}-panel-${activeTab.id}`, "aria-labelledby": `${idBase}-tab-${activeTab.id}`, tabIndex: 0, style: { paddingTop: theme.spacing[4] }, children: activeTab.content }))] }));
}
//# sourceMappingURL=Tabs.js.map