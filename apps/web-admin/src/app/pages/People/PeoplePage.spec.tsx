import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { RouterProvider } from '../../router/router';
import { PeoplePage } from './PeoplePage';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actorWithRole(role: string, extra: Record<string, unknown> = {}) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'staff-1', role, branchId: 'branch-1', branchName: 'River of Life HQ', ...extra },
    },
  };
}

function renderPage() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider>
          <PeoplePage />
        </RouterProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  window.history.pushState({}, '', '/people');
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
});

afterEach(() => {
  jest.clearAllMocks();
  window.history.pushState({}, '', '/');
});

/** `[Milestone D — Portal Experiences]` Every role reaches its Person
 * profile through a side drawer, never a new page - only the *list*
 * shape (flat table vs Bacenta directory) differs by scope width. These
 * assertions key off each workspace's own distinctive `testId` rather
 * than internals, so this test breaks if the wrong workspace mounts for
 * a role, without coupling to either workspace's implementation. */
describe('[Milestone D] PeoplePage role dispatch', () => {
  it.each(['ASSISTANT_PASTOR', 'BACENTA_LEADER', 'BASONTA_LEADER'])('mounts the flat-list drawer workspace for %s', async (role) => {
    mockUseAuth.mockReturnValue(actorWithRole(role));
    renderPage();
    await waitFor(() => expect(screen.getByTestId('people-list-card')).toBeInTheDocument());
    expect(screen.queryByTestId('bacenta-card-grid')).not.toBeInTheDocument();
  });

  it.each(['ADMIN', 'RESIDENT_PASTOR', 'ACTING_RESIDENT_PASTOR'])('mounts the Bacenta-organized directory workspace for %s', async (role) => {
    mockUseAuth.mockReturnValue(actorWithRole(role));
    renderPage();
    await waitFor(() => expect(screen.getByTestId('people-directory-content')).toBeInTheDocument());
    expect(screen.queryByTestId('people-list-card')).not.toBeInTheDocument();
  });

  it('falls back to the plain (non-drawer) list for a role with no People nav item, e.g. TREASURER', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    renderPage();
    await waitFor(() => expect(screen.getByTestId('people-list-card')).toBeInTheDocument());
  });
});
