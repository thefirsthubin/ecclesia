import { renderHook, waitFor } from '@testing-library/react';

import { summarizeTrend, useTreasurerInsightsData } from './useTreasurerInsightsData';
import type { GivingTrendFilter } from './useTreasurerInsightsData';

function bucket(totalAmountMinor: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    bucketStart: '2026-06-01T00:00:00.000Z',
    bucketEnd: '2026-07-01T00:00:00.000Z',
    label: 'Jun 2026',
    totalAmountMinor,
    byType: { OFFERING: totalAmountMinor, TITHE: '0' },
    ...overrides,
  };
}

function result(buckets: ReturnType<typeof bucket>[]) {
  return { from: '2026-01-01T00:00:00.000Z', to: '2026-07-01T00:00:00.000Z', buckets, unattributedAmountMinor: '0', unmappedGatheringTypes: [] };
}

describe('[Milestone D] summarizeTrend', () => {
  it('sums every bucket total using BigInt arithmetic, never float', () => {
    const summary = summarizeTrend(result([bucket('100000000000'), bucket('1')]));
    expect(summary.totalMinor).toBe('100000000001');
  });

  it('reports the latest bucket, null direction/growth, with zero buckets', () => {
    const summary = summarizeTrend(result([]));
    expect(summary.totalMinor).toBe('0');
    expect(summary.latestMinor).toBeNull();
    expect(summary.direction).toBeNull();
    expect(summary.growthPercent).toBeNull();
  });

  it('reports the latest bucket but no direction/growth with only one bucket', () => {
    const summary = summarizeTrend(result([bucket('5000')]));
    expect(summary.latestMinor).toBe('5000');
    expect(summary.direction).toBeNull();
    expect(summary.growthPercent).toBeNull();
  });

  it('reports direction "up" and a real growth percentage when the latest bucket is higher', () => {
    const summary = summarizeTrend(result([bucket('10000'), bucket('12000')]));
    expect(summary.direction).toBe('up');
    expect(summary.growthPercent).toBe(20);
  });

  it('reports direction "down" and a real (negative) growth percentage when the latest bucket is lower', () => {
    const summary = summarizeTrend(result([bucket('10000'), bucket('7500')]));
    expect(summary.direction).toBe('down');
    expect(summary.growthPercent).toBe(-25);
  });

  it('reports direction "flat" when the latest bucket exactly equals the prior one', () => {
    const summary = summarizeTrend(result([bucket('10000'), bucket('10000')]));
    expect(summary.direction).toBe('flat');
    expect(summary.growthPercent).toBe(0);
  });

  it('reports null growthPercent rather than dividing by zero when the prior bucket is 0', () => {
    const summary = summarizeTrend(result([bucket('0'), bucket('5000')]));
    expect(summary.direction).toBe('up');
    expect(summary.growthPercent).toBeNull();
  });
});

describe('[Milestone D] useTreasurerInsightsData', () => {
  afterEach(() => jest.clearAllMocks());

  it('builds the query string from granularity/count/gatheringCategory', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => result([bucket('1000')]) });
    global.fetch = fetchMock;
    const filter: GivingTrendFilter = { granularity: 'week', count: 8, gatheringCategory: 'SUNDAY' };

    const { result: hookResult } = renderHook(() => useTreasurerInsightsData('token', filter));
    await waitFor(() => expect(hookResult.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('granularity=week');
    expect(url).toContain('count=8');
    expect(url).toContain('gatheringCategory=SUNDAY');
  });

  it('omits gatheringCategory from the query string when not given (the "All" filter)', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => result([]) });
    global.fetch = fetchMock;
    const filter: GivingTrendFilter = { granularity: 'month', count: 6 };

    const { result: hookResult } = renderHook(() => useTreasurerInsightsData('token', filter));
    await waitFor(() => expect(hookResult.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).not.toContain('gatheringCategory');
  });

  it('rejects rather than fetching when there is no access token', async () => {
    global.fetch = jest.fn();
    const filter: GivingTrendFilter = { granularity: 'month', count: 6 };

    const { result: hookResult } = renderHook(() => useTreasurerInsightsData(undefined, filter));
    await waitFor(() => expect(hookResult.current.status).toBe('error'));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
