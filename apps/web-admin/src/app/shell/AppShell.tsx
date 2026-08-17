import { useEffect, useState, type ReactNode } from 'react';
import { Sidebar, TopBar, Breadcrumbs, CommandPalette, Icon, NotificationBell, UserMenu, useTheme, Text } from '@ecclesia/ui-web';
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
 * breadcrumbs/notifications/user menu for TopBar space ("do not put
 * every possible control in the header" - this sprint's own brief).
 * Presentation/interaction only - opens the exact same `CommandPalette`
 * instance `AppShell` already renders, no new search logic.
 *
 * `[Phase 3 design-test fix]` The full label overflowed the TopBar at
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
 * STEP 3's Web Admin application shell: persistent sidebar + top nav +
 * breadcrumbs + notification area + user menu, all wired to the real
 * router/auth state. STEP 8 (a11y): a skip-link precedes everything so
 * keyboard/screen-reader users can bypass the nav on every page, and the
 * page content is wrapped in a `<main>` landmark.
 *
 * `[UX Design Implementation]` Final UX Design Specification §12
 * (decision 1) - the Dashboard's separate top "pill nav" (`PillNav.tsx`,
 * removed) is retired. Every route, Dashboard included, now renders the
 * one persistent-sidebar + breadcrumb-top-bar grammar below - the
 * `navVariant` prop this component used to branch on is gone entirely,
 * not merely defaulted, since nothing should ever request the pill
 * variant again. This directly resolves the prior UX audit's "two
 * navigation grammars" finding: previously the very first screen most
 * personas landed on (`/dashboard`) used a different nav pattern, no
 * breadcrumb, and no page title, than every other route.
 */
export function AppShell({ children, breadcrumbs, notifications = [] }: AppShellProps) {
  const theme = useTheme();
  const { state, logout } = useAuth();
  const { path } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // `[Product Experience Sprint II, Phase 5]` A real bug found by this
  // sprint's own end-to-end workflow test (open the mobile overlay, tap a
  // nav link, land on a new page) - `sidebarOpen` was never reset on
  // navigation, so the 240px overlay stayed rendered *alongside* the
  // destination page's content on every route after the first tap,
  // squeezing it down to a sliver. That's what a "table overflow" on
  // `PersonDetailPage` actually was; the table/tabs were never the bug.
  // Closing on every `path` change is the standard mobile-nav-overlay
  // expectation this shell was missing.
  useEffect(() => {
    setSidebarOpen(false);
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

  useEffect(() => {
    // Design System §6.11: sidebar collapses below the `md` (tablet)
    // breakpoint. `matchMedia`, not a resize listener, so this reacts to
    // both window resize and (if ever embedded) container changes without
    // a manual debounce.
    const query = window.matchMedia(`(max-width: ${theme.breakpoints.md - 1}px)`);
    const update = () => setIsCompact(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [theme.breakpoints.md]);

  // `[Product Experience Sprint II, Phase 3]` A second, finer threshold -
  // only `CommandPaletteTrigger` reads this today (collapsing to
  // icon-only below `sm`, see its own doc comment for why). Kept
  // independent of `isCompact` above rather than derived from it, since
  // the two thresholds gate genuinely different things (sidebar layout
  // vs. one TopBar control's label).
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
  // already fully supports `item.group` and renders a heading for it) never
  // received the `Administration` grouping `nav-items.ts` already tags
  // `Configuration`/`Audit Log` with. Carried through now so the shell
  // actually renders what `NAV_ITEMS` already declares.
  const items = navItemsForRole(state.actor.role).map((item) => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
    active: path === item.href,
    group: item.group,
  }));

  // Same `navItemsForRole` data `Sidebar` already renders - no second
  // nav taxonomy to keep in sync. `onSelect` calls the router
  // directly rather than rendering an `<a>` inside the palette, since
  // `CommandItem` is a plain callback, not a link-shaped prop.
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

      <TopBar
        onToggleSidebar={isCompact ? () => setSidebarOpen((open) => !open) : undefined}
        left={<Breadcrumbs items={breadcrumbs} linkAs={Link} />}
        right={identitySlot}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        {(!isCompact || sidebarOpen) && (
          <Sidebar items={items} linkAs={Link} collapsed={false} />
        )}
        {/* `[Phase 3 design-test fix]` `minWidth: 0` - a flex item's
            default `min-width: auto` refuses to shrink below its
            content's intrinsic min-content width, which was silently
            forcing this whole element (and the entire page) wider than
            the viewport on narrow screens - found during this sprint's
            own required 390px inspection pass on more than one page
            (Dashboard's KPI grid, People's table), so it's this
            container's problem, not each page's individually. Every
            page's own internal overflow handling (`Table`'s horizontal
            scroll wrapper, grid column collapsing) already exists and
            now actually gets to run, instead of being pre-empted by the
            shell itself refusing to shrink. */}
        <main id="main-content" style={{ flex: 1, minWidth: 0, padding: theme.spacing[6] }}>
          {children}
        </main>
      </div>
    </div>
  );
}
