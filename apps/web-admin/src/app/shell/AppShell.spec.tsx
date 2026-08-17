import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';
import type { RoleDto } from '@ecclesia/contracts';

import { RouterProvider } from '../router/router';
import { AppShell } from './AppShell';
import { NAV_ITEMS, navItemsForRole } from './nav-items';

const mockUseAuth = jest.fn();
jest.mock('../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderShell(role: string = 'RESIDENT_PASTOR') {
  mockUseAuth.mockReturnValue({
    state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'person-1', role, branchId: 'branch-1' } },
    logout: jest.fn(),
  });
  global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

  return render(
    <ThemeProvider>
      <RouterProvider>
        <AppShell breadcrumbs={[{ label: 'Dashboard' }]}>
          <div>Page content</div>
        </AppShell>
      </RouterProvider>
    </ThemeProvider>,
  );
}

/**
 * `[Product Experience Sprint I]` Objective 4 - `CommandPalette` wiring.
 * Manually traced against `AppShell.tsx` - `jest` cannot execute in this
 * sandbox, same disclosed limitation as every other spec in this
 * codebase.
 */
describe('AppShell command palette', () => {
  afterEach(() => jest.clearAllMocks());

  it('is closed by default', async () => {
    renderShell();
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument());
    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
  });

  it('opens on Ctrl+K and lists every nav item the current role can see', async () => {
    renderShell();
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument());

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /People/ })).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    renderShell();
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument());

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
  });

  it('does not open when Ctrl+K fires while a text input already has focus', async () => {
    renderShell();
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument());

    const probeInput = document.createElement('input');
    document.body.appendChild(probeInput);
    probeInput.focus();

    fireEvent.keyDown(probeInput, { key: 'k', ctrlKey: true });

    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
    document.body.removeChild(probeInput);
  });
});

/**
 * `[Sidebar grouping fix, carried into the top nav redesign]` `nav-items.ts`'s
 * `NAV_ITEMS` already tags `Configuration`/`Audit Log` with
 * `group: 'Administration'`; `AppShell`'s own mapping from
 * `navItemsForRole()` to `TopNav`'s `items` prop carries that field
 * through (previously dropped entirely, a real bug). In the horizontal
 * desktop/tablet row, a `group` boundary now renders as a plain 1px
 * divider (`role="separator"`), not a text heading - there's no clean way
 * to stack a heading above a subset of inline items in a single row - so
 * this pins the divider's presence/absence instead of the old sidebar's
 * "ADMINISTRATION" text. `ASSISTANT_PASTOR` is used for the negative
 * case, not the other describe block's default `RESIDENT_PASTOR` actor -
 * `RESIDENT_PASTOR` is itself in Audit Log's own `roles` list
 * (`nav-items.ts`), so it would see the divider too; `ASSISTANT_PASTOR`
 * matches neither Configuration's nor Audit Log's `roles` list.
 */
describe('AppShell top nav grouping (desktop row)', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders a divider before the Administration-grouped items for a role that can see them', async () => {
    renderShell('ADMIN');
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument());

    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Configuration/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Audit Log/ })).toBeInTheDocument();
  });

  it('renders no divider for a role that cannot see either grouped item', async () => {
    renderShell('ASSISTANT_PASTOR');
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument());

    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });
});

/**
 * `[Product Experience Sprint II, Phase 5]` A real bug this sprint's own
 * end-to-end People workflow test found live in the browser: opening the
 * mobile sidebar overlay, tapping a nav link, and landing on a new page
 * left the 240px overlay rendered *alongside* the destination page's
 * content, squeezing it into a sliver - what first looked like a table
 * overflow bug on `PersonDetailPage` was actually this. Fixed by closing
 * `sidebarOpen` on every path change.
 */
/**
 * `[Global pill navigation]` `AppShell`'s own `active` computation now
 * matches a nested route, not just an exact one - see its doc comment.
 * Pinned against a real nested route (`PersonDetailPage`'s own
 * `/people/:id`), not a synthetic path, since that's the concrete case
 * this fixes.
 */
