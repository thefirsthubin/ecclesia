import type { ReactNode } from 'react';
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
 * React Native equivalent of `ui-web`'s `Tabs`. RN ships real `"tab"`/
 * `"tablist"` `accessibilityRole` values (unlike, say, dialog-trapping,
 * this is one of the few cases RN's accessibility API maps directly onto
 * the ARIA concept), so this uses them rather than inventing a
 * `View`-plus-generic-role fallback. Tab bar is a horizontal
 * `ScrollView` (not a fixed-width row) since a Bacenta/Ministry-heavy tab
 * set can exceed one screen width on a phone in a way it wouldn't on
 * web. Only the active tab's content renders below - same
 * single-source-of-truth choice as `ui-web`'s version.
 */
export declare function Tabs({ tabs, activeTabId, onChange, testId }: TabsProps): import("react").JSX.Element;
//# sourceMappingURL=Tabs.d.ts.map