import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { Route, RouterProvider, Routes } from '../../router/router';
import { PersonPage } from './PersonPage';

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

function renderPage() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider>
          <Routes>
            <Route path="/people/:id" element={<PersonPage />} />
          </Routes>
        </RouterProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  window.history.pushState({}, '', '/people/person-1');
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
    if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
    if (url.includes('/people/person-1/follow-up-tasks')) return Promise.resolve({ ok: true, json: async () => [] });
    if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
    return Promise.resolve({ ok: true, json: async () => [] });
  });
});

afterEach(() => {
  jest.clearAllMocks();
  window.history.pushState({}, '', '/');
});

describe('[Milestone D] PersonPage role dispatch', () => {
  it('opens the profile in a drawer over the flat list for BACENTA_LEADER (deep link)', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    renderPage();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByTestId('people-list-card')).toBeInTheDocument();
  });

  it('opens the profile in a drawer over the Bacenta directory for ADMIN (deep link)', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    renderPage();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByTestId('people-directory-content')).toBeInTheDocument();
  });

  it('falls back to the plain standalone profile page for a role with no drawer workspace, e.g. TREASURER', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeInTheDocument());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
