import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { AuditLogPage } from './AuditLogPage';

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

function entry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'entry-1',
    branchId: 'branch-1',
    actorUserId: 'user-1',
    action: 'stewardship.transaction.verify',
    effect: 'ALLOW',
    resourceType: 'FinancialTransaction',
    resourceId: 'txn-1',
    reason: null,
    deviceId: null,
    ipAddress: null,
    occurredAt: new Date('2026-08-01T12:00:00.000Z').toISOString(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <ThemeProvider>
      <AuditLogPage />
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('AuditLogPage', () => {
  it('has no pre-emptive client-side role gate - every role reaches the real GET /platform/audit-log call', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER'));
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "Resource is outside the actor's OWN_GROUP scope for 'platform.audit_log.read'" }),
    });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/platform/audit-log'), expect.anything()));
  });

  it('shows a loading (skeleton-row) state while entries load, with no rendered entries yet', () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    global.fetch = jest.fn().mockReturnValue(new Promise(() => undefined));

    renderPage();

    expect(screen.getByTestId('audit-log-table')).toBeInTheDocument();
    expect(screen.queryByText('stewardship.transaction.verify')).not.toBeInTheDocument();
  });

  it('renders loaded entries in the table, including a DENY-effect row and a NULL-actor row', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        entry(),
        entry({
          id: 'entry-2',
          branchId: null,
          actorUserId: null,
          action: 'auth.token.verify',
          effect: 'DENY',
          resourceType: null,
          resourceId: null,
          reason: 'Token expired',
        }),
      ],
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('audit-log-table')).toBeInTheDocument());
    expect(screen.getByText('stewardship.transaction.verify')).toBeInTheDocument();
    expect(screen.getByText('ALLOW')).toBeInTheDocument();
    expect(screen.getByText('auth.token.verify')).toBeInTheDocument();
    expect(screen.getByText('DENY')).toBeInTheDocument();
    expect(screen.getByText('Unknown (unauthenticated request)')).toBeInTheDocument();
    expect(screen.getByText('Token expired')).toBeInTheDocument();
  });

  it('shows an empty state when no entries exist yet', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No audit log entries yet')).toBeInTheDocument());
  });

  it("shows a retryable error state for a denied role's real 403 (e.g. structurally-unreachable BACENTA_LEADER)", async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "Resource is outside the actor's OWN_GROUP scope for 'platform.audit_log.read'" }),
    });

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load the Audit Log")).toBeInTheDocument());
  });

  it('retries the fetch when the retry action is used after an error', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ message: 'Internal server error' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [entry()] });
    global.fetch = fetchMock;

    renderPage();
    await waitFor(() => expect(screen.getByText("Couldn't load the Audit Log")).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(screen.getByTestId('audit-log-table')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
