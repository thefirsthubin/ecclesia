import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Heading } from '../Heading';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { Divider } from '../Divider';
import { Drawer } from '../Drawer';
import type { IconName } from '@ecclesia/ui-core';

/** What `TopNav` needs from a routing library's own link component - same
 * minimal, framework-agnostic shape `Sidebar` (the component this
 * replaces) already established, so `libs/ui/web` never depends on
 * `apps/web-admin`'s router. */
export type TopNavLinkComponent = ComponentType<{
  to: string;
  'aria-current'?: 'page';
  children: ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  style?: { outline: string; textDecoration: string };
}>;

export interface TopNavItem {
  label: string;
  href: string;
  icon: IconName;
  active: boolean;
  /** Consecutive items sharing a `group` render clustered together,
   * separated from the flat/ungrouped items by a divider (row layouts) or
   * a heading (the mobile drawer's vertical list) - same semantics
   * `Sidebar` already established, translated to a horizontal layout. */
  group?: string;
}

export interface TopNavProps {
  items: TopNavItem[];
  linkAs: TopNavLinkComponent;
  /** User/context controls (search trigger, notifications, user menu) - rendered on the right, same role `AppShell`'s old `identitySlot` played inside `TopBar`. */
  trailing?: ReactNode;
  homeHref?: string;
  /** Controlled - the mobile nav drawer's open state. Only visually relevant at the narrow tier (see this component's own responsive breakpoints below); harmless to pass at any width. */
  mobileMenuOpen: boolean;
  onOpenMobileMenu: () => void;
  onCloseMobileMenu: () => void;
  testId?: string;
}

interface PillProps {
  item: TopNavItem;
  LinkAs: TopNavLinkComponent;
  compact: boolean;
  fullWidth?: boolean;
  hoveredHref: string | undefined;
  setHoveredHref: (href: string | undefined) => void;
  focusedHref: string | undefined;
  setFocusedHref: (href: string | undefined) => void;
}

/** One pill - shared between the horizontal row (desktop full label,
 * tablet icon-only) and the mobile drawer's vertical list (`fullWidth`,
 * always labeled - there's no space pressure inside a 400px-wide drawer
 * the way there is in a shared header row). */
function NavPill({ item, LinkAs, compact, fullWidth, hoveredHref, setHoveredHref, focusedHref, setFocusedHref }: PillProps) {
  const theme = useTheme();
  const isHovered = hoveredHref === item.href && !item.active;

  return (
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
          justifyContent: compact ? 'center' : 'flex-start',
          width: fullWidth ? '100%' : undefined,
          gap: theme.spacing[2],
          padding: compact ? theme.spacing[3] : `${theme.spacing[2]}px ${theme.spacing[4]}px`,
          borderRadius: theme.radius.full,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          backgroundColor: item.active ? theme.colors.brand.subtle : isHovered ? theme.colors.surface.default : 'transparent',
          color: item.active ? theme.colors.brand.default : theme.colors.text.secondary,
          outline: focusedHref === item.href ? `2px solid ${theme.colors.border.focus}` : 'none',
          outlineOffset: 1,
          transition: `background-color ${theme.motion.duration.fast}ms`,
        }}
      >
        <Icon name={item.icon} size="sm" color={item.active ? theme.colors.brand.default : theme.colors.text.secondary} aria-label={compact ? item.label : undefined} />
        {!compact && (
          <Text as="span" variant="bodySmall" color={item.active ? theme.colors.brand.default : theme.colors.text.secondary}>
            {item.label}
          </Text>
        )}
      </span>
    </LinkAs>
  );
}

interface ListProps {
  items: TopNavItem[];
  LinkAs: TopNavLinkComponent;
  compact: boolean;
  hoveredHref: string | undefined;
  setHoveredHref: (href: string | undefined) => void;
  focusedHref: string | undefined;
  setFocusedHref: (href: string | undefined) => void;
}

/** The desktop (labeled) / tablet (`compact`, icon-only) horizontal row.
 * `overflow-x: auto` is a deliberate, unconditional safety net - the
 * heaviest real role (`ADMIN`: 9 destinations, two of them grouped under
 * "Administration") must never be able to break the header's layout
 * regardless of viewport width or a future role gaining one more
 * destination; a fully visible row is the common case, a scrollable one
 * is the honest fallback, never a broken one. */
function NavRow({ items, LinkAs, compact, hoveredHref, setHoveredHref, focusedHref, setFocusedHref }: ListProps) {
  const theme = useTheme();
  let previousGroup: string | undefined;

  return (
    <nav
      aria-label="Primary"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing[1],
        flex: 1,
        minWidth: 0,
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      {items.map((item) => {
        const startsNewGroup = Boolean(item.group) && item.group !== previousGroup;
        previousGroup = item.group;
        return (
          <div key={item.href} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1], flexShrink: 0 }}>
            {startsNewGroup && (
              <div style={{ height: 24, flexShrink: 0 }}>
                <Divider orientation="vertical" />
              </div>
            )}
            <NavPill item={item} LinkAs={LinkAs} compact={compact} hoveredHref={hoveredHref} setHoveredHref={setHoveredHref} focusedHref={focusedHref} setFocusedHref={setFocusedHref} />
          </div>
        );
      })}
    </nav>
  );
}

/** The mobile drawer's vertical list - `Sidebar`'s own former grouped-
 * list rendering, unchanged in spirit (a heading before the first item of
 * a new group, not before every item in it), now living here as the one
 * place a vertical nav list still makes sense. */
