import type { ComponentType, ReactNode } from 'react';
export type BreadcrumbLinkComponent = ComponentType<{
    to: string;
    children: ReactNode;
}>;
export interface BreadcrumbItem {
    label: string;
    href?: string;
}
export interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    linkAs: BreadcrumbLinkComponent;
    testId?: string;
}
/**
 * Design System v1.0 §3.1: nav depth is capped at 3 (Domain → Surface →
 * Record detail) - breadcrumbs make that depth visible and give a
 * one-click way back up it. The final item (current page) is not a link
 * (`aria-current="page"` on plain text), matching standard breadcrumb a11y
 * pattern.
 */
export declare function Breadcrumbs({ items, linkAs: LinkAs, testId }: BreadcrumbsProps): import("react").JSX.Element;
//# sourceMappingURL=Breadcrumbs.d.ts.map