import type { ReactNode } from 'react';
export interface TopBarProps {
    /** Rendered on the left, after the (optional) sidebar toggle - typically `<Breadcrumbs>`. */
    left?: ReactNode;
    /** Rendered on the right - typically `<NotificationBell>` + `<UserMenu>`. */
    right?: ReactNode;
    /** Present only below the Design System §6.11 tablet breakpoint, where the sidebar becomes a toggled overlay instead of always-visible. */
    onToggleSidebar?: () => void;
    testId?: string;
}
/**
 * Web Admin's top navigation bar (Design System §3.1's "Top Navigation" +
 * "Page Header" + "Responsive Collapse"). A `<header>` landmark.
 */
export declare function TopBar({ left, right, onToggleSidebar, testId }: TopBarProps): import("react").JSX.Element;
//# sourceMappingURL=TopBar.d.ts.map