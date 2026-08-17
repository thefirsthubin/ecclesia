import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { BranchGatheringsView } from './BranchGatheringsView';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actorWithRole(role: string, extra: Record<string, unknown> = {}) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'person-1', role, branchId: 'branch-1', branchName: 'Headquarters', ...extra },
    },
  };
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function gathering(overrides: Record<string, unknown> = {}) {
  return {
    id: 'g-1',
    branchId: 'branch-1',
    ownerGroupId: null,
    seriesId: null,
    type: 'SUNDAY_SERVICE',
    scheduledStart: daysFromNow(-3),
    scheduledEnd: null,
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
      <BranchGatheringsView />
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

/**
 * `[Branch Pastor portal, Gatherings sprint]` Locks in the two properties
 * this view exists to fix over the shared `GatheringsListPage`: (1) real
 * categorization into Bacenta Meetings / Sunday Services / Other Branch
 * Services, driven by the actual observed `type` values
 * (`CELL_MEETING`/`SUNDAY_SERVICE`), with a genuinely empty "Other" bucket
 * shown honestly rather than fabricated; and (2) a real look-back window
 * (`from`/`to` sent on every request) so genuinely historical Gatherings
 * are reachable at all - the shared page's own hook never sent either
 * param, so its "Past Gatherings" table could only ever show things
 * between right-now and its forward window.
 */
describe('BranchGatheringsView', () => {
  it('sends a from/to window on every request, unlike the shared GatheringsListPage', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1'] }));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('from=');
    expect(url).toContain('to=');
    // Branch-wide, per the real BRANCH-scope grant - no ownerGroupId narrowing.
    expect(url).not.toContain('ownerGroupId=');
  });

  it('groups a Bacenta meeting, a Sunday Service, and an unrecognized type into their own real sections', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/gatherings?')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            gathering({ id: 'g-cell', type: 'CELL_MEETING', ownerGroupId: 'bacenta-1', scheduledStart: daysFromNow(-2) }),
            gathering({ id: 'g-sunday', type: 'SUNDAY_SERVICE', scheduledStart: daysFromNow(-1) }),
            gathering({ id: 'g-other', type: 'PRAYER_MEETING', scheduledStart: daysFromNow(-4) }),
          ],
        });
      }
      if (url.includes('/groups/bacenta-1')) {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'bacenta-1', name: 'Grace Bacenta', type: 'PASTORAL_CARE' }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderPage();

    await waitFor(() => expect(screen.getByText('Bacenta Meetings')).toBeInTheDocument());
    expect(screen.getByText('Sunday Services')).toBeInTheDocument();
    expect(screen.getByText('Other Branch Services')).toBeInTheDocument();

    const bacentaSection = within(screen.getByTestId('gathering-section-bacenta-meetings'));
    await waitFor(() => expect(bacentaSection.getByText('Grace Bacenta')).toBeInTheDocument());

    expect(screen.getByTestId('gathering-section-sunday-services')).toBeInTheDocument();
    expect(screen.getByTestId('gathering-section-other-services')).toBeInTheDocument();
  });

  it('shows an honest empty state for Other Branch Services when only real categories have data', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/gatherings?')) {
        return Promise.resolve({ ok: true, json: async () => [gathering({ id: 'g-sunday', type: 'SUNDAY_SERVICE' })] });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderPage();

    await waitFor(() => expect(screen.getByText('Sunday Services')).toBeInTheDocument());
    expect(screen.getByText('None recorded yet')).toBeInTheDocument();
    expect(screen.queryByTestId('gathering-section-other-services')).not.toBeInTheDocument();
  });

  it('shows the Branch-wide empty state when nothing at all is in the window', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No Gatherings in this window')).toBeInTheDocument());
  });

  it('shows a verified attendance badge for a past Gathering and "Upcoming" for a future one, not a fabricated status', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/gatherings?')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            gathering({ id: 'g-past', type: 'SUNDAY_SERVICE', scheduledStart: daysFromNow(-2), scheduledEnd: daysFromNow(-2) }),
            gathering({ id: 'g-future', type: 'SUNDAY_SERVICE', scheduledStart: daysFromNow(5), status: 'SCHEDULED' }),
          ],
        });
      }
      if (url.includes('/attendance-records/completeness')) {
        return Promise.resolve({ ok: true, json: async () => ({ incomplete: false, reason: 'ok' }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderPage();

    await waitFor(() => expect(screen.getByText('Attendance recorded')).toBeInTheDocument());
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
  });

  it('creates a Gathering with the picked type, refetching the list on success', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    let listCallCount = 0;
    const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/gatherings') && init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => gathering({ id: 'g-new', type: 'SUNDAY_SERVICE' }) });
      }
      if (url.includes('/gatherings?')) {
        listCallCount += 1;
        return Promise.resolve({ ok: true, json: async () => (listCallCount === 1 ? [] : [gathering({ id: 'g-new' })]) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    renderPage();
    await waitFor(() => expect(screen.getByText('No Gatherings in this window')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Create Gathering' }));
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'SUNDAY_SERVICE' } });
    fireEvent.change(screen.getByLabelText('Scheduled start'), { target: { value: '2026-02-01T10:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm create' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/gatherings'),
        expect.objectContaining({ method: 'POST', body: expect.stringContaining('"type":"SUNDAY_SERVICE"') }),
      ),
    );
  });

  /**
   * `[Whole Ecclesia layout rebalance]` The summary cards + leaderboard
   * this pass adds - real data only, no invented scoring system. "Total
   * Gatherings"/"Bacenta Meetings" come from the same already-fetched
   * list; "Attendance This Month" comes from the real
   * `GET /insights/branch-dashboard-summary` (`attendanceTotal`, already
   * reachable for this role); the leaderboard reuses the exact same
   * cluster-scoped Church Pulse call `BranchInsightsView`'s own "Bacenta
   * Health" section already established, sorted highest-first.
   */
  describe('summary cards and Bacenta Leaderboard', () => {
    it('shows real summary figures derived from the fetched Gatherings list and Branch summary', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1'] }));
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/gatherings?')) {
          return Promise.resolve({
            ok: true,
            json: async () => [
              gathering({ id: 'g-cell', type: 'CELL_MEETING', ownerGroupId: 'bacenta-1', scheduledStart: daysFromNow(-2) }),
              gathering({ id: 'g-sunday', type: 'SUNDAY_SERVICE', scheduledStart: daysFromNow(-1) }),
            ],
          });
        }
        if (url.includes('/insights/branch-dashboard-summary')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              branchId: 'branch-1',
              membersCount: 40,
              membersTrend: 2,
              attendanceTotal: 123,
              attendanceTrend: 5,
              givingTotalMinor: '10000',
              givingTrend: 3,
              growthSeries: { attendance: [], membership: [], giving: [] },
              volunteersCount: 5,
              volunteersTrend: 1,
              bacentaLeaderboard: [],
              engagementTrend: { direction: 'flat', label: 'Flat' },
            }),
          });
        }
        if (url.includes('/insights/cluster-dashboard/bacenta-1')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              branchId: 'branch-1',
              groupId: 'bacenta-1',
              pulseScore: { id: 'p-1', branchId: 'branch-1', scopeType: 'GROUP', scopeId: 'bacenta-1', score: 88, computedAt: new Date().toISOString() },
              alerts: [],
            }),
          });
        }
        if (url.includes('/groups/bacenta-1')) {
          return Promise.resolve({ ok: true, json: async () => ({ id: 'bacenta-1', name: 'Grace Bacenta', type: 'PASTORAL_CARE' }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      renderPage();

      await waitFor(() => expect(screen.getByTestId('gatherings-summary-total')).toHaveTextContent('2'));
      expect(screen.getByTestId('gatherings-summary-bacenta-meetings')).toHaveTextContent('1');
      await waitFor(() => expect(screen.getByTestId('gatherings-summary-attendance')).toHaveTextContent('123'));

      await waitFor(() => expect(within(screen.getByTestId('gatherings-summary-top-bacenta')).getByText('Grace Bacenta')).toBeInTheDocument());
      expect(within(screen.getByTestId('gatherings-summary-top-bacenta')).getByText('88')).toBeInTheDocument();

      expect(screen.getByText('Bacenta Leaderboard')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('ranks multiple Bacentas highest-score-first, with only #1 getting the brand-tinted badge', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1', 'bacenta-2'] }));
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/gatherings?')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/insights/cluster-dashboard/bacenta-1')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ branchId: 'branch-1', groupId: 'bacenta-1', pulseScore: { id: 'p-1', branchId: 'branch-1', scopeType: 'GROUP', scopeId: 'bacenta-1', score: 60, computedAt: new Date().toISOString() }, alerts: [] }),
          });
        }
        if (url.includes('/insights/cluster-dashboard/bacenta-2')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ branchId: 'branch-1', groupId: 'bacenta-2', pulseScore: { id: 'p-2', branchId: 'branch-1', scopeType: 'GROUP', scopeId: 'bacenta-2', score: 92, computedAt: new Date().toISOString() }, alerts: [] }),
          });
        }
        if (url.includes('/groups/bacenta-1')) return Promise.resolve({ ok: true, json: async () => ({ id: 'bacenta-1', name: 'Grace Bacenta', type: 'PASTORAL_CARE' }) });
        if (url.includes('/groups/bacenta-2')) return Promise.resolve({ ok: true, json: async () => ({ id: 'bacenta-2', name: 'Faith Bacenta', type: 'PASTORAL_CARE' }) });
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      renderPage();

      const leaderboard = within(await screen.findByTestId('bacenta-leaderboard-card'));
      await waitFor(() => expect(leaderboard.getByText('Faith Bacenta')).toBeInTheDocument());
      expect(leaderboard.getByText('Grace Bacenta')).toBeInTheDocument();
      expect(leaderboard.getByText('#1')).toBeInTheDocument();
      expect(leaderboard.getByText('#2')).toBeInTheDocument();
      // Faith (92) outranks Grace (60) - #1 is whichever real score is higher, not fetch order.
      expect(leaderboard.getByText('92')).toBeInTheDocument();
      expect(leaderboard.getByText('60')).toBeInTheDocument();
    });

    it('shows an honest empty state when no Bacenta in the cluster has a computed score yet', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: [] }));
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

      renderPage();

      await waitFor(() => expect(screen.getByText('No scores yet')).toBeInTheDocument());
      expect(within(screen.getByTestId('gatherings-summary-top-bacenta')).getByText('Not yet available')).toBeInTheDocument();
    });
  });

  it('requires a custom service name before Confirm create is enabled when "Other Branch Service" is picked', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();
    await waitFor(() => expect(screen.getByText('No Gatherings in this window')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Create Gathering' }));
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'OTHER' } });
    fireEvent.change(screen.getByLabelText('Scheduled start'), { target: { value: '2026-02-01T10:00' } });

    expect(screen.getByRole('button', { name: 'Confirm create' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Service name'), { target: { value: 'PRAYER_MEETING' } });
    expect(screen.getByRole('button', { name: 'Confirm create' })).toBeEnabled();
  });
});
