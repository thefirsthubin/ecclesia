import type { ReactNode } from 'react';
export interface FilterChipData {
    id: string;
    label: string;
}
export interface FilterBarProps {
    filters: FilterChipData[];
    onRemove: (id: string) => void;
    onClearAll?: () => void;
    children?: ReactNode;
    testId?: string;
}
/**
 * React Native equivalent of `ui-web`'s `FilterBar` - same thin-display,
 * not-a-filter-builder scope (see that file's doc comment). Wraps chips
 * with `flexWrap` since a phone-width row fits far fewer chips than web.
 */
export declare function FilterBar({ filters, onRemove, onClearAll, children, testId }: FilterBarProps): import("react").JSX.Element | null;
//# sourceMappingURL=FilterBar.d.ts.map