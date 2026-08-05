import type { ComponentType, ReactNode } from 'react';
import type { IconName } from '@ecclesia/ui-core';
/** What `Sidebar` needs from a routing library's own link component - kept
 * minimal and framework-agnostic so `libs/ui/web` (`scope:ui-web`) never
 * depends on `apps/web-admin`'s router (module-boundary rule) or any
 * particular routing library. `apps/web-admin`'s hand-built `Link`
 * (`app/router/router.tsx`) satisfies this shape as-is. */
export type SidebarLinkComponent = ComponentType<{
    to: string;
    'aria-current'?: 'page';
    children: ReactNode;
}>;
export interface SidebarItem {
    label: string;
    href: string;
    icon: IconName;
    /** [Design Decision] Icon choices for the nav taxonomy (Design System
     * §3.1) aren't themselves specified there - see
     * `apps/web-admin/src/app/shell/nav-items.ts`. */
    active: boolean;
}
export interface SidebarProps {
    items: SidebarItem[];
    linkAs: SidebarLinkComponent;
    /** Icon-rail collapse (Design System §6.11 tablet breakpoint) - labels hidden, icons + tooltip-equivalent `aria-label` remain. */
    collapsed?: boolean;
    testId?: string;
}
/**
 * The persistent left sidebar (Design System v1.0 §3.1: "persistent left
 * sidebar" is Web Admin's primary navigation surface, nav list per §3.1's
 * exact taxonomy). A `<nav>` landmark with `aria-label` so screen-reader
 * users can jump straight to it (STEP 8).
 */
export declare function Sidebar({ items, linkAs: LinkAs, collapsed, testId }: SidebarProps): import("react").JSX.Element;
//# sourceMappingURL=Sidebar.d.ts.map