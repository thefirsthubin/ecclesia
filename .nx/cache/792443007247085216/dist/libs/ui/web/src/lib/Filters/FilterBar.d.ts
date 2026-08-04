import type { ReactNode } from 'react';
export interface FilterChipData {
    id: string;
    label: string;
}
export interface FilterBarProps {
    /** The currently-active filters, already resolved to a display label by the caller (e.g. "Branch: Accra Central", "Status: Overdue") - this component only knows how to display and remove a filter, not how to build one (per-field filter editors are business-domain UI, out of this library's scope). */
    filters: FilterChipData[];
    onRemove: (id: string) => void;
    onClearAll?: () => void;
    /** A trailing slot for the caller's own "Add filter" control (typically a `Select` or a `Button` opening a `Drawer`) - kept as a slot rather than this component owning a generic filter-builder UI. */
    children?: ReactNode;
    testId?: string;
}
/**
 * The active-filter chip row above a filtered list/table (Design System
 * v1.0 Part 7.8's Filters concept). Each chip is a labelled, removable
 * pill; "Clear all" only renders once there's something to clear. This
 * is deliberately a thin display component, not a filter-builder -
 * building filter *values* (date ranges, multi-selects, etc.) is business
 * logic per screen, this only renders the resulting chips.
 */
export declare function FilterBar({ filters, onRemove, onClearAll, children, testId }: FilterBarProps): import("react").JSX.Element | null;
//# sourceMappingURL=FilterBar.d.ts.map