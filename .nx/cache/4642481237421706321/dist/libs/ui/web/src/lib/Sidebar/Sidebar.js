"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sidebar = Sidebar;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
const Text_1 = require("../Text");
/**
 * The persistent left sidebar (Design System v1.0 §3.1: "persistent left
 * sidebar" is Web Admin's primary navigation surface, nav list per §3.1's
 * exact taxonomy). A `<nav>` landmark with `aria-label` so screen-reader
 * users can jump straight to it (STEP 8).
 */
function Sidebar({ items, linkAs: LinkAs, collapsed = false, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    return ((0, jsx_runtime_1.jsx)("nav", { "aria-label": "Primary", "data-testid": testId, style: { width: collapsed ? 72 : 240, flexShrink: 0 }, children: (0, jsx_runtime_1.jsx)("ul", { style: {
                listStyle: 'none',
                margin: 0,
                padding: theme.spacing[2],
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing[1],
            }, children: items.map((item) => ((0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsx)(LinkAs, { to: item.href, "aria-current": item.active ? 'page' : undefined, children: (0, jsx_runtime_1.jsxs)("span", { style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: theme.spacing[3],
                            padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
                            borderRadius: theme.radius.sm,
                            backgroundColor: item.active ? theme.colors.surface.raised : 'transparent',
                            color: item.active ? theme.colors.brand.default : theme.colors.text.secondary,
                        }, children: [(0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: item.icon, size: "sm", color: item.active ? theme.colors.brand.default : theme.colors.text.secondary, "aria-label": collapsed ? item.label : undefined }), !collapsed && ((0, jsx_runtime_1.jsx)(Text_1.Text, { as: "span", variant: "bodySmall", color: item.active ? theme.colors.brand.default : theme.colors.text.secondary, children: item.label }))] }) }) }, item.href))) }) }));
}
//# sourceMappingURL=Sidebar.js.map