"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = Table;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
const Checkbox_1 = require("../Checkbox");
const EmptyState_1 = require("../EmptyState");
const Skeleton_1 = require("../Skeleton");
/**
 * Tabular data display (Design System v1.0 Part 7 Navigation/Data tier) -
 * a real `<table>` (never a `<div>` grid), so a screen reader announces
 * row/column position and header association for free, and sortable
 * columns use `aria-sort` on the `<th>` rather than a decoration-only icon.
 * Composes existing components rather than reinventing them: `EmptyState`
 * for the no-rows case, `Skeleton` rows for loading, `Checkbox` for
 * optional row selection (with an indeterminate "select all" in the
 * header) - the same "don't re-solve a solved problem" discipline `Select`/
 * `Drawer` followed by reusing `Modal`.
 */
function Table({ columns, data, getRowId, sortKey, sortDirection = 'asc', onSortChange, onRowClick, selectedIds, onSelectionChange, loading = false, emptyTitle = 'No records', emptyDescription, emptyIcon, testId, }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const selectable = Boolean(selectedIds && onSelectionChange);
    const allIds = data.map(getRowId);
    const allSelected = selectable && allIds.length > 0 && allIds.every((id) => selectedIds?.has(id));
    const someSelected = selectable && allIds.some((id) => selectedIds?.has(id)) && !allSelected;
    const toggleAll = () => {
        if (!onSelectionChange)
            return;
        onSelectionChange(allSelected ? new Set() : new Set(allIds));
    };
    const toggleRow = (id) => {
        if (!onSelectionChange || !selectedIds)
            return;
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        }
        else {
            next.add(id);
        }
        onSelectionChange(next);
    };
    const thStyle = (align) => ({
        textAlign: align ?? 'left',
        padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
        fontFamily: theme.fontFamily.base,
        fontSize: theme.typography.label.fontSize,
        fontWeight: theme.typography.label.fontWeight,
        color: theme.colors.text.secondary,
        borderBottom: `1px solid ${theme.colors.border.default}`,
        whiteSpace: 'nowrap',
    });
    const tdStyle = (align) => ({
        textAlign: align ?? 'left',
        padding: `${theme.spacing[3]}px`,
        fontFamily: theme.fontFamily.base,
        fontSize: theme.typography.body.fontSize,
        color: theme.colors.text.primary,
        borderBottom: `1px solid ${theme.colors.border.subtle}`,
    });
    if (!loading && data.length === 0) {
        return (0, jsx_runtime_1.jsx)(EmptyState_1.EmptyState, { icon: emptyIcon, title: emptyTitle, description: emptyDescription, testId: testId ? `${testId}-empty` : undefined });
    }
    return ((0, jsx_runtime_1.jsxs)("table", { "data-testid": testId, style: { width: '100%', borderCollapse: 'collapse' }, children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [selectable && ((0, jsx_runtime_1.jsx)("th", { scope: "col", style: { ...thStyle('left'), width: 40 }, children: (0, jsx_runtime_1.jsx)(Checkbox_1.Checkbox, { label: "Select all rows", checked: allSelected, indeterminate: someSelected, onChange: toggleAll }) })), columns.map((column) => ((0, jsx_runtime_1.jsx)("th", { scope: "col", style: { ...thStyle(column.align), width: column.width }, "aria-sort": sortKey === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined, children: column.sortable ? ((0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => onSortChange?.(column.key), style: {
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: theme.spacing[1],
                                    border: 'none',
                                    background: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    font: 'inherit',
                                    color: 'inherit',
                                }, children: [column.header, (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: sortKey === column.key && sortDirection === 'desc' ? 'chevronUp' : 'chevronDown', size: "sm", color: sortKey === column.key ? theme.colors.text.primary : theme.colors.text.disabled })] })) : (column.header) }, column.key)))] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: loading
                    ? Array.from({ length: 5 }).map((_, rowIndex) => ((0, jsx_runtime_1.jsxs)("tr", { children: [selectable && (0, jsx_runtime_1.jsx)("td", { style: tdStyle('left') }), columns.map((column) => ((0, jsx_runtime_1.jsx)("td", { style: tdStyle(column.align), children: (0, jsx_runtime_1.jsx)(Skeleton_1.Skeleton, { height: 16 }) }, column.key)))] }, `skeleton-${rowIndex}`)))
                    : data.map((row) => {
                        const id = getRowId(row);
                        return ((0, jsx_runtime_1.jsxs)("tr", { onClick: onRowClick ? () => onRowClick(row) : undefined, style: { cursor: onRowClick ? 'pointer' : undefined, backgroundColor: selectedIds?.has(id) ? theme.colors.brand.subtle : undefined }, children: [selectable && ((0, jsx_runtime_1.jsx)("td", { style: tdStyle('left'), onClick: (e) => e.stopPropagation(), children: (0, jsx_runtime_1.jsx)(Checkbox_1.Checkbox, { label: `Select row ${id}`, checked: Boolean(selectedIds?.has(id)), onChange: () => toggleRow(id) }) })), columns.map((column) => ((0, jsx_runtime_1.jsx)("td", { style: tdStyle(column.align), children: column.render(row) }, column.key)))] }, id));
                    }) })] }));
}
//# sourceMappingURL=Table.js.map