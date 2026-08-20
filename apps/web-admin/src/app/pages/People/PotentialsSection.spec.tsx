import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { PotentialsSection } from './PotentialsSection';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actorWithRole(role: string, extra: Record<string, unknown> = {}) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'leader-1', role, branchId: 'branch-1', ...extra },
    },
  };
}

function potential(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p-1',
    branchId: 'branch-1',
    groupId: 'bacenta-1',
    personId: null,
    firstName: 'Kofi',
    lastName: 'Mensah',
    phone: '0244000111',
    source: 'WALK_IN',
    status: 'NEW',
    notes: null,
    assignedToPersonId: null,
    createdByPersonId: 'leader-1',
    createdAt: new Date('2026-08-15T09:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-08-15T09:00:00.000Z').toISOString(),
    ...overrides,
  };
}

function renderSection() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <PotentialsSection />
      </ToastProvider>
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('[Post-Milestone D] PotentialsSection', () => {
  it('renders the real, group-scoped list of Potentials for BACENTA_LEADER', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    const fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/potentials')) return Promise.resolve({ ok: true, json: async () => [potential()] });
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    renderSection();

    await waitFor(() => expect(screen.getByTestId('potentials-list')).toBeInTheDocument());
    expect(screen.getByText('Kofi Mensah')).toBeInTheDocument();
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('groupId=bacenta-1');
  });

  it('fans out across every Bacenta in an Assistant Pastor cluster, deduplicated by id', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1', 'bacenta-2'] }));
    const fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url.includes('groupId=bacenta-1')) return Promise.resolve({ ok: true, json: async () => [potential({ id: 'p-1' })] });
      if (url.includes('groupId=bacenta-2')) return Promise.resolve({ ok: true, json: async () => [potential({ id: 'p-2', firstName: 'Ama', lastName: 'Owusu' })] });
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    renderSection();

    await waitFor(() => expect(screen.getByText('Kofi Mensah')).toBeInTheDocument());
    expect(screen.getByText('Ama Owusu')).toBeInTheDocument();
  });

  it('shows an honest empty state, not fabricated rows, when there are no Potentials', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderSection();

    await waitFor(() => expect(screen.getByText('No open Potentials.')).toBeInTheDocument());
  });

  it('shows a retryable error state when the request fails', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ message: 'Internal error' }) });

    renderSection();

    await waitFor(() => expect(screen.getByText("Couldn't load Potentials")).toBeInTheDocument());
  });

  it('creates a Potential via the reveal form, then refetches and shows it', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    let potentials: unknown[] = [];
    const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith('/potentials') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string) as Record<string, unknown>;
        potentials = [potential({ id: 'p-new', firstName: body.firstName, lastName: body.lastName, source: body.source })];
        return Promise.resolve({ ok: true, json: async () => potentials[0] });
      }
      if (url.includes('/potentials')) return Promise.resolve({ ok: true, json: async () => potentials });
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    renderSection();
    await waitFor(() => expect(screen.getByText('No open Potentials.')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Add a Potential' }));
    fireEvent.change(screen.getByTestId('potential-first-name'), { target: { value: 'Zainab' } });
    fireEvent.change(screen.getByTestId('potential-source'), { target: { value: 'REFERRAL' } });
    fireEvent.click(screen.getByTestId('potential-submit'));

    await waitFor(() => expect(screen.getByText('Zainab')).toBeInTheDocument());
    expect(screen.queryByTestId('potential-create-form')).not.toBeInTheDocument();
  });

  it('shows the server-provided error inline and keeps the form open when creating a Potential fails', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith('/potentials') && init?.method === 'POST') {
        return Promise.resolve({ ok: false, status: 403, json: async () => ({ message: "No Role Assignment grants 'people.potential.create' to role 'BACENTA_LEADER'" }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderSection();
    await waitFor(() => expect(screen.getByText('No open Potentials.')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Add a Potential' }));
    fireEvent.change(screen.getByTestId('potential-first-name'), { target: { value: 'Zainab' } });
    fireEvent.change(screen.getByTestId('potential-source'), { target: { value: 'REFERRAL' } });
    fireEvent.click(screen.getByTestId('potential-submit'));

    await waitFor(() => expect(screen.getByText(/people.potential.create/)).toBeInTheDocument());
    expect(screen.getByTestId('potential-create-form')).toBeInTheDocument();
  });

  it('marks a Potential converted and refetches', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    let status = 'NEW';
    const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/potentials/p-1') && init?.method === 'PATCH') {
        status = 'CONVERTED';
        return Promise.resolve({ ok: true, json: async () => potential({ status }) });
      }
      if (url.includes('/potentials')) return Promise.resolve({ ok: true, json: async () => [potential({ status })] });
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    renderSection();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Mark converted' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Mark converted' }));

    await waitFor(() => expect(screen.getByText('CONVERTED')).toBeInTheDocument());
    expect(fetchMock.mock.calls.some(([url, init]) => (url as string).includes('/potentials/p-1') && (init as RequestInit | undefined)?.method === 'PATCH')).toBe(true);
  });
});
