import { renderHook, waitFor } from '@testing-library/react';

import { useGivingBreakdown } from './useGivingBreakdown';

// `mostRecentSundayIso` itself is tested in `../../lib/date-utils.spec.ts`,
// where it now lives (extracted once `useAdminDashboardData.ts` became its
// second real consumer). This file tests only this hook's own fetch
// composition, which uses that shared helper.

function givingTrendResult(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    from: '2026-08-16T00:00:00.000Z',
    to: '2026-08-23T00:00:00.000Z',
    buckets: [
      {
        bucketStart: '2026-08-16T00:00:00.000Z',
        bucketEnd: '2026-08-23T00:00:00.000Z',
        label: '2026-08-16',
        totalAmountMinor: '10000',
        byType: { OFFERING: '6000', TITHE: '4000' },
      },
    ],
    unattributedAmountMinor: '0',
    unmappedGatheringTypes: [],
    branchId: 'branch-1',
    ...overrides,
  };
}

afterEach(() => jest.clearAllMocks());

describe('[Milestone D] useGivingBreakdown', () => {
  it('fetches all six giving-trend windows anchored to the same endingAt (most recent Sunday), each with its own gatheringCategory', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => givingTrendResult() });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useGivingBreakdown('token'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const urls = fetchMock.mock.calls.map((call) => call[0] as string);
    expect(urls).toHaveLength(6);
    expect(urls.some((url) => url.includes('/insights/giving-trend') && !url.includes('gatheringCategory'))).toBe(true);
    expect(urls.filter((url) => url.includes('gatheringCategory=SUNDAY'))).toHaveLength(1);
    expect(urls.filter((url) => url.includes('gatheringCategory=MIDWEEK'))).toHaveLength(1);
    expect(urls.filter((url) => url.includes('gatheringCategory=BACENTA_MEETING'))).toHaveLength(1);
    expect(urls.filter((url) => url.includes('gatheringCategory=BASONTA_MEETING'))).toHaveLength(1);
    expect(urls.filter((url) => url.includes('gatheringCategory=OTHER'))).toHaveLength(1);

    // Every call shares the exact same endingAt - one real reporting week.
    const endingAtValues = urls.map((url) => new URL(url, 'http://localhost').searchParams.get('endingAt'));
    expect(new Set(endingAtValues).size).toBe(1);
  });

  it('maps each fetched result onto its named field in the returned breakdown', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('gatheringCategory=SUNDAY')) return Promise.resolve({ ok: true, json: async () => givingTrendResult({ unattributedAmountMinor: '111' }) });
      if (url.includes('gatheringCategory=MIDWEEK')) return Promise.resolve({ ok: true, json: async () => givingTrendResult({ unattributedAmountMinor: '222' }) });
      if (url.includes('gatheringCategory=BACENTA_MEETING')) return Promise.resolve({ ok: true, json: async () => givingTrendResult({ unattributedAmountMinor: '333' }) });
      if (url.includes('gatheringCategory=BASONTA_MEETING')) return Promise.resolve({ ok: true, json: async () => givingTrendResult({ unattributedAmountMinor: '444' }) });
      if (url.includes('gatheringCategory=OTHER')) return Promise.resolve({ ok: true, json: async () => givingTrendResult({ unattributedAmountMinor: '666' }) });
      return Promise.resolve({ ok: true, json: async () => givingTrendResult({ unattributedAmountMinor: '555' }) });
    });

    const { result } = renderHook(() => useGivingBreakdown('token'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    if (result.current.status !== 'success') throw new Error('expected success');
    expect(result.current.data.branch.unattributedAmountMinor).toBe('555');
    expect(result.current.data.sunday.unattributedAmountMinor).toBe('111');
    expect(result.current.data.midweek.unattributedAmountMinor).toBe('222');
    expect(result.current.data.bacenta.unattributedAmountMinor).toBe('333');
    expect(result.current.data.basonta.unattributedAmountMinor).toBe('444');
    expect(result.current.data.other.unattributedAmountMinor).toBe('666');
  });

  it('rejects rather than fetching when there is no access token', async () => {
    global.fetch = jest.fn();

    const { result } = renderHook(() => useGivingBreakdown(undefined));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
