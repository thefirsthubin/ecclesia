"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Breadcrumbs = Breadcrumbs;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
const Text_1 = require("../Text");
/**
 * Design System v1.0 §3.1: nav depth is capped at 3 (Domain → Surface →
 * Record detail) - breadcrumbs make that depth visible and give a
 * one-click way back up it. The final item (current page) is not a link
 * (`aria-current="page"` on plain text), matching standard breadcrumb a11y
 * pattern.
 */
function Breadcrumbs({ items, linkAs: LinkAs, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    return ((0, jsx_runtime_1.jsx)("nav", { "aria-label": "Breadcrumb", "data-testid": testId, children: (0, jsx_runtime_1.jsx)("ol", { style: { listStyle: 'none', display: 'flex', alignItems: 'center', margin: 0, padding: 0, gap: theme.spacing[1] }, children: items.map((item, index) => {
                const isLast = index === items.length - 1;
                return ((0, jsx_runtime_1.jsxs)("li", { style: { display: 'flex', alignItems: 'center', gap: theme.spacing[1] }, children: [index > 0 && (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "chevronRight", size: "sm" }), item.href && !isLast ? ((0, jsx_runtime_1.jsx)(LinkAs, { to: item.href, children: (0, jsx_runtime_1.jsx)(Text_1.Text, { as: "span", variant: "bodySmall", color: theme.colors.text.secondary, children: item.label }) })) : ((0, jsx_runtime_1.jsx)(Text_1.Text, { as: "span", variant: "bodySmall", color: theme.colors.text.primary, children: (0, jsx_runtime_1.jsx)("span", { "aria-current": isLast ? 'page' : undefined, children: item.label }) }))] }, `${item.label}-${index}`));
            }) }) }));
}
//# sourceMappingURL=Breadcrumbs.js.map