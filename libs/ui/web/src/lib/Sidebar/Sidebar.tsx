import { useState, type ComponentType, type ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Heading } from '../Heading';
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
  /** `[Product Experience Sprint II, Phase 3]` Hover tracking, same
   * reasoning as the pre-existing `onFocus`/`onBlur` - a hover background
   * previously didn't exist on nav items at all. */
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  style?: { outline: string; textDecoration: string };
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
  /** `[Product Experience Sprint II, Phase 3]` Where the wordmark links -
   * defaults to `/dashboard`, the same landing route every persona's nav
   * taxonomy already starts with (`nav-items.ts`). Not hardcoded so a
   * future consumer with a different landing route isn't stuck. */
  homeHref?: string;
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
 *
 * `[Sidebar underline fix]` `LinkAs` renders a real `<a>` (`app/router/
 * router.tsx`'s `Link`, in every real usage), and nothing anywhere in
 * this codebase had ever overridden the browser's default `<a>`
 * underline - `outline: 'none'` was the only style this component ever
 * passed through. `textDecoration: 'none'` is now set alongside it, in
 * the same plain inline-style object, so it applies unconditionally
 * (default/hover/active/focus-visible/visited all read this one style,
 * there is no separate per-state rule anywhere to also fix). Scoped to
 * this component's own `LinkAs` call, not `Link` itself - `Link` is also
 * reused for ordinary in-content links (e.g. a Person row's name) that
 * are supposed to look like links.
 *
 * `[Product Experience Sprint II, Phase 3 - AppShell pass]` Three
 * changes, all presentation/interaction only (no new nav grammar, no
 * RBAC/route change - `items`/`linkAs` behave exactly as before):
 *
 * 1. A wordmark header ("Ecclesia", `Heading level={2}` - the smallest
 *    role that gets Phase 2's serif display font, so this is the *one*
 *    deliberate, non-repeating place personality shows up in the shell
 *    chrome). Links to `homeHref` via the same `linkAs` mechanism every
 *    nav item already uses - no new routing concept.
 * 2. A hover background on non-active items (`hoveredHref`, same pattern
 *    as the pre-existing `focusedHref`) - previously nav items had zero
 *    hover feedback at all.
 * 3. The active item's signal is now two quiet things together, not one
 *    loud one: the existing soft `brand.subtle` fill, plus a 3px
 *    `brand.default` left edge (a `borderLeft`, not absolute
 *    positioning - reserved at the same width, transparent, on every
 *    item, so nothing shifts between states). Deliberately *not* a pill
 *    (`radius.sm`, unchanged) and *not* a bolder font weight (`Text`'s
 *    `variant` is one atomic size/weight/tracking unit - see
 *    `typography.ts`'s own doc comment - cherry-picking just the weight
 *    out of it for this one spot would be exactly the "one-off value"
 *    the design system's token discipline exists to prevent).
 */
export function Sidebar({ items, linkAs: LinkAs, collapsed = false, homeHref = '/dashboard', testId }: SidebarProps) {
  const theme = useTheme();
  const [focusedHref, setFocusedHref] = useState<string | undefined>(undefined);
  const [hoveredHref, setHoveredHref] = useState<string | undefined>(undefined);
  let previousGroup: string | undefined;

  return (
    <nav
      aria-label="Primary"
      data-testid={testId}
      style={{
        width: collapsed ? 72 : 240,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.colors.surface.raised,
        borderRight: `1px solid ${theme.colors.border.subtle}`,
      }}
    >
      {!collapsed && (
        <div style={{ padding: `${theme.spacing[4]}px ${theme.spacing[4]}px ${theme.spacing[3]}px`, borderBottom: `1px solid ${theme.colors.border.subtle}` }}>
          <LinkAs to={homeHref} style={{ outline: 'none', textDecoration: 'none' }}>
            <Heading level={2} color={theme.colors.text.primary}>
              Ecclesia
            </Heading>
          </LinkAs>
        </div>
      )}
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
          const isHovered = hoveredHref === item.href && !item.active;
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
                onMouseEnter={() => setHoveredHref(item.href)}
                onMouseLeave={() => setHoveredHref(undefined)}
                style={{ outline: 'none', textDecoration: 'none' }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing[3],
                    padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
                    paddingLeft: theme.spacing[3] - 3,
                    borderLeft: `3px solid ${item.active ? theme.colors.brand.default : 'transparent'}`,
                    borderRadius: theme.radius.sm,
                    backgroundColor: item.active ? theme.colors.brand.subtle : isHovered ? theme.colors.surface.default : 'transparent',
                    color: item.active ? theme.colors.brand.default : theme.colors.text.secondary,
                    outline: focusedHref === item.href ? `2px solid ${theme.colors.border.focus}` : 'none',
                    outlineOffset: 1,
                    transition: `background-color ${theme.motion.duration.fast}ms`,
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
