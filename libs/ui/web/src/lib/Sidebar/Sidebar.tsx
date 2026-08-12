import { useState, type ComponentType, type ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import { Text } from '../Text';
import type { IconName } from '@ecclesia/ui-core';

/** What `Sidebar` needs from a routing library's own link component - kept
 * minimal and framework-agnostic so `libs/ui/web` (`scope:ui-web`) never
 * depends on `apps/web-admin`'s router (module-boundary rule) or any
 * particular routing library. `apps/web-admin`'s hand-built `Link`
 * (`app/router/router.tsx`) satisfies this shape as-is. `onFocus`/`onBlur`
 * are optional so a minimal `linkAs` (e.g. a test fake) still satisfies
 * this type without wiring them through. */
export type SidebarLinkComponent = ComponentType<{
  to: string;
  'aria-current'?: 'page';
  children: ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: { outline: string };
}>;

export interface SidebarItem {
  label: string;
  href: string;
  icon: IconName;
  /** [Design Decision] Icon choices for the nav taxonomy (Design System
   * §3.1) aren't themselves specified there - see
   * `apps/web-admin/src/app/shell/nav-items.ts`. */
  active: boolean;
  /**
   * `[UX Design Implementation]` Final UX Design Specification §12 - an
   * optional group label. Consecutive items sharing the same `group`
   * value render together under one heading, separated from whatever
   * came before by a divider; items with no `group` render in the flat,
   * ungrouped top section (today: every operational nav item).
   * Grouping is purely presentational - it never changes which items are
   * present, only how they're visually clustered.
   */
  group?: string;
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
 *
 * `[UX Design Implementation]` Final UX Design Specification §12 -
 * `Sidebar` now paints its own `surface.raised` background and a
 * `border.subtle` right edge (previously fully transparent, silently
 * inheriting whatever sat behind it) so it reads as a distinct surface
 * rather than a colored block bleeding into the page. The active item's
 * pill now uses `brand.subtle` (a soft green tint), not `surface.raised`
 * - the prior value was only ever invisible-by-coincidence against a
 * sidebar that itself had no background; it would have rendered as a
 * literal no-op highlight the moment the sidebar gained one.
 *
 * `[UX Design Implementation]` Final UX Design Specification §19
 * (Phase 2 shell verification) - nav items now get the same on-brand
 * `border.focus` outline `Button`/`Input`/`Select`/`TextArea`/`Search`
 * already use on keyboard focus, closing the one shell inconsistency
 * that verification pass found (the browser's unstyled default outline
 * was visible but didn't match the rest of the system).
 */
export function Sidebar({ items, linkAs: LinkAs, collapsed = false, testId }: SidebarProps) {
  const theme = useTheme();
  const [focusedHref, setFocusedHref] = useState<string | undefined>(undefined);
  let previousGroup: string | undefined;

  return (
    <nav
      aria-label="Primary"
      data-testid={testId}
      style={{
        width: collapsed ? 72 : 240,
        flexShrink: 0,
        backgroundColor: theme.colors.surface.raised,
        borderRight: `1px solid ${theme.colors.border.subtle}`,
      }}
    >
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
        {items.map((item) => {
          const startsNewGroup = Boolean(item.group) && item.group !== previousGroup;
          previousGroup = item.group;
          return (
            <li key={item.href}>
              {startsNewGroup && (
                <div
                  style={{
                    borderTop: `1px solid ${theme.colors.border.subtle}`,
                    margin: `${theme.spacing[2]}px ${theme.spacing[1]}px ${theme.spacing[1]}px`,
                    paddingTop: theme.spacing[2],
                  }}
                >
                  {!collapsed && (
                    <div style={{ padding: `0 ${theme.spacing[2]}px` }}>
                      {/* `[UX Design Implementation]` Final UX Design
                          Specification §19 (Phase 2 shell verification) -
                          `text.disabled` on `surface.raised` measures
                          2.59:1, well under WCAG AA's 4.5:1 floor for
                          normal text. `text.secondary` (5.98:1, the same
                          color every nav item's own label already uses)
                          keeps this visually subordinate to the item
                          labels below it without failing contrast. */}
                      <Text as="span" variant="label" color={theme.colors.text.secondary}>
                        {item.group?.toUpperCase()}
                      </Text>
                    </div>
                  )}
                </div>
              )}
              <LinkAs
                to={item.href}
                aria-current={item.active ? 'page' : undefined}
                onFocus={() => setFocusedHref(item.href)}
                onBlur={() => setFocusedHref(undefined)}
                style={{ outline: 'none' }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing[3],
                    padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
                    borderRadius: theme.radius.sm,
                    backgroundColor: item.active ? theme.colors.brand.subtle : 'transparent',
                    color: item.active ? theme.colors.brand.default : theme.colors.text.secondary,
                    outline: focusedHref === item.href ? `2px solid ${theme.colors.border.focus}` : 'none',
                    outlineOffset: 1,
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
          );
        })}
      </ul>
    </nav>
  );
}
