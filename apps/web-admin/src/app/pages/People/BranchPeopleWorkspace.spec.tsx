import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { Route, RouterProvider, Routes } from '../../router/router';
import { __resetPeopleListPagePersistedStateForTests } from './PeopleListPage';
import { BranchPeopleWorkspace } from './BranchPeopleWorkspace';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actor(extra: Record<string, unknown> = {}) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'staff-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1', clusterBacentaIds: ['bacenta-1'], ...extra },
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

function mockFetch() {
  return jest.fn().mockImplementation((url: string) => {
    if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
    if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
    if (url.includes('/people/person-1/follow-up-tasks')) return Promise.resolve({ ok: true, json: async () => [] });
    if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
    if (url.includes('/people?')) return Promise.resolve({ ok: true, json: async () => [person()] });
    return Promise.resolve({ ok: true, json: async () => [] });
  });
}

/** Registers `/people` and `/people/:id` exactly as `app.tsx` does, both
 * pointed at the same `BranchPeopleWorkspace` instance - the real
 * behavior under test, not a synthetic shortcut. */
function renderAt(startPath: string) {
  window.history.pushState({}, '', startPath);
  return render(
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider>
          <Routes>
            <Route path="/people" element={<BranchPeopleWorkspace />} />
            <Route path="/people/:id" element={<BranchPeopleWorkspace />} />
          </Routes>
        </RouterProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  __resetPeopleListPagePersistedStateForTests();
  mockUseAuth.mockReturnValue(actor());
});

afterEach(() => {
  jest.clearAllMocks();
  window.history.pushState({}, '', '/');
});

/**
 * `[Whole Ecclesia layout rebalance, Branch Pastor People redesign]`
 * "When the Branch Pastor clicks a person's name, open the profile as a
 * side panel - preserve the list underneath, allow closing without
 * losing filters/search state, and a direct profile URL should still
 * work." Every assertion below traces to one of those explicit
 * requirements.
 */
describe('BranchPeopleWorkspace', () => {
  it('opens the member profile drawer, with the People list still visible underneath, when a row is clicked', async () => {
    global.fetch = mockFetch();
    renderAt('/people');

    await waitFor(() => expect(screen.getByRole('link', { name: /Ama Owusu/ })).toBeInTheDocument());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /Ama Owusu/ }));

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByText('Member Profile')).toBeInTheDocument();
    // The list is still mounted underneath, not replaced by a new page.
    expect(screen.getByRole('link', { name: /Ama Owusu/ })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search by name' })).toBeInTheDocument();
  });

  it('loads a direct profile URL with the drawer already open (deep-linking), without losing the list', async () => {
    global.fetch = mockFetch();
    renderAt('/people/person-1');

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByRole('searchbox', { name: 'Search by name' })).toBeInTheDocument();
  });

  it('closes the drawer without clearing the search text underneath', async () => {
    global.fetch = mockFetch();
    renderAt('/people');

    const search = await screen.findByRole('searchbox', { name: 'Search by name' });
    fireEvent.change(search, { target: { value: 'Ama' } });
    expect(search).toHaveValue('Ama');

    fireEvent.click(await screen.findByRole('link', { name: /Ama Owusu/ }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    // `Drawer`'s own scrim click closes it (dismissible by default).
    fireEvent.click(screen.getByTestId('member-profile-drawer-scrim'));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('searchbox', { name: 'Search by name' })).toHaveValue('Ama');
  });
});
