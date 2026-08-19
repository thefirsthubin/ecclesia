import type { AttendanceTrendResultDto, MembershipTrendResultDto } from '@ecclesia/contracts';

import { apiGet } from '../../lib/api-client';
import { mostRecentSundayIso } from '../../lib/date-utils';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

export interface AdminDashboardData {
  weekLabel: string;
  from: string;
  to: string;
  /** Real, current-moment membership counts - `MembershipTrendService`'s
   * own Phase 5 snapshot (`registeredPeopleCount`/`membersCount`/
   * `activeMembersCount`/`inactiveMembersCount`), not derived here -
   * Portal 2 items "registered members / active members / inactive
   * members". */
  membership: MembershipTrendResultDto;
  /** This week's Gathering-category `SUNDAY` attendance bucket. */
  sundayAttendance: AttendanceTrendResultDto;
  /** This week's Gathering-category `BACENTA_MEETING` attendance bucket. */
  bacentaAttendance: AttendanceTrendResultDto;
  /** This week's Gathering-category `BASONTA_MEETING` attendance bucket. */
  basontaAttendance: AttendanceTrendResultDto;
}

async function fetchAttendanceTrend(
  accessToken: string,
  signal: AbortSignal,
  endingAt: string,
  gatheringCategory: 'SUNDAY' | 'BACENTA_MEETING' | 'BASONTA_MEETING',
): Promise<AttendanceTrendResultDto> {
  const params = new URLSearchParams({ granularity: 'week', count: '1', endingAt, gatheringCategory });
  return (await apiGet<AttendanceTrendResultDto & { branchId: string }>(`/insights/attendance-trend?${params.toString()}`, {
    authToken: accessToken,
    signal,
  })) as AttendanceTrendResultDto;
}

/**
 * `[Milestone D — Portal Experiences]` Branch Administrator Dashboard's
 * real membership + attendance data (Portal 2 spec: "Sunday attendance,
 * Bacenta attendance, Basonta attendance, registered members, active
 * members, inactive members"). Composes two existing Milestone C read
 * models, no new backend capability:
 *
 * - `GET /insights/membership-trend` (`people.person.read`, which
 *   `ADMIN` holds at BRANCH scope) - its `snapshot` field already
 *   carries every membership count this dashboard needs in one call
 *   (Phase 5's own current-moment definition, not re-derived here).
 * - `GET /insights/attendance-trend` (`gatherings.attendance.read`,
 *   which `ADMIN` also holds at BRANCH scope) x3, one per
 *   `gatheringCategory` this dashboard needs - the same
 *   `mostRecentSundayIso`-anchored single-week-window pattern
 *   `useTreasurerDashboardData.ts` established, so "this week" means the
 *   same seven days across every card here too.
 */
export function useAdminDashboardData(accessToken: string | undefined): AsyncDataResult<AdminDashboardData> {
  return useAsyncData<AdminDashboardData>(
    async (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const endingAt = mostRecentSundayIso(new Date());

      const [membership, sundayAttendance, bacentaAttendance, basontaAttendance] = await Promise.all([
        apiGet<MembershipTrendResultDto & { branchId: string }>('/insights/membership-trend', { authToken: accessToken, signal }) as Promise<MembershipTrendResultDto>,
        fetchAttendanceTrend(accessToken, signal, endingAt, 'SUNDAY'),
        fetchAttendanceTrend(accessToken, signal, endingAt, 'BACENTA_MEETING'),
        fetchAttendanceTrend(accessToken, signal, endingAt, 'BASONTA_MEETING'),
      ]);

      return {
        weekLabel: sundayAttendance.from,
        from: sundayAttendance.from,
        to: sundayAttendance.to,
        membership,
        sundayAttendance,
        bacentaAttendance,
        basontaAttendance,
      };
    },
    [accessToken],
  );
}
