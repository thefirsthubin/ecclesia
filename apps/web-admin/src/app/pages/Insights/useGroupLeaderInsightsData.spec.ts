import { renderHook, waitFor } from '@testing-library/react';

import { summarizeNumberSeries, useGroupAttendanceTrend, useGroupGivingTrend, useGroupMembershipTrend } from './useGroupLeaderInsightsData';
import type { GroupTrendFilter } from './useGroupLeaderInsightsData';

const FILTER: GroupTrendFilter = { granularity: 'week', count: 8 };

describe('[Milestone D, Portals 3 & 4] summarizeNumberSeries', () => {
  it('reports null latest/direction/growth for an empty series', () => {
    expect(summarizeNumberSeries([])).toEqual({ latest: null, direction: null, growthPercent: null });
  });

  it('reports the latest value but no direction/growth with only one point', () => {
    expect(summarizeNumberSeries([12])).toEqual({ latest: 12, direction: null, growthPercent: null });
  });

  it('reports "up" direction and a real growth percentage', () => {
    const summary = summarizeNumberSeries([10, 15]);
    expect(summary.direction).toBe('up');
    expect(summary.growthPercent).toBe(50);
  });

  it('reports "down" direction and a real negative growth percentage', () => {
    const summary = summarizeNumberSeries([20, 10]);
    expect(summary.direction).toBe('down');
    expect(summary.growthPercent).toBe(-50);
  });

  it('reports "flat" direction when the latest point equals the prior one', () => {
    const summary = summarizeNumberSeries([10, 10]);
    expect(summary.direction).toBe('flat');
    expect(summary.growthPercent).toBe(0);
  });

  it('reports null growthPercent rather than dividing by zero when the prior point is 0', () => {
    const summary = summarizeNumberSeries([0, 5]);
    expect(summary.direction).toBe('up');
    expect(summary.growthPercent).toBeNull();
  });
});

describe('[Milestone D, Portals 3 & 4] useGroupAttendanceTrend', () => {
  afterEach(() => jest.clearAllMocks());

  it('builds the query string with groupId, granularity/count, and gatheringCategory', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ from: '', to: '', buckets: [], byGroup: [], unmappedGatheringTypes: [] }) });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useGroupAttendanceTrend('token', 'bacenta-1', FILTER, 'SUNDAY'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('groupId=bacenta-1');
    expect(url).toContain('granularity=week');
    expect(url).toContain('count=8');
    expect(url).toContain('gatheringCategory=SUNDAY');
  });

  it('rejects rather than fetching when there is no groupId', async () => {
    global.fetch = jest.fn();
    const { result } = renderHook(() => useGroupAttendanceTrend('token', undefined, FILTER));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('[Milestone D, Portals 3 & 4] useGroupGivingTrend', () => {
  afterEach(() => jest.clearAllMocks());

  it('builds the query string with groupId and omits gatheringCategory when not given', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ from: '', to: '', buckets: [], unattributedAmountMinor: '0', unmappedGatheringTypes: [] }) });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useGroupGivingTrend('token', 'bacenta-1', FILTER));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('groupId=bacenta-1');
    expect(url).not.toContain('gatheringCategory');
  });
});

describe('[Milestone D, Portals 3 & 4] useGroupMembershipTrend', () => {
  afterEach(() => jest.clearAllMocks());

  it('builds the query string with groupId and granularity/count', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        from: '',
        to: '',
        registeredPeopleSeries: [],
        membersSeries: [],
        snapshot: {
          registeredPeopleCount: 0,
          membersCount: 0,
          activeMembersCount: 0,
          inactiveMembersCount: 0,
          activeMemberWindowWeeks: 8,
          firstTimersCount: 0,
          visitorsCount: 0,
          peopleWithoutBacentaCount: 0,
          bacentaMembershipCount: 0,
          basontaMembershipCount: 0,
        },
      }),
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useGroupMembershipTrend('token', 'bacenta-1', FILTER));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('groupId=bacenta-1');
    expect(url).toContain('granularity=week');
  });

  it('rejects rather than fetching when there is no access token', async () => {
    global.fetch = jest.fn();
    const { result } = renderHook(() => useGroupMembershipTrend(undefined, 'bacenta-1', FILTER));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