function NavList({ items, LinkAs, hoveredHref, setHoveredHref, focusedHref, setFocusedHref }: Omit<ListProps, 'compact'>) {
  const theme = useTheme();
  let previousGroup: string | undefined;

  return (
    <nav aria-label="Primary">
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
        {items.map((item) => {
          const startsNewGroup = Boolean(item.group) && item.group !== previousGroup;
          previousGroup = item.group;
          return (
            <li key={item.href}>
              {startsNewGroup && (
                <div style={{ borderTop: `1px solid ${theme.colors.border.subtle}`, margin: `${theme.spacing[2]}px ${theme.spacing[1]}px ${theme.spacing[1]}px`, paddingTop: theme.spacing[2] }}>
                  <div style={{ padding: `0 ${theme.spacing[2]}px` }}>
                    <Text as="span" variant="label" color={theme.colors.text.secondary}>
                      {item.group?.toUpperCase()}
                    </Text>
                  </div>
                </div>
              )}
              <NavPill item={item} LinkAs={LinkAs} compact={false} fullWidth hoveredHref={hoveredHref} setHoveredHref={setHoveredHref} focusedHref={focusedHref} setFocusedHref={setFocusedHref} />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * `[Global top navigation redesign]` Replaces `Sidebar` as Ecclesia's one
 * shared navigation surface - a horizontal bar (wordmark, primary nav
 * pills, trailing user/context controls), not a persistent left column.
 * Used identically by every role/portal (`AppShell` passes the same
 * `TopNav` regardless of `state.actor.role` - there has only ever been
 * one call site); the per-role difference is entirely in *which* `items`
 * `navItemsForRole` resolves to, never in how an item is drawn.
 *
 * Three self-contained responsive tiers (own `matchMedia` listeners, the
 * same breakpoints `AppShell` already used for the old sidebar collapse -
 * `theme.breakpoints.md`/`sm` - kept internal here rather than passed
 * down as props, so this component stays a complete, reusable unit):
 *
 * 1. **Desktop/laptop** (>= md) - the full row, icon + label pills.
 * 2. **Tablet** (sm-md) - the same row, `compact` (icon-only, each with
 *    an accessible `aria-label`) - a genuine hierarchy reconsideration
 *    ("reduce labels", not a linearly shrunk desktop row), matching the
 *    same icon-rail idea `Sidebar`'s own `collapsed` prop already used.
 * 3. **Mobile** (< sm) - the row disappears entirely in favor of a single
 *    "Toggle navigation menu" trigger; the full labeled item list moves
 *    into a `Drawer` (this design system's own existing overlay
 *    primitive - real focus trap, Escape-to-close, portal-to-body, all
 *    already built and tested, not re-solved here) sliding in from the
 *    left, the conventional and immediately recognizable "hamburger ->
 *    drawer" mobile nav pattern. Open state is controlled
 *    (`mobileMenuOpen`/`onOpenMobileMenu`/`onCloseMobileMenu`) rather than
 *    owned internally, so `AppShell` can close it on every route change
 *    the same way it always closed the old sidebar overlay.
 *
 * Active-item signal is unchanged from `Sidebar`'s own: a restrained
 * `brand.subtle` tint plus `brand.default` icon/label color, never a
 * border accent (banned above 1px by the craft floor; also the single
 * most recognizable AI-generated-UI tell) - just `radius.sm` -> a real
 * pill (`radius.full`) reflects "a selected destination", not "a button
 * demanding attention".
 */
export function TopNav({ items, linkAs: LinkAs, trailing, homeHref = '/dashboard', mobileMenuOpen, onOpenMobileMenu, onCloseMobileMenu, testId }: TopNavProps) {
  const theme = useTheme();
  const [isCompact, setIsCompact] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | undefined>(undefined);
  const [focusedHref, setFocusedHref] = useState<string | undefined>(undefined);
  const [toggleFocused, setToggleFocused] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${theme.breakpoints.md - 1}px)`);
    const update = () => setIsCompact(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [theme.breakpoints.md]);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${theme.breakpoints.sm - 1}px)`);
    const update = () => setIsNarrow(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [theme.breakpoints.sm]);

  const sharedPillState = { hoveredHref, setHoveredHref, focusedHref, setFocusedHref };

  return (
    <>
      <header
        data-testid={testId}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: theme.zIndex.stickyHeader,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing[4],
          padding: `${theme.spacing[3]}px ${theme.spacing[4]}px`,
          backgroundColor: theme.colors.surface.raised,
          borderBottom: `1px solid ${theme.colors.border.subtle}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[5], minWidth: 0, flex: 1 }}>
          <LinkAs to={homeHref} style={{ outline: 'none', textDecoration: 'none' }}>
            <Heading level={2} color={theme.colors.text.primary}>
              Ecclesia
            </Heading>
          </LinkAs>
          {!isNarrow && <NavRow items={items} LinkAs={LinkAs} compact={isCompact} {...sharedPillState} />}
          {isNarrow && (
            <button
              type="button"
              aria-label="Toggle navigation menu"
              onClick={onOpenMobileMenu}
              onFocus={() => setToggleFocused(true)}
              onBlur={() => setToggleFocused(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: theme.spacing[2],
                borderRadius: theme.radius.sm,
                outline: toggleFocused ? `2px solid ${theme.colors.border.focus}` : 'none',
                outlineOffset: 1,
                flexShrink: 0,
              }}
            >
              <Icon name="menu" size="md" />
            </button>
          )}
        </div>
        {trailing && <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3], flexShrink: 0 }}>{trailing}</div>}
      </header>

      {isNarrow && (
        <Drawer isOpen={mobileMenuOpen} onClose={onCloseMobileMenu} title="Navigation" side="left" testId={testId ? `${testId}-mobile-menu` : undefined}>
          <NavList items={items} LinkAs={LinkAs} {...sharedPillState} />
        </Drawer>
      )}
    </>
  );
}
