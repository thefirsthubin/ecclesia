import { useEffect, useState, type ReactNode } from 'react';
import { Sidebar, TopBar, Breadcrumbs, CommandPalette, NotificationBell, UserMenu, useTheme, Text } from '@ecclesia/ui-web';
import type { BreadcrumbItem, CommandItem } from '@ecclesia/ui-web';
import type { AlertResponseDto, PersonResponseDto } from '@ecclesia/contracts';

import { Link, useLocation, useNavigate } from '../router/router';
import { useAuth } from '../auth/AuthContext';
import { apiGet } from '../lib/api-client';
import { useAsyncData } from '../lib/useAsyncData';
import { navItemsForRole, roleLabel } from './nav-items';
import { PillNav } from './PillNav';

export interface AppShellProps {
  children: ReactNode;
  breadcrumbs: BreadcrumbItem[];
  /** Open alerts to show in the notification bell - `undefined` while the current page has none to report (most stub pages). */
  notifications?: AlertResponseDto[];
  /**
   * `[Dashboard Redesign sprint, reference-image iteration]` `'sidebar'`
   * (default) is unchanged, existing behavior - every page but the
   * dashboard keeps the persistent sidebar. `'pill'` is a deliberate,
   * page-scoped exception: a top pill nav instead of the sidebar,
   * requested specifically for the dashboard (see
   * `DASHBOARD_REDESIGN_NOTES.md`) rather than a sitewide nav redesign.
   */
  navVariant?: 'sidebar' | 'pill';
}

/**
 * STEP 3's Web Admin application shell: persistent sidebar + top nav +
 * breadcrumbs + notification area + user menu, all wired to the real
 * router/auth state. STEP 8 (a11y): a skip-link precedes everything so
 * keyboard/screen-reader users can bypass the nav on every page, and the
 * page content is wrapped in a `<main>` landmark.
 */
export function AppShell({ children, breadcrumbs, notifications = [], navVariant = 'sidebar' }: AppShellProps) {
  const theme = useTheme();
  const { state, logout } = useAuth();
  const { path } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

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

  const items = navItemsForRole(state.actor.role).map((item) => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
    active: path === item.href,
  }));

  // Same `navItemsForRole` data `Sidebar`/`PillNav` already render - no
  // second nav taxonomy to keep in sync. `onSelect` calls the router
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

  // `[Product Experience Sprint I]` Rendered once, shared by both nav
  // variants below - `CommandPalette` portals to `document.body` itself
  // (`createPortal`, same as `Modal`/`Drawer`), so its position in this
  // tree doesn't affect layout either way.
  const commandPalette = (
    <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} items={paletteItems} testId="command-palette" />
  );

  if (navVariant === 'pill') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
        {skipLink}
        {commandPalette}
        <div style={{ padding: `${theme.spacing[5]}px ${theme.spacing[6]}px ${theme.spacing[3]}px` }}>
          <PillNav items={items} linkAs={Link} rightSlot={identitySlot} />
        </div>
        <main id="main-content" style={{ flex: 1, padding: `0 ${theme.spacing[6]}px ${theme.spacing[6]}px` }}>
          {children}
        </main>
      </div>
    );
  }

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
        <main id="main-content" style={{ flex: 1, padding: theme.spacing[6] }}>
          {children}
        </main>
      </div>
    </div>
  );
}
