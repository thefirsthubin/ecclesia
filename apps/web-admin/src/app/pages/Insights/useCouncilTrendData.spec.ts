import { renderHook, waitFor } from '@testing-library/react';

import { useBranches, useCouncilAttendanceTrend, useCouncilGivingTrend, useCouncilMembershipTrend } from './useCouncilTrendData';
import type { CouncilTrendFilter } from './useCouncilTrendData';

const FILTER: CouncilTrendFilter = { granularity: 'week', count: 1 };

describe('[Milestone D, Portal 7] useCouncilGivingTrend', () => {
  afterEach(() => jest.clearAllMocks());

  it('requests council=true and normalizes the councilBranches shape to an array', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ councilBranches: [{ branchId: 'branch-1', from: '', to: '', buckets: [], unattributedAmountMinor: '0', unmappedGatheringTypes: [] }] }),
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useCouncilGivingTrend('token', FILTER));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('council=true');
    if (result.current.status !== 'success') throw new Error('expected success');
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].branchId).toBe('branch-1');
  });

  it('wraps a bare single-branch response into a one-element array (defensive, not the expected shape for a COUNCIL actor)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ branchId: 'branch-1', from: '', to: '', buckets: [], unattributedAmountMinor: '0', unmappedGatheringTypes: [] }),
    });

    const { result } = renderHook(() => useCouncilGivingTrend('token', FILTER));
    await waitFor(() => expect(result.current.status).toBe('success'));

    if (result.current.status !== 'success') throw new Error('expected success');
    expect(result.current.data).toEqual([{ branchId: 'branch-1', from: '', to: '', buckets: [], unattributedAmountMinor: '0', unmappedGatheringTypes: [] }]);
  });

  it('rejects rather than fetching when there is no access token', async () => {
    global.fetch = jest.fn();
    const { result } = renderHook(() => useCouncilGivingTrend(undefined, FILTER));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('[Milestone D, Portal 7] useCouncilAttendanceTrend', () => {
  afterEach(() => jest.clearAllMocks());

  it('requests council=true and normalizes the councilBranches shape', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ councilBranches: [{ branchId: 'branch-1', from: '', to: '', buckets: [], byGroup: [], unmappedGatheringTypes: [] }] }),
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useCouncilAttendanceTrend('token', FILTER));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('council=true');
  });
});

describe('[Milestone D, Portal 7] useCouncilMembershipTrend', () => {
  afterEach(() => jest.clearAllMocks());

  it('requests council=true and normalizes the councilBranches shape', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        councilBranches: [
          {
            branchId: 'branch-1',
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
          },
        ],
      }),
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useCouncilMembershipTrend('token', FILTER));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('council=true');
  });
});

describe('[Post-Milestone D] useBranches', () => {
  afterEach(() => jest.clearAllMocks());

  it('GETs /platform/branches', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 'branch-1', name: 'Headquarters' }] });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useBranches('token'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/platform/branches');
    if (result.current.status !== 'success') throw new Error('expected success');
    expect(result.current.data).toEqual([{ id: 'branch-1', name: 'Headquarters' }]);
  });

  it('rejects rather than fetching when there is no access token', async () => {
    global.fetch = jest.fn();
    const { result } = renderHook(() => useBranches(undefined));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
