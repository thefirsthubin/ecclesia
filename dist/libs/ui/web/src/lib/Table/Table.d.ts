import type { ReactNode } from 'react';
import type { IconName } from '@ecclesia/ui-core';
export interface TableColumn<T> {
    key: string;
    header: string;
    render: (row: T) => ReactNode;
    align?: 'left' | 'right' | 'center';
    sortable?: boolean;
    /** Fixed pixel width - most columns should omit this and let the table lay out naturally; use for narrow, predictable columns (a status badge, an amount) where auto-width would look jumpy across rows. */
    width?: number;
}
export interface TableProps<T> {
    columns: TableColumn<T>[];
    data: T[];
    getRowId: (row: T) => string;
    sortKey?: string;
    sortDirection?: 'asc' | 'desc';
    onSortChange?: (key: string) => void;
    onRowClick?: (row: T) => void;
    selectedIds?: Set<string>;
    onSelectionChange?: (ids: Set<string>) => void;
    loading?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyIcon?: IconName;
    testId?: string;
}
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
export declare function Table<T>({ columns, data, getRowId, sortKey, sortDirection, onSortChange, onRowClick, selectedIds, onSelectionChange, loading, emptyTitle, emptyDescription, emptyIcon, testId, }: TableProps<T>): import("react").JSX.Element;
//# sourceMappingURL=Table.d.ts.map