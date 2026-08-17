import { useEffect, useState, type ReactNode } from 'react';
import { TopNav, Breadcrumbs, CommandPalette, Icon, NotificationBell, UserMenu, useTheme, Text } from '@ecclesia/ui-web';
import type { BreadcrumbItem, CommandItem } from '@ecclesia/ui-web';
import type { AlertResponseDto, PersonResponseDto } from '@ecclesia/contracts';

import { Link, useLocation, useNavigate } from '../router/router';
import { useAuth } from '../auth/AuthContext';
import { apiGet } from '../lib/api-client';
import { useAsyncData } from '../lib/useAsyncData';
import { navItemsForRole, roleLabel } from './nav-items';

/**
 * `[Product Experience Sprint II, Phase 3 - AppShell pass]` A discoverable
 * trigger for `CommandPalette` - the palette itself has existed and been
 * wired to a global Cmd/Ctrl+K listener since the Product Experience
 * Sprint I, but nothing in the rendered UI ever hinted it existed; the
 * only way to find it was to already know the shortcut. This closes that
 * gap with a small, quiet control, not a full search box competing with
 * the primary nav/notifications/user menu for header space ("do not put
 * every possible control in the header" - this sprint's own brief).
 * Presentation/interaction only - opens the exact same `CommandPalette`
 * instance `AppShell` already renders, no new search logic.
 *
 * `[Phase 3 design-test fix]` The full label overflowed the header at
 * 390px (found during this sprint's own required 1440/1280/1024/768/390
 * inspection pass - the label + hint pushed the right-hand cluster wider
 * than the viewport, forcing the whole page into horizontal scroll and
 * cutting off KPI cards well below the shell itself). `isNarrow` collapses
 * it to an icon-only button below `sm` (640px) - same `aria-label`
 * either way, so it stays just as reachable for assistive tech, only the
 * visible label is conditional.
 */
function CommandPaletteTrigger({ onOpen, isNarrow }: { onOpen: () => void; isNarrow: boolean }) {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      aria-label="Search (Ctrl+K)"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing[2],
        padding: isNarrow ? theme.spacing[2] : `${theme.spacing[1]}px ${theme.spacing[3]}px`,
        borderRadius: theme.radius.sm,
        border: isNarrow ? 'none' : `1px solid ${theme.colors.border.default}`,
        backgroundColor: hovered ? theme.colors.surface.default : 'transparent',
        cursor: 'pointer',
        outline: focused ? `2px solid ${theme.colors.border.focus}` : 'none',
        outlineOffset: 2,
        transition: `background-color ${theme.motion.duration.fast}ms`,
      }}
    >
      <Icon name="search" size="sm" color={theme.colors.text.secondary} />
      {!isNarrow && (
        <>
          <Text as="span" variant="bodySmall" color={theme.colors.text.secondary}>
            Search
          </Text>
          <Text as="span" variant="caption" color={theme.colors.text.disabled}>
            ⌘K
          </Text>
        </>
      )}
    </button>
  );
}

export interface AppShellProps {
  children: ReactNode;
  breadcrumbs: BreadcrumbItem[];
  /** Open alerts to show in the notification bell - `undefined` while the current page has none to report (most stub pages). */
  notifications?: AlertResponseDto[];
}

/**
 * `[Global top navigation redesign]` Web Admin's application shell: a
 * horizontal top nav (wordmark, primary destinations, user/context
 * controls - `TopNav`) + a slim breadcrumb strip (genuine drill-down
 * only) + page content, all wired to the real router/auth state. STEP 8
 * (a11y): a skip-link precedes everything so keyboard/screen-reader users
 * can bypass the nav on every page, and the page content is wrapped in a
 * `<main>` landmark.
 *
 * Replaces the former persistent-left-sidebar grammar (`Sidebar`+`TopBar`,
 * both retired - `TopNav` is now the one shared nav surface, same single-
 * call-site discipline the sidebar era already established) - presentation
 * only: `navItemsForRole`'s real per-role destinations/order/RBAC-driven
 * visibility are untouched, and every route still renders through this
 * exact same shell regardless of role.
 *
 * `[Product Experience Sprint II Phase 3, superseded]` The breadcrumb
 * trail used to live inside the old `TopBar`, always visible even for a
 * single-item "Dashboard" trail that only ever restated the active nav
 * pill. Now shown only for genuine drill-down (`breadcrumbs.length > 2` -
 * e.g. `Dashboard > People > Person`), since the top nav's own active pill
 * already answers "which top-level section" on every other page; hiding
 * the redundant two-item case is a real reduction in chrome, not a
 * capability loss - `app.tsx` still passes the exact same breadcrumb data
 * for every route, unmodified.
 */
