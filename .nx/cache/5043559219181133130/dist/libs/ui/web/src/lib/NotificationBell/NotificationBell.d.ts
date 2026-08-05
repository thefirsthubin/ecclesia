import { type ReactNode } from 'react';
export interface NotificationBellProps {
    count: number;
    /** Rendered inside the popover when open - the caller owns the actual notification list content/data. */
    children: ReactNode;
    testId?: string;
}
/**
 * Top-bar notification area (Design System §3.1's "Notification Area").
 * A disclosure button (`aria-expanded`/`aria-haspopup`) rather than a
 * hover-only flyout, so it's fully keyboard-operable (STEP 8).
 */
export declare function NotificationBell({ count, children, testId }: NotificationBellProps): import("react").JSX.Element;
//# sourceMappingURL=NotificationBell.d.ts.map