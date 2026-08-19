import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { TreasurerInsightsView } from './TreasurerInsightsView';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actorWithRole(role: string, extra: Record<string, unknown> = {}) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'person-1', role, branchId: 'branch-1', branchName: 'River of Life HQ', ...extra },
    },
  };
}

function trendResult(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    from: '2026-03-01T00:00:00.000Z',
    to: '2026-09-01T00:00:00.000Z',
    buckets: [{ bucketStart: '2026-08-01T00:00:00.000Z', bucketEnd: '2026-09-01T00:00:00.000Z', label: 'Aug 2026', totalAmountMinor: '100000', byType: { OFFERING: '60000', TITHE: '40000' } }],
    unattributedAmountMinor: '0',
    unmappedGatheringTypes: [],
    ...overrides,
  };
}

function renderView() {
  return render(
    <ThemeProvider>
      <TreasurerInsightsView />
    </ThemeProvider>,
  );
}

beforeEach(() => mockUseAuth.mockReturnValue(actorWithRole('TREASURER')));
afterEach(() => jest.clearAllMocks());

describe('[Milestone D] TreasurerInsightsView', () => {
  it('defaults to monthly granularity and the "All" category, fetching accordingly', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => trendResult() });
    global.fetch = fetchMock;

    renderView();
    await waitFor(() => expect(screen.getByTestId('treasurer-insights-line-chart')).toBeInTheDocument());

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('granularity=month');
    expect(url).toContain('count=6');
    expect(url).not.toContain('gatheringCategory');
    expect(screen.getByRole('button', { name: 'Monthly' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('refetches with granularity=week and count=8 when Weekly is clicked', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => trendResult() });
    global.fetch = fetchMock;

    renderView();
    await waitFor(() => expect(screen.getByTestId('treasurer-insights-line-chart')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Weekly' }));

    await waitFor(() => {
      const lastUrl = fetchMock.mock.calls[fetchMock.mock.calls.length - 1][0] as string;
      expect(lastUrl).toContain('granularity=week');
      expect(lastUrl).toContain('count=8');
    });
  });

  it('refetches with gatheringCategory=BACENTA_MEETING when the Bacenta filter is clicked', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => trendResult() });
    global.fetch = fetchMock;

    renderView();
    await waitFor(() => expect(screen.getByTestId('treasurer-insights-line-chart')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Bacenta' }));

    await waitFor(() => {
      const lastUrl = fetchMock.mock.calls[fetchMock.mock.calls.length - 1][0] as string;
      expect(lastUrl).toContain('gatheringCategory=BACENTA_MEETING');
    });
  });

  it('shows an honest empty state, not a fabricated flat-line chart, when every bucket is zero', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => trendResult({ buckets: [{ bucketStart: '2026-08-01T00:00:00.000Z', bucketEnd: '2026-09-01T00:00:00.000Z', label: 'Aug 2026', totalAmountMinor: '0', byType: {} }] }),
    });

    renderView();

    await waitFor(() => expect(screen.getByText('No giving recorded')).toBeInTheDocument());
    expect(screen.queryByTestId('treasurer-insights-line-chart')).not.toBeInTheDocument();
  });

  it('shows a retryable ErrorState, never fabricated numbers, when the trend fails to load', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ message: 'Internal error' }) });

    renderView();

    await waitFor(() => expect(screen.getByText("Couldn't load the giving trend")).toBeInTheDocument());
    expect(screen.queryByTestId('metric-insights-total')).not.toBeInTheDocument();
  });

  it('discloses unattributed giving explicitly rather than silently dropping it', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => trendResult({ unattributedAmountMinor: '5000' }) });

    renderView();

    await waitFor(() => expect(screen.getByTestId('unattributed-giving-card')).toBeInTheDocument());
    expect(screen.getByTestId('unattributed-giving-card')).toHaveTextContent('GHS 50.00');
  });

  it('discloses unmapped Gathering types explicitly when a category filter excludes them', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => trendResult({ unmappedGatheringTypes: ['SPECIAL_SERVICE'] }) });

    renderView();

    await waitFor(() => expect(screen.getByTestId('unmapped-gathering-types-card')).toBeInTheDocument());
    expect(screen.getByTestId('unmapped-gathering-types-card')).toHaveTextContent('SPECIAL_SERVICE');
  });

  it('does not render the unattributed/unmapped disclosure cards when there is nothing to disclose', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => trendResult() });

    renderView();

    await waitFor(() => expect(screen.getByTestId('treasurer-insights-line-chart')).toBeInTheDocument());
    expect(screen.queryByTestId('unattributed-giving-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('unmapped-gathering-types-card')).not.toBeInTheDocument();
  });
});