export function AppShell({ children, breadcrumbs, notifications = [] }: AppShellProps) {
  const theme = useTheme();
  const { state, logout } = useAuth();
  const { path } = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // `[Product Experience Sprint II, Phase 5]` A real bug found by this
  // sprint's own end-to-end workflow test (open the mobile overlay, tap a
  // nav link, land on a new page) - the mobile nav overlay was never
  // reset on navigation, so it stayed open over the destination page.
  // Closing on every `path` change is the standard mobile-nav-drawer
  // expectation this shell was missing then, and still needs now that
  // the overlay is `TopNav`'s own `Drawer` rather than the old sidebar.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [path]);

  // `[Product Experience Sprint I]` Objective 4 - `CommandPalette`
  // (`@ecclesia/ui-web`) has existed since the Nav/Data/Layout tier of the
  // UI Foundation sprint but was never actually mounted anywhere in
  // `apps/web-admin` (confirmed via grep before wiring this) - the
  // component's own doc comment is explicit that owning the global
  // Cmd/Ctrl+K keypress is deliberately an app-shell concern, not
  // something the component does itself. Ignored while focus is already
  // inside a text input/textarea/select or a `contentEditable` region so
  // it never hijacks normal typing (e.g. a Ctrl+K inside a `Search` box).
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.key === 'k' && (event.metaKey || event.ctrlKey))) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTypingTarget = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;
      if (isTypingTarget) return;
      event.preventDefault();
      setIsPaletteOpen((open) => !open);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // `[Product Experience Sprint II, Phase 3]` Only `CommandPaletteTrigger`
  // reads this (collapsing to icon-only below `sm`, see its own doc
  // comment for why) - `TopNav` owns its own, separate `md`/`sm`
  // breakpoint detection internally for the nav row/drawer split, so this
  // shell no longer needs a matching `isCompact` state of its own.
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${theme.breakpoints.sm - 1}px)`);
    const update = () => setIsNarrow(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [theme.breakpoints.sm]);

  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const personId = state.status === 'authenticated' ? state.actor.personId : undefined;

  // `GET /auth/me` (`ActorContext`) has no name field - same
  // personId->display-name resolution `apps/mobile`'s `usePersonName`
  // already established via `GET /people/:id` (`people.person.read`),
  // reused here for the user menu's own identity. `useAsyncData` is
  // called unconditionally (hooks rule) but its fetcher only runs once
  // `personId`/`accessToken` are set, right before the early `return null`
  // below is what actually gates this component's real return.
  const personState = useAsyncData<PersonResponseDto>(
    (signal) => {
      if (!personId) return Promise.reject(new Error('not authenticated yet'));
      return apiGet<PersonResponseDto>(`/people/${personId}`, { authToken: accessToken, signal });
    },
    [personId, accessToken],
  );

  if (state.status !== 'authenticated') {
    return null;
  }

  const displayName =
    personState.status === 'success' ? `${personState.data.firstName} ${personState.data.lastName}` : roleLabel(state.actor.role);

  // `[Sidebar grouping fix]` `group` was previously dropped here - this
  // mapping only copied `label`/`href`/`icon`/`active`, so `Sidebar` (which
  // already fully supported `item.group`) never received the
  // `Administration` grouping `nav-items.ts` already tags `Configuration`/
  // `Audit Log` with. Carried through now so `TopNav` (which supports the
  // exact same `group` field, rendered as a divider/heading rather than a
  // vertical section) actually renders what `NAV_ITEMS` already declares.
  //
  // `[Global pill navigation]` `active` also matches a nested route (e.g.
  // `/people/123` for the `/people` item, `path.startsWith` `${item.href}/`)
  // - previously exact-match only, so opening a Person or a Ministry group
  // record dropped every pill to its inactive state even though the user
  // was still squarely inside that section. No two `NAV_ITEMS` hrefs share
  // a prefix (`/people` is never a prefix of another item's own href), so
  // this can never light up two pills for one path. Presentation only -
  // `path`/`items`/RBAC are unchanged.
  const items = navItemsForRole(state.actor.role).map((item) => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
    active: path === item.href || path.startsWith(`${item.href}/`),
    group: item.group,
  }));

  // Same `navItemsForRole` data `TopNav` already renders - no second nav
  // taxonomy to keep in sync. `onSelect` calls the router directly rather
  // than rendering an `<a>` inside the palette, since `CommandItem` is a
  // plain callback, not a link-shaped prop.
  const paletteItems: CommandItem[] = items.map((item) => ({
    id: item.href,
    label: item.label,
    icon: item.icon,
    group: 'Navigate',
    onSelect: () => navigate(item.href),
  }));

  const openAlerts = notifications.filter((alert) => alert.status === 'OPEN');

  const identitySlot = (
    <>
      <CommandPaletteTrigger onOpen={() => setIsPaletteOpen(true)} isNarrow={isNarrow} />
      <NotificationBell count={openAlerts.length}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
          {openAlerts.map((alert) => (
            <Text key={alert.id} variant="bodySmall">
              {alert.message ?? alert.alertType}
            </Text>
          ))}
        </div>
      </NotificationBell>
      <UserMenu
        name={displayName}
        roleLabel={roleLabel(state.actor.role)}
        onLogout={() => {
          void logout().then(() => navigate('/login', { replace: true }));
        }}
      />
    </>
  );

  const skipLink = (
    <a
      href="#main-content"
      style={{
        position: 'absolute',
        left: -9999,
        top: 0,
        zIndex: theme.zIndex.toast,
        padding: theme.spacing[2],
        backgroundColor: theme.colors.surface.raised,
      }}
      onFocus={(event) => {
        event.currentTarget.style.left = '8px';
      }}
      onBlur={(event) => {
        event.currentTarget.style.left = '-9999px';
      }}
    >
      Skip to main content
    </a>
  );

  // `[Product Experience Sprint I]` `CommandPalette` portals to
  // `document.body` itself (`createPortal`, same as `Modal`/`Drawer`), so
  // its position in this tree doesn't affect layout.
  const commandPalette = (
    <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} items={paletteItems} testId="command-palette" />
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {commandPalette}
      {skipLink}

      <TopNav
        items={items}
        linkAs={Link}
        trailing={identitySlot}
        mobileMenuOpen={mobileMenuOpen}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
        testId="app-shell-nav"
      />

      {breadcrumbs.length > 2 && (
        <div style={{ padding: `${theme.spacing[2]}px ${theme.spacing[4]}px`, borderBottom: `1px solid ${theme.colors.border.subtle}`, backgroundColor: theme.colors.surface.raised }}>
          <Breadcrumbs items={breadcrumbs} linkAs={Link} />
        </div>
      )}

      {/* `[Phase 3 design-test fix]` `minWidth: 0` - a flex item's default
          `min-width: auto` refuses to shrink below its content's
          intrinsic min-content width, which previously forced this whole
          element (and the entire page) wider than the viewport on narrow
          screens. Every page's own internal overflow handling (`Table`'s
          horizontal scroll wrapper, grid column collapsing) already
          exists and now actually gets to run, instead of being pre-empted
          by the shell itself refusing to shrink.
          `[Whole Ecclesia layout rebalance]` `padding` dropped from a flat
          `spacing[6]` to a small `spacing[2]` safety floor - every page
          now owns its own centering and responsive horizontal padding via
          `PageContainer`, which this shell has no reason to duplicate
          (double padding, not double safety) - the floor only protects
          the rare early-loading/error state that renders before a page
          reaches its own `PageContainer`-wrapped content. */}
      <main id="main-content" style={{ flex: 1, minWidth: 0, padding: theme.spacing[2] }}>
        {children}
      </main>
    </div>
  );
}
