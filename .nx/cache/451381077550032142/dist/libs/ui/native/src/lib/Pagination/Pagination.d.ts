export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    testId?: string;
}
/**
 * React Native equivalent of `ui-web`'s `Pagination` - deliberately
 * simpler, not a straight port: a row of small numbered buttons is a poor
 * touch target on a phone screen, so this is Previous/Next plus a
 * "Page X of Y" label instead, the same "don't port a desktop-scale
 * interaction 1:1" judgment call `Tabs`' horizontal-`ScrollView` bar made.
 */
export declare function Pagination({ currentPage, totalPages, onPageChange, testId }: PaginationProps): import("react").JSX.Element | null;
//# sourceMappingURL=Pagination.d.ts.map