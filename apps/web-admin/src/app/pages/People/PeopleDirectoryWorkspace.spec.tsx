import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { Route, RouterProvider, Routes } from '../../router/router';
import { PeopleDirectoryWorkspace } from './PeopleDirectoryWorkspace';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actor(extra: Record<string, unknown> = {}) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1', branchName: 'River of Life HQ', ...extra },
    },
  };
}

function person(overrides: Record<string, unknown> = {}) {
  return {
    id: 'person-1',
    branchId: 'branch-1',
    firstName: 'Ama',
    lastName: 'Owusu',
    phone: null,
    email: null,
    dateOfBirth: null,
    address: null,
    lifecycleStage: 'MEMBER',
    guardianPersonId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function group(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bacenta-1',
    branchId: 'branch-1',
    type: 'PASTORAL_CARE',
    name: 'Grace Bacenta',
    meetingSchedule: null,
    meetingLocation: null,
    category: null,
    lifecycleStatus: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function mockFetch() {
  return jest.fn().mockImplementation((url: string) => {
    if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
    if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
    if (url.includes('/people/person-1/follow-up-tasks')) return Promise.resolve({ ok: true, json: async () => [] });
    if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
    if (url.includes('/groups?type=PASTORAL_CARE')) return Promise.resolve({ ok: true, json: async () => [group()] });
    if (url.includes('/potentials')) return Promise.resolve({ ok: true, json: async () => [] });
    if (url.includes('/people?groupId=')) return Promise.resolve({ ok: true, json: async () => [person()] });
    if (url.includes('/people')) return Promise.resolve({ ok: true, json: async () => [person()] });
    return Promise.resolve({ ok: true, json: async () => [] });
  });
}

function renderAt(startPath: string) {
  window.history.pushState({}, '', startPath);
  return render(
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider>
          <Routes>
            <Route path="/people" element={<PeopleDirectoryWorkspace />} />
            <Route path="/people/:id" element={<PeopleDirectoryWorkspace />} />
          </Routes>
        </RouterProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  mockUseAuth.mockReturnValue(actor());
});

afterEach(() => {
  jest.clearAllMocks();
  window.history.pushState({}, '', '/');
});

/** `[Milestone D — Portal Experiences]` The Bacenta-directory counterpart
 * to `PeopleListWorkspace.spec.tsx` - same drawer-not-new-page contract,
 * proven against the Bacenta-cards list shape instead of the flat table. */
describe('[Milestone D] PeopleDirectoryWorkspace', () => {
  it('opens the member profile drawer, with the Bacenta directory still visible underneath, when a person row is clicked', async () => {
    global.fetch = mockFetch();
    renderAt('/people');

    await waitFor(() => expect(screen.getByTestId('bacenta-card-grid')).toBeInTheDocument());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Open the Bacenta roster, then click into the member's profile.
    fireEvent.click(screen.getByTestId('bacenta-card-bacenta-1'));
    await waitFor(() => expect(screen.getByTestId('selected-bacenta-roster-card')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('link', { name: /Ama Owusu/ }));

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByText('Member Profile')).toBeInTheDocument();
    // The directory is still mounted underneath, not replaced by a new page.
    expect(screen.getByTestId('bacenta-card-grid')).toBeInTheDocument();
  });

  it('loads a direct profile URL with the drawer already open (deep-linking), without losing the directory', async () => {
    global.fetch = mockFetch();
    renderAt('/people/person-1');

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByTestId('bacenta-card-grid')).toBeInTheDocument();
  });

  it('closes the drawer via the scrim without navigating away from the directory', async () => {
    global.fetch = mockFetch();
    renderAt('/people');

    await waitFor(() => expect(screen.getByTestId('bacenta-card-grid')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('bacenta-card-bacenta-1'));
    fireEvent.click(await screen.findByRole('link', { name: /Ama Owusu/ }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('member-profile-drawer-scrim'));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('bacenta-card-grid')).toBeInTheDocument();
  });
});
