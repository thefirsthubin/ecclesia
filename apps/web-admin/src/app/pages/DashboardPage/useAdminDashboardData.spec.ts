import { renderHook, waitFor } from '@testing-library/react';

import { useAdminDashboardData } from './useAdminDashboardData';

function membershipTrendResult(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    branchId: 'branch-1',
    from: '2026-01-01T00:00:00.000Z',
    to: '2026-08-01T00:00:00.000Z',
    registeredPeopleSeries: [],
    membersSeries: [],
    snapshot: {
      registeredPeopleCount: 500,
      membersCount: 420,
      activeMembersCount: 300,
      inactiveMembersCount: 120,
      activeMemberWindowWeeks: 8,
      firstTimersCount: 5,
      visitorsCount: 10,
      peopleWithoutBacentaCount: 15,
      bacentaMembershipCount: 400,
      basontaMembershipCount: 150,
    },
    ...overrides,
  };
}

function attendanceTrendResult(presentCount: number) {
  return {
    branchId: 'branch-1',
    from: '2026-08-16T00:00:00.000Z',
    to: '2026-08-23T00:00:00.000Z',
    buckets: [{ bucketStart: '2026-08-16T00:00:00.000Z', bucketEnd: '2026-08-23T00:00:00.000Z', label: '2026-08-16', presentCount }],
    byGroup: [],
    unmappedGatheringTypes: [],
  };
}

afterEach(() => jest.clearAllMocks());

describe('[Milestone D] useAdminDashboardData', () => {
  it('fetches membership-trend once and attendance-trend three times, each with its own gatheringCategory, all anchored to the same endingAt', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/membership-trend')) return Promise.resolve({ ok: true, json: async () => membershipTrendResult() });
      return Promise.resolve({ ok: true, json: async () => attendanceTrendResult(0) });
    });

    const { result } = renderHook(() => useAdminDashboardData('token'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const fetchMock = global.fetch as jest.Mock;
    const urls = fetchMock.mock.calls.map((call) => call[0] as string);
    expect(urls.filter((url) => url.includes('/insights/membership-trend'))).toHaveLength(1);
    expect(urls.filter((url) => url.includes('/insights/attendance-trend'))).toHaveLength(3);
    expect(urls.filter((url) => url.includes('gatheringCategory=SUNDAY'))).toHaveLength(1);
    expect(urls.filter((url) => url.includes('gatheringCategory=BACENTA_MEETING'))).toHaveLength(1);
    expect(urls.filter((url) => url.includes('gatheringCategory=BASONTA_MEETING'))).toHaveLength(1);

    const attendanceUrls = urls.filter((url) => url.includes('/insights/attendance-trend'));
    const endingAtValues = attendanceUrls.map((url) => new URL(url, 'http://localhost').searchParams.get('endingAt'));
    expect(new Set(endingAtValues).size).toBe(1);
  });

  it('maps each attendance category fetch onto its own distinct field - never fabricated, never cross-contaminated', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/membership-trend')) return Promise.resolve({ ok: true, json: async () => membershipTrendResult() });
      if (url.includes('gatheringCategory=SUNDAY')) return Promise.resolve({ ok: true, json: async () => attendanceTrendResult(111) });
      if (url.includes('gatheringCategory=BACENTA_MEETING')) return Promise.resolve({ ok: true, json: async () => attendanceTrendResult(222) });
      if (url.includes('gatheringCategory=BASONTA_MEETING')) return Promise.resolve({ ok: true, json: async () => attendanceTrendResult(333) });
      return Promise.resolve({ ok: true, json: async () => attendanceTrendResult(0) });
    });

    const { result } = renderHook(() => useAdminDashboardData('token'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    if (result.current.status !== 'success') throw new Error('expected success');
    expect(result.current.data.sundayAttendance.buckets[0].presentCount).toBe(111);
    expect(result.current.data.bacentaAttendance.buckets[0].presentCount).toBe(222);
    expect(result.current.data.basontaAttendance.buckets[0].presentCount).toBe(333);
    expect(result.current.data.membership.snapshot.registeredPeopleCount).toBe(500);
    expect(result.current.data.membership.snapshot.activeMembersCount).toBe(300);
    expect(result.current.data.membership.snapshot.inactiveMembersCount).toBe(120);
  });

  it('rejects rather than fetching when there is no access token', async () => {
    global.fetch = jest.fn();

    const { result } = renderHook(() => useAdminDashboardData(undefined));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
