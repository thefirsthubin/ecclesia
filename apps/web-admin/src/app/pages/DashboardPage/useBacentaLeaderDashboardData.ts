import type { AttendanceTrendResultDto, GivingTrendResultDto } from '@ecclesia/contracts';

import { apiGet } from '../../lib/api-client';
import { mostRecentSundayIso } from '../../lib/date-utils';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

export interface BacentaLeaderDashboardData {
  weekLabel: string;
  from: string;
  to: string;
  /** Total members of this Bacenta - `usePeopleList({ groupId })`'s own
   * count, fetched here rather than via a second hook so this dashboard
   * has one single `AsyncDataResult` to branch on. */
  memberCount: number;
  /** This week's `SUNDAY`-category attendance, narrowed to this Bacenta -
   * `AttendanceTrendService`'s `groupId` scoping counts a record when the
   * Gathering's owner group matches OR the attendee is a current member of
   * this Bacenta (Milestone C.1.4's attendance-scope fix), so Branch-wide
   * Sunday services correctly count this Bacenta's own attendees. */
  sundayAttendance: AttendanceTrendResultDto;
  /** This week's `BACENTA_MEETING`-category attendance for this Bacenta. */
  bacentaMeetingAttendance: AttendanceTrendResultDto;
  /** This week's giving recorded against this Bacenta
   * (`sourceGroupId = groupId`, `GivingTrendService`'s own direct
   * attribution filter - not an attendee/roster fallback the way
   * attendance is). */
  giving: GivingTrendResultDto;
}

async function fetchAttendanceTrend(
  accessToken: string,
  signal: AbortSignal,
  endingAt: string,
  groupId: string,
  gatheringCategory: 'SUNDAY' | 'BACENTA_MEETING',
): Promise<AttendanceTrendResultDto> {
  const params = new URLSearchParams({ granularity: 'week', count: '1', endingAt, groupId, gatheringCategory });
  return (await apiGet<AttendanceTrendResultDto & { branchId: string }>(`/insights/attendance-trend?${params.toString()}`, {
    authToken: accessToken,
    signal,
  })) as AttendanceTrendResultDto;
}

async function fetchGivingTrend(accessToken: string, signal: AbortSignal, endingAt: string, groupId: string): Promise<GivingTrendResultDto> {
  const params = new URLSearchParams({ granularity: 'week', count: '1', endingAt, groupId, gatheringCategory: 'BACENTA_MEETING' });
  return (await apiGet<GivingTrendResultDto & { branchId: string }>(`/insights/giving-trend?${params.toString()}`, {
    authToken: accessToken,
    signal,
  })) as GivingTrendResultDto;
}

/**
 * `[Milestone D — Portal Experiences, Portal 3: Bacenta Leader]` Dashboard
 * spec: "total Bacenta members, Sunday attendance, Bacenta meeting
 * attendance, Bacenta giving." Composes existing Milestone C read models,
 * scoped to this one Bacenta via `groupId` - no new backend capability:
 *
 * - `GET /people?groupId=` (`people.person.read`, OWN_GROUP) - member count.
 * - `GET /insights/attendance-trend` (`gatherings.attendance.read`,
 *   OWN_GROUP) x2, `SUNDAY` and `BACENTA_MEETING`.
 * - `GET /insights/giving-trend` (`stewardship.transaction.read`,
 *   OWN_GROUP), `BACENTA_MEETING`.
 *
 * Same `mostRecentSundayIso`-anchored single-week window every other
 * portal dashboard uses, so "this week" means the same seven days
 * everywhere in the product.
 */
export function useBacentaLeaderDashboardData(accessToken: string | undefined, groupId: string | undefined): AsyncDataResult<BacentaLeaderDashboardData> {
  return useAsyncData<BacentaLeaderDashboardData>(
    async (signal) => {
      if (!accessToken || !groupId) return Promise.reject(new Error('not authenticated'));
      const endingAt = mostRecentSundayIso(new Date());

      const [members, sundayAttendance, bacentaMeetingAttendance, giving] = await Promise.all([
        apiGet<{ id: string }[]>(`/people?groupId=${groupId}`, { authToken: accessToken, signal }),
        fetchAttendanceTrend(accessToken, signal, endingAt, groupId, 'SUNDAY'),
        fetchAttendanceTrend(accessToken, signal, endingAt, groupId, 'BACENTA_MEETING'),
        fetchGivingTrend(accessToken, signal, endingAt, groupId),
      ]);

      return {
        weekLabel: sundayAttendance.from,
        from: sundayAttendance.from,
        to: sundayAttendance.to,
        memberCount: members.length,
        sundayAttendance,
        bacentaMeetingAttendance,
        giving,
      };
    },
    [accessToken, groupId],
  );
}
