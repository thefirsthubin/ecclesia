export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    testId?: string;
}
/**
 * Page navigation for a paginated list/table (Design System v1.0 Part
 * 7.8). A `<nav aria-label="Pagination">` landmark; the current page is a
 * non-interactive `aria-current="page"` element, not a disabled button
 * (disabled buttons are removed from the tab order and announce
 * differently than "current page" - this is the correct semantic, not
 * just a visual choice).
 */
export declare function Pagination({ currentPage, totalPages, onPageChange, testId }: PaginationProps): import("react").JSX.Element | null;
//# sourceMappingURL=Pagination.d.ts.map