import { type ReactNode } from 'react';
export interface TabItem {
    id: string;
    label: string;
    content: ReactNode;
    disabled?: boolean;
}
export interface TabsProps {
    tabs: TabItem[];
    activeTabId: string;
    onChange: (id: string) => void;
    testId?: string;
}
/**
 * Switches between mutually-exclusive content panels (Design System v1.0
 * Part 7.8) - one of the two base components (alongside `Accordion`) that
 * needs real shared interaction-state logic beyond every prior component
 * in this library (`UI_DESIGN_NOTES.md`'s own framing). Only the active
 * panel's content is rendered (not all panels hidden via CSS) - simpler,
 * and matches this codebase's existing preference for controlled,
 * single-source-of-truth state over DOM-visibility toggling.
 *
 * Implements the WAI-ARIA "automatic activation" tabs pattern:
 * `role="tablist"`/`"tab"`/`"tabpanel"`, roving `tabIndex` (only the
 * active tab is in the natural Tab order; `ArrowLeft`/`ArrowRight` move
 * *and activate* between tabs, `Home`/`End` jump to the first/last
 * enabled tab) - not the "manual activation" variant (arrow moves focus,
 * Enter/Space activates), which is the other WAI-ARIA-sanctioned pattern
 * but a heavier interaction model this component doesn't need for the
 * closed, always-visible tab sets this codebase uses it for.
 */
export declare function Tabs({ tabs, activeTabId, onChange, testId }: TabsProps): import("react").JSX.Element;
//# sourceMappingURL=Tabs.d.ts.map