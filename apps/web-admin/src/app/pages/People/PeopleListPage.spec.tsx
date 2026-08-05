import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { RouterProvider } from '../../router/router';
import { PeopleListPage } from './PeopleListPage';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actorWithRole(role: string, extra: Record<string, unknown> = {}) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'person-1', role, branchId: 'branch-1', ...extra },
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
          <PeopleListPage />
        </RouterProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('PeopleListPage', () => {
  it('renders the role-scoped list returned by GET /people', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [person()] });

    renderPage();

    await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeInTheDocument());
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('sends the Bacenta Leader own-group scope as a groupId query param', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('groupId=bacenta-1');
  });

  it('sends the trimmed search box value as a search query param', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    renderPage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText('Search by name'), { target: { value: '  Ama  ' } });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [url] = fetchMock.mock.calls[1] as [string];
    expect(url).toContain(`search=${encodeURIComponent('Ama')}`);
  });

  it('shows an empty state when no one matches the current scope', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No people found')).toBeInTheDocument());
  });

  it('shows a retryable error state when the request fails', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load People")).toBeInTheDocument());
  });

  it('shows "+ New Person" for ADMIN (the only role permission-matrix grants people.person.create to)', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('new-person-open')).toBeInTheDocument());
  });

  it('hides "+ New Person" for a role that can never call POST /people (e.g. BACENTA_LEADER)', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No people found')).toBeInTheDocument());
    expect(screen.queryByTestId('new-person-open')).not.toBeInTheDocument();
  });

  it('reveals the New Person form and hides the open button when clicked', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();
    await waitFor(() => expect(screen.getByTestId('new-person-open')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('new-person-open'));

    expect(screen.getByTestId('new-person-form')).toBeInTheDocument();
    expect(screen.queryByTestId('new-person-open')).not.toBeInTheDocument();
  });
});