describe('AppShell nested route highlighting', () => {
  afterEach(() => {
    jest.clearAllMocks();
    window.history.pushState({}, '', '/');
  });

  it('marks the People pill active while on a nested Person detail route', async () => {
    window.history.pushState({}, '', '/people/person-1');
    renderShell();
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument());

    expect(screen.getByRole('link', { name: /People/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Dashboard/ })).not.toHaveAttribute('aria-current');
  });
});

/**
 * `[Global pill navigation]` "The navigation content remains role-
 * specific... only the presentation is global" - verified here for every
 * one of the nine real personas (`ROLE_LABELS`' own exhaustive key set),
 * not just the two roles the rest of this file happens to exercise. Reads
 * the expected destination set from `navItemsForRole`/`NAV_ITEMS`
 * themselves (the same real source `AppShell` renders from), not a second
 * hardcoded list that could quietly drift from it - this proves the real
 * per-role data reaches the actual rendered pills unchanged, which
 * `nav-items.spec.ts` alone (pure-function only, no DOM) doesn't.
 */
describe('AppShell pill navigation across every role', () => {
  beforeEach(() => window.history.pushState({}, '', '/dashboard'));
  afterEach(() => {
    jest.clearAllMocks();
    window.history.pushState({}, '', '/');
  });

  const roles: RoleDto[] = [
    'RESIDENT_PASTOR',
    'COUNCIL_OVERSEER',
    'COUNCIL_TREASURER',
    'ASSISTANT_PASTOR',
    'ADMIN',
    'TREASURER',
    'BACENTA_LEADER',
    'BASONTA_LEADER',
    'SYSTEM_ADMINISTRATOR',
  ];

  it.each(roles)('renders exactly %s\'s own destinations, in its own order, and hides every other destination', async (role) => {
    renderShell(role);
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument());

    const expected = navItemsForRole(role);
    expect(expected.length).toBeGreaterThan(0);

    for (const item of expected) {
      expect(screen.getByRole('link', { name: new RegExp(`^${item.label}`) })).toHaveAttribute('href', item.href);
    }

    const hidden = NAV_ITEMS.filter((item) => !expected.some((visible) => visible.href === item.href));
    for (const item of hidden) {
      expect(screen.queryByRole('link', { name: new RegExp(`^${item.label}$`) })).not.toBeInTheDocument();
    }
  });

  it.each(roles)('gives %s\'s active destination the pill treatment (full radius, brand-tinted)', async (role) => {
    renderShell(role);
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument());

    // This `describe`'s own `beforeEach` pins the path to `/dashboard`,
    // and every one of the nine roles has a `Dashboard` destination - the
    // one item guaranteed active for all of them, so this doesn't need a
    // per-role fixture.
    const dashboardLink = screen.getByRole('link', { name: /^Dashboard/ });
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    expect(dashboardLink.firstChild).toHaveStyle({ borderRadius: '9999px', backgroundColor: '#EAF4F0' });
  });
});

/**
 * `[Global top navigation redesign]` The mobile tier's own mechanism
 * changed completely (a `TopNav`-owned `Drawer`, not a flex-sibling
 * sidebar), but the real bug this originally guarded against - the
 * mobile nav overlay staying open, rendered over the destination page,
 * after the user has already navigated away - is exactly as real for a
 * `Drawer` as it was for the old sidebar. `AppShell`'s `mobileMenuOpen`
 * still resets on every `path` change (its own `useEffect`, unchanged in
 * spirit), now closing the drawer instead of the old overlay.
 */
describe('AppShell mobile nav drawer', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('opens the drawer from the menu trigger, and closes it after navigating to a new page', async () => {
    const originalMatchMedia = window.matchMedia;
    // Simulates `TopNav`'s own internal `isNarrow` (below the `sm`
    // breakpoint) the same way `useDashboardBreakpoint.spec`-style tests
    // elsewhere in this app do - `TopNav`'s query is `(max-width: 639px)`.
    window.matchMedia = ((query: string) => ({
      matches: query.includes('639'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;

    renderShell();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Toggle navigation menu' })).toBeInTheDocument());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Toggle navigation menu' }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /People/ }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    window.matchMedia = originalMatchMedia;
  });
});
