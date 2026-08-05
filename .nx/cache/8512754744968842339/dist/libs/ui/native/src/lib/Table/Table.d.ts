import type { ReactNode } from 'react';
import type { IconName } from '@ecclesia/ui-core';
export interface TableColumn<T> {
    key: string;
    header: string;
    render: (row: T) => ReactNode;
    align?: 'left' | 'right' | 'center';
    sortable?: boolean;
    /** Flex weight relative to other columns (not a fixed pixel width - RN's flexbox is the natural fit here, unlike web's `<table>` auto-layout). Defaults to `1`. */
    flex?: number;
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
 * React Native equivalent of `ui-web`'s `Table`. RN has no `<table>`
 * primitive, so this is a `View` header row + RN's own `FlatList` for the
 * data rows (real virtualization, not a plain `.map` - a Table is exactly
 * the kind of long, potentially-large list `FlatList` exists for). Column
 * headers use `flex` weighting instead of web's pixel `width`, matching
 * how every other native layout in this library already works.
 */
export declare function Table<T>({ columns, data, getRowId, sortKey, sortDirection, onSortChange, onRowClick, selectedIds, onSelectionChange, loading, emptyTitle, emptyDescription, emptyIcon, testId, }: TableProps<T>): import("react").JSX.Element;
//# sourceMappingURL=Table.d.ts.map