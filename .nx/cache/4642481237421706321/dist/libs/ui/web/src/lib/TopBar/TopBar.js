"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopBar = TopBar;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
/**
 * Web Admin's top navigation bar (Design System §3.1's "Top Navigation" +
 * "Page Header" + "Responsive Collapse"). A `<header>` landmark.
 */
function TopBar({ left, right, onToggleSidebar, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    return ((0, jsx_runtime_1.jsxs)("header", { "data-testid": testId, style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.spacing[4],
            padding: `${theme.spacing[3]}px ${theme.spacing[4]}px`,
            borderBottom: `1px solid ${theme.colors.border.subtle}`,
            backgroundColor: theme.colors.surface.raised,
        }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: theme.spacing[3] }, children: [onToggleSidebar && ((0, jsx_runtime_1.jsx)("button", { type: "button", "aria-label": "Toggle navigation menu", onClick: onToggleSidebar, style: { background: 'none', border: 'none', cursor: 'pointer', padding: theme.spacing[2] }, children: (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "menu", size: "md" }) })), left] }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', alignItems: 'center', gap: theme.spacing[3] }, children: right })] }));
}
//# sourceMappingURL=TopBar.js.map