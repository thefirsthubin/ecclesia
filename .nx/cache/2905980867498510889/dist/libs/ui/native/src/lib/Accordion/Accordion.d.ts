import type { ReactNode } from 'react';
export interface AccordionItem {
    id: string;
    title: string;
    content: ReactNode;
    disabled?: boolean;
}
export interface AccordionProps {
    items: AccordionItem[];
    expandedIds: string[];
    onChange: (expandedIds: string[]) => void;
    allowMultiple?: boolean;
    testId?: string;
}
/**
 * React Native equivalent of `ui-web`'s `Accordion`. Each header is a
 * `Pressable` with `accessibilityRole="button"` and
 * `accessibilityState.expanded` - RN has no `role="region"` landmark
 * concept for the panel the way web's ARIA does, so the panel is a plain
 * conditionally-rendered `View`; the header's own expanded-state
 * announcement is the accessibility signal available on this platform.
 */
export declare function Accordion({ items, expandedIds, onChange, allowMultiple, testId }: AccordionProps): import("react").JSX.Element;
//# sourceMappingURL=Accordion.d.ts.map