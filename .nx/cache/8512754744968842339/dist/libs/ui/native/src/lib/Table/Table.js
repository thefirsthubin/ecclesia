"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = Table;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
const Checkbox_1 = require("../Checkbox");
const EmptyState_1 = require("../EmptyState");
const Skeleton_1 = require("../Skeleton");
/**
 * React Native equivalent of `ui-web`'s `Table`. RN has no `<table>`
 * primitive, so this is a `View` header row + RN's own `FlatList` for the
 * data rows (real virtualization, not a plain `.map` - a Table is exactly
 * the kind of long, potentially-large list `FlatList` exists for). Column
 * headers use `flex` weighting instead of web's pixel `width`, matching
 * how every other native layout in this library already works.
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
    if (!loading && data.length === 0) {
        return (0, jsx_runtime_1.jsx)(EmptyState_1.EmptyState, { icon: emptyIcon, title: emptyTitle, description: emptyDescription, testId: testId ? `${testId}-empty` : undefined });
    }
    const headerRow = ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.border.default, paddingVertical: theme.spacing[2] }, children: [selectable && ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: { width: 40, paddingHorizontal: theme.spacing[2] }, children: (0, jsx_runtime_1.jsx)(Checkbox_1.Checkbox, { label: "Select all rows", checked: allSelected, indeterminate: someSelected, onChange: toggleAll }) })), columns.map((column) => {
                const isSorted = sortKey === column.key;
                const content = ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: {
                                fontFamily: theme.fontFamily.base,
                                fontSize: theme.typography.label.fontSize,
                                fontWeight: '600',
                                color: theme.colors.text.secondary,
                            }, children: column.header }), column.sortable && ((0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: isSorted && sortDirection === 'desc' ? 'chevronUp' : 'chevronDown', size: "sm", color: isSorted ? theme.colors.text.primary : theme.colors.text.disabled }))] }));
                return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: { flex: column.flex ?? 1, paddingHorizontal: theme.spacing[2] }, children: column.sortable ? ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => onSortChange?.(column.key), accessibilityRole: "button", accessibilityLabel: `Sort by ${column.header}`, accessibilityState: { selected: isSorted }, children: content })) : (content) }, column.key));
            })] }));
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { testID: testId, style: { flex: 1 }, children: [headerRow, loading ? ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: { gap: theme.spacing[1], paddingVertical: theme.spacing[2] }, children: Array.from({ length: 5 }).map((_, index) => ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: { paddingHorizontal: theme.spacing[2], paddingVertical: theme.spacing[2] }, children: (0, jsx_runtime_1.jsx)(Skeleton_1.Skeleton, { height: 16 }) }, `skeleton-${index}`))) })) : ((0, jsx_runtime_1.jsx)(react_native_1.FlatList, { data: data, keyExtractor: getRowId, renderItem: ({ item }) => {
                    const id = getRowId(item);
                    const row = ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: {
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: theme.spacing[3],
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.border.subtle,
                            backgroundColor: selectedIds?.has(id) ? theme.colors.brand.subtle : undefined,
                        }, children: [selectable && ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: { width: 40, paddingHorizontal: theme.spacing[2] }, children: (0, jsx_runtime_1.jsx)(Checkbox_1.Checkbox, { label: `Select row ${id}`, checked: Boolean(selectedIds?.has(id)), onChange: () => toggleRow(id) }) })), columns.map((column) => {
                                const content = column.render(item);
                                return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: { flex: column.flex ?? 1, paddingHorizontal: theme.spacing[2] }, children: typeof content === 'string' || typeof content === 'number' ? ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }, children: content })) : (content) }, column.key));
                            })] }));
                    return onRowClick ? ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => onRowClick(item), accessibilityRole: "button", children: row })) : (row);
                } }))] }));
}
//# sourceMappingURL=Table.js.map