import type { ComponentType, ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import { Text } from '../Text';
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
export function Sidebar({ items, linkAs: LinkAs, collapsed = false, testId }: SidebarProps) {
  const theme = useTheme();

  return (
    <nav aria-label="Primary" data-testid={testId} style={{ width: collapsed ? 72 : 240, flexShrink: 0 }}>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: theme.spacing[2],
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing[1],
        }}
      >
        {items.map((item) => (
          <li key={item.href}>
            <LinkAs to={item.href} aria-current={item.active ? 'page' : undefined}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing[3],
                  padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
                  borderRadius: theme.radius.sm,
                  backgroundColor: item.active ? theme.colors.surface.raised : 'transparent',
                  color: item.active ? theme.colors.brand.default : theme.colors.text.secondary,
                }}
              >
                <Icon name={item.icon} size="sm" color={item.active ? theme.colors.brand.default : theme.colors.text.secondary} aria-label={collapsed ? item.label : undefined} />
                {!collapsed && (
                  <Text as="span" variant="bodySmall" color={item.active ? theme.colors.brand.default : theme.colors.text.secondary}>
                    {item.label}
                  </Text>
                )}
              </span>
            </LinkAs>
          </li>
        ))}
      </ul>
    </nav>
  );
}
