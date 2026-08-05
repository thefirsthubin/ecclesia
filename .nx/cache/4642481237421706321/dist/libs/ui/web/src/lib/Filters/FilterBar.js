"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterBar = FilterBar;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
/**
 * The active-filter chip row above a filtered list/table (Design System
 * v1.0 Part 7.8's Filters concept). Each chip is a labelled, removable
 * pill; "Clear all" only renders once there's something to clear. This
 * is deliberately a thin display component, not a filter-builder -
 * building filter *values* (date ranges, multi-selects, etc.) is business
 * logic per screen, this only renders the resulting chips.
 */
function FilterBar({ filters, onRemove, onClearAll, children, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    if (filters.length === 0 && !children) {
        return null;
    }
    return ((0, jsx_runtime_1.jsxs)("div", { "data-testid": testId, style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing[2] }, children: [filters.map((filter) => ((0, jsx_runtime_1.jsxs)("span", { style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: theme.spacing[1],
                    padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
                    borderRadius: theme.radius.full,
                    border: `1px solid ${theme.colors.border.default}`,
                    backgroundColor: theme.colors.surface.raised,
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.bodySmall.fontSize,
                    color: theme.colors.text.primary,
                }, children: [filter.label, (0, jsx_runtime_1.jsx)("button", { type: "button", "aria-label": `Remove filter: ${filter.label}`, onClick: () => onRemove(filter.id), style: { display: 'inline-flex', border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: theme.colors.text.secondary }, children: (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "close", size: "sm" }) })] }, filter.id))), filters.length > 0 && onClearAll && ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: onClearAll, style: {
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.bodySmall.fontSize,
                    fontWeight: 600,
                    color: theme.colors.brand.default,
                }, children: "Clear all" })), children] }));
}
//# sourceMappingURL=FilterBar.js.map