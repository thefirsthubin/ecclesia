import { type ReactNode } from 'react';
export interface AccordionItem {
    id: string;
    title: string;
    content: ReactNode;
    disabled?: boolean;
}
export interface AccordionProps {
    items: AccordionItem[];
    /** Which item ids are currently expanded - controlled, same pattern as `Tabs`' `activeTabId`. */
    expandedIds: string[];
    onChange: (expandedIds: string[]) => void;
    /** `false` (default): expanding one item collapses any other open item (the common "FAQ" pattern). `true`: any number of items can be open at once (appropriate for, e.g., several independent optional-detail sections on a record page). */
    allowMultiple?: boolean;
    testId?: string;
}
/**
 * Expand/collapse panels (Design System v1.0 Part 7.8) - the second of
 * the two components (alongside `Tabs`) `UI_DESIGN_NOTES.md` flagged as
 * needing real shared interaction-state logic. Each header is a real
 * `<button aria-expanded aria-controls>` (never a `<div onClick>`), each
 * panel a `role="region" aria-labelledby` landmark - so a screen-reader
 * user gets "collapsed"/"expanded" announced on toggle and can navigate
 * directly to an expanded region via the landmarks list, not just by
 * reading linearly.
 */
export declare function Accordion({ items, expandedIds, onChange, allowMultiple, testId }: AccordionProps): import("react").JSX.Element;
//# sourceMappingURL=Accordion.d.ts.map