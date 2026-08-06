import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { GatheringsListPage } from './GatheringsListPage';

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

function gathering(overrides: Record<string, unknown> = {}) {
  return {
    id: 'g-1',
    branchId: 'branch-1',
    ownerGroupId: null,
    seriesId: null,
    type: 'SUNDAY_SERVICE',
    scheduledStart: new Date('2020-01-01T09:00:00.000Z').toISOString(),
    scheduledEnd: new Date('2020-01-01T11:00:00.000Z').toISOString(),
    venue: 'Main Auditorium',
    status: 'COMPLETED',
    config: null,
    createdByPersonId: 'admin-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <ThemeProvider>
      <GatheringsListPage />
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('GatheringsListPage', () => {
  it('renders the role-scoped list with type, status, venue, and a completeness badge for a past Gathering', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/attendance-records/completeness')) {
        return Promise.resolve({ ok: true, json: async () => ({ incomplete: false, reason: 'already recorded' }) });
      }
      if (url.includes('/gatherings')) {
        return Promise.resolve({ ok: true, json: async () => [gathering()] });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('gatherings-list-card')).toBeInTheDocument());
    expect(screen.getByText('SUNDAY_SERVICE')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText(/Main Auditorium/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Attendance recorded')).toBeInTheDocument());
  });

  it('does not show a completeness badge for an upcoming Gathering', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [gathering({ id: 'g-2', scheduledStart: future, scheduledEnd: null, status: 'SCHEDULED' })],
    });

    renderPage();

    await waitFor(() => expect(screen.getByText('SUNDAY_SERVICE')).toBeInTheDocument());
    expect(screen.queryByText(/Attendance/)).not.toBeInTheDocument();
  });

  it('sends the Bacenta Leader own-group scope as an ownerGroupId query param', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('ownerGroupId=bacenta-1');
  });

  it('sends the trimmed type filter as a query param', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    renderPage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText('Filter by type'), { target: { value: '  SUNDAY_SERVICE  ' } });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [url] = fetchMock.mock.calls[1] as [string];
    expect(url).toContain(`type=${encodeURIComponent('SUNDAY_SERVICE')}`);
  });

  it('shows an empty state when no Gatherings are in scope', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No Gatherings found')).toBeInTheDocument());
  });

  it('shows a retryable error state when the request fails', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load Gatherings")).toBeInTheDocument());
  });
});
