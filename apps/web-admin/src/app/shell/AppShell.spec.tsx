import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { RouterProvider } from '../router/router';
import { AppShell } from './AppShell';

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
 * `[Sidebar grouping fix]` `nav-items.ts`'s `NAV_ITEMS` already tags
 * `Configuration`/`Audit Log` with `group: 'Administration'`, and
 * `Sidebar` already renders a heading for any item's `group` - but
 * `AppShell`'s own mapping from `navItemsForRole()` to `Sidebar`'s
 * `items` prop was dropping the `group` field, so the heading never
 * actually appeared in the browser. Pins that it does now, for a role
 * that can see at least one Administration-grouped item. `ASSISTANT_PASTOR`
 * is used for the negative case, not the other describe block's default
 * `RESIDENT_PASTOR` actor - `RESIDENT_PASTOR` is itself in Audit Log's own
 * `roles` list (`nav-items.ts`), so it would see the heading too;
 * `ASSISTANT_PASTOR` matches neither Configuration's nor Audit Log's
 * `roles` list.
 */
describe('AppShell sidebar grouping', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders an Administration group heading above Configuration and Audit Log for a role that can see them', async () => {
    renderShell('ADMIN');
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument());

    expect(screen.getByText('ADMINISTRATION')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Configuration/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Audit Log/ })).toBeInTheDocument();
  });

  it('does not render an Administration heading for a role that cannot see either grouped item', async () => {
    renderShell('ASSISTANT_PASTOR');
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument());

    expect(screen.queryByText('ADMINISTRATION')).not.toBeInTheDocument();
  });
});
