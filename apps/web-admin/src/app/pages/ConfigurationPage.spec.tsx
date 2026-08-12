import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { ConfigurationPage } from './ConfigurationPage';

const mockUseAuth = jest.fn();
jest.mock('../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actorWithRole(role: string) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'p1', role, branchId: 'branch-1' },
    },
  };
}

function configuration(overrides: Record<string, unknown> = {}) {
  return {
    id: 'config-1',
    branchId: 'branch-1',
    churchPulseWeights: { ATTENDANCE: 0.5, FINANCIAL_GIVING: 0.5 },
    poimenGateEnabled: false,
    silentDriftConfig: { n: 3, m: 3 },
    createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <ThemeProvider>
      <ConfigurationPage />
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('ConfigurationPage', () => {
  it('blocks a non-Admin/Council-Overseer role even via direct navigation', () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', actor: { personId: 'p1', role: 'TREASURER', branchId: 'b1' } } });

    renderPage();

    expect(screen.getByText("You don't have access to Configuration")).toBeInTheDocument();
  });

  it('shows a loading state while Configuration loads', () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockReturnValue(new Promise(() => undefined));

    renderPage();

    expect(screen.queryByTestId('poimen-gate-card')).not.toBeInTheDocument();
  });

  it('renders the loaded Poimen gate, Church Pulse weights, and Silent-Drift thresholds for a role that can read', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => configuration() });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('poimen-gate-card')).toBeInTheDocument());
    expect(screen.getByTestId('poimen-gate-switch')).toHaveAttribute('aria-checked', 'false');
    await waitFor(() => expect(screen.getByTestId('configuration-summary-card')).toBeInTheDocument());
    expect(screen.getByText('Attendance: 0.5')).toBeInTheDocument();
    expect(screen.getByText('Silent-Drift N (Gatherings): 3')).toBeInTheDocument();
  });

  /**
   * `[Branch Configuration milestone]` The real, disclosed RBAC gap this
   * page's own doc comment names: `ADMIN` (the only role that can write)
   * holds no `platform.configuration.read` grant at all, so the initial
   * `GET` 403s for that role - the page must still show the write/edit
   * affordance regardless, not hide it behind a failed read.
   */
  it("shows a retryable error state when the read fails (e.g. Admin's own real 403), but still offers Edit", async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "No Role Assignment grants 'platform.configuration.read' to role 'ADMIN'" }),
    });

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load Configuration")).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Edit Configuration' })).toBeInTheDocument();
  });

  it('toggles the Poimen gate immediately via PATCH and refetches', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    let getCallCount = 0;
    const fetchMock = jest.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        return Promise.resolve({ ok: true, json: async () => configuration({ poimenGateEnabled: true }) });
      }
      getCallCount += 1;
      return Promise.resolve({ ok: true, json: async () => configuration({ poimenGateEnabled: getCallCount > 1 }) });
    });
    global.fetch = fetchMock;

    renderPage();
    await waitFor(() => expect(screen.getByTestId('poimen-gate-switch')).toHaveAttribute('aria-checked', 'false'));

    fireEvent.click(screen.getByTestId('poimen-gate-switch'));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/platform/configuration'),
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ poimenGateEnabled: true }) }),
      ),
    );
    await waitFor(() => expect(screen.getByTestId('poimen-gate-switch')).toHaveAttribute('aria-checked', 'true'));
  });

  it('shows the server-provided denial reason inline when the Poimen gate toggle fails', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('COUNCIL_OVERSEER'));
    const fetchMock = jest.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: async () => ({ message: "No Role Assignment grants 'platform.configuration.update' to role 'COUNCIL_OVERSEER'" }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => configuration() });
    });
    global.fetch = fetchMock;

    renderPage();
    await waitFor(() => expect(screen.getByTestId('poimen-gate-switch')).toHaveAttribute('aria-checked', 'false'));

    fireEvent.click(screen.getByTestId('poimen-gate-switch'));

    await waitFor(() =>
      expect(screen.getByText("No Role Assignment grants 'platform.configuration.update' to role 'COUNCIL_OVERSEER'")).toBeInTheDocument(),
    );
  });

  it('opens the edit form pre-filled with the current weights/thresholds, PATCHes only the filled fields, and shows the refetched values', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    let getCallCount = 0;
    const fetchMock = jest.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        return Promise.resolve({ ok: true, json: async () => configuration({ churchPulseWeights: { ATTENDANCE: 0.75 } }) });
      }
      getCallCount += 1;
      return Promise.resolve({
        ok: true,
        json: async () => (getCallCount === 1 ? configuration() : configuration({ churchPulseWeights: { ATTENDANCE: 0.75 } })),
      });
    });
    global.fetch = fetchMock;

    renderPage();
    await waitFor(() => expect(screen.getByTestId('configuration-summary-card')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Edit Configuration' }));

    const attendanceInput = await screen.findByTestId('configuration-weight-ATTENDANCE');
    expect(attendanceInput).toHaveValue(0.5);
    fireEvent.change(attendanceInput, { target: { value: '0.75' } });

    fireEvent.click(screen.getByTestId('configuration-edit-submit'));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/platform/configuration'),
        expect.objectContaining({ method: 'PATCH' }),
      ),
    );
    const patchCall = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'PATCH');
    const patchBody = JSON.parse((patchCall as [string, RequestInit])[1].body as string);
    expect(patchBody.churchPulseWeights).toMatchObject({ ATTENDANCE: 0.75, FINANCIAL_GIVING: 0.5 });
    expect(patchBody.silentDriftConfig).toEqual({ n: 3, m: 3 });

    await waitFor(() => expect(screen.queryByTestId('configuration-edit-form')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Attendance: 0.75')).toBeInTheDocument());
  });

  it('POSTs (create) instead of PATCH when no Configuration exists yet for the Branch', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    const fetchMock = jest.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => configuration({ silentDriftConfig: { n: 4, m: 4 } }) });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({ message: "No Configuration found for Branch 'branch-1'" }) });
    });
    global.fetch = fetchMock;

    renderPage();
    await waitFor(() => expect(screen.getByText("Couldn't load Configuration")).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Edit Configuration' }));
    fireEvent.change(screen.getByTestId('configuration-silent-drift-n'), { target: { value: '4' } });
    fireEvent.change(screen.getByTestId('configuration-silent-drift-m'), { target: { value: '4' } });
    fireEvent.click(screen.getByTestId('configuration-edit-submit'));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/platform/configuration'), expect.objectContaining({ method: 'POST' })),
    );
  });

  it('shows the server-provided error inline and keeps the edit form open on failure', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    const fetchMock = jest.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        return Promise.resolve({ ok: false, status: 400, json: async () => ({ message: 'At least one field must be provided' }) });
      }
      return Promise.resolve({ ok: true, json: async () => configuration() });
    });
    global.fetch = fetchMock;

    renderPage();
    await waitFor(() => expect(screen.getByTestId('configuration-summary-card')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Edit Configuration' }));
    fireEvent.click(screen.getByTestId('configuration-edit-submit'));

    await waitFor(() => expect(screen.getByText('At least one field must be provided')).toBeInTheDocument());
    expect(screen.getByTestId('configuration-edit-form')).toBeInTheDocument();
  });

  it('cancels the edit form without sending a request', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => configuration() });

    renderPage();
    await waitFor(() => expect(screen.getByTestId('configuration-summary-card')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Edit Configuration' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByTestId('configuration-edit-form')).not.toBeInTheDocument();
  });

  it('allows COUNCIL_OVERSEER through the client-side gate (their real API calls remain independently authoritative)', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('COUNCIL_OVERSEER'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "No Role Assignment grants 'platform.configuration.read' to role 'COUNCIL_OVERSEER'" }),
    });

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load Configuration")).toBeInTheDocument());
  });
});
