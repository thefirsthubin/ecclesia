import type { AttendanceTrendResultDto, GetAttendanceTrendQuery, GetGivingTrendQuery, GivingTrendResultDto, MembershipTrendResultDto } from '@ecclesia/contracts';

import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

export interface GroupTrendFilter {
  granularity: GetAttendanceTrendQuery['granularity'];
  count: number;
}

/**
 * `[Milestone D — Portal Experiences, Portals 3 & 4: Bacenta/Basonta
 * Leader]` Insights - "attendance, membership, giving, growth
 * trends... OWN_GROUP scoped." Three thin hooks over the same Milestone C
 * trend endpoints `useAdminDashboardData`/`useGivingBreakdown`/
 * `useTreasurerInsightsData` already use elsewhere, each explicitly
 * passed the calling leader's own `groupId` (a Bacenta for
 * `BACENTA_LEADER`, a Basonta for `BASONTA_LEADER` - both are plain
 * `Group` rows, and every endpoint below is genuinely group-shape-
 * agnostic) so every result is narrowed to their own group -
 * `AttendanceTrendResourceContextGuard`/`GivingTrendResourceContextGuard`/
 * `MembershipTrendResourceContextGuard` all validate `groupId` against the
 * actor's own OWN_GROUP scope via the shared RBAC scope-evaluator, so a
 * leader cannot name a foreign group even if they tried. No new backend
 * capability - `granularity`/`count` bucketing, `groupId` narrowing, and
 * (for attendance/giving) `gatheringCategory` filtering are all
 * Milestone C's own existing query params. Originally built for Portal 3
 * alone (`BacentaLeaderInsightsView`), generalized once Portal 4
 * (`BasontaLeaderInsightsView`) needed the identical composition.
 */
export function useGroupAttendanceTrend(
  accessToken: string | undefined,
  groupId: string | undefined,
  filter: GroupTrendFilter,
  gatheringCategory?: GetAttendanceTrendQuery['gatheringCategory'],
): AsyncDataResult<AttendanceTrendResultDto> {
  return useAsyncData<AttendanceTrendResultDto>(
    (signal) => {
      if (!accessToken || !groupId) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams({ granularity: filter.granularity, count: String(filter.count), groupId });
      if (gatheringCategory) params.set('gatheringCategory', gatheringCategory);
      return apiGet<AttendanceTrendResultDto>(`/insights/attendance-trend?${params.toString()}`, { authToken: accessToken, signal });
    },
    [accessToken, groupId, filter.granularity, filter.count, gatheringCategory],
  );
}

export function useGroupGivingTrend(
  accessToken: string | undefined,
  groupId: string | undefined,
  filter: GroupTrendFilter,
  gatheringCategory?: GetGivingTrendQuery['gatheringCategory'],
): AsyncDataResult<GivingTrendResultDto> {
  return useAsyncData<GivingTrendResultDto>(
    (signal) => {
      if (!accessToken || !groupId) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams({ granularity: filter.granularity, count: String(filter.count), groupId });
      if (gatheringCategory) params.set('gatheringCategory', gatheringCategory);
      return apiGet<GivingTrendResultDto>(`/insights/giving-trend?${params.toString()}`, { authToken: accessToken, signal });
    },
    [accessToken, groupId, filter.granularity, filter.count, gatheringCategory],
  );
}

export function useGroupMembershipTrend(accessToken: string | undefined, groupId: string | undefined, filter: GroupTrendFilter): AsyncDataResult<MembershipTrendResultDto> {
  return useAsyncData<MembershipTrendResultDto>(
    (signal) => {
      if (!accessToken || !groupId) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams({ granularity: filter.granularity, count: String(filter.count), groupId });
      return apiGet<MembershipTrendResultDto>(`/insights/membership-trend?${params.toString()}`, { authToken: accessToken, signal });
    },
    [accessToken, groupId, filter.granularity, filter.count],
  );
}

export interface NumberSeriesSummary {
  latest: number | null;
  direction: 'up' | 'down' | 'flat' | null;
  growthPercent: number | null;
}

/** Same honesty rules as `useTreasurerInsightsData.ts`'s own
 * `summarizeTrend` (never divide by zero, never invent a trend from
 * fewer than two real points), generalized to a plain number series -
 * attendance's `presentCount` and membership's series points are already
 * integers, not minor-unit money strings needing `BigInt` summation. */
export function summarizeNumberSeries(values: number[]): NumberSeriesSummary {
  if (values.length === 0) return { latest: null, direction: null, growthPercent: null };
  const latest = values[values.length - 1];
  if (values.length < 2) return { latest, direction: null, growthPercent: null };

  const previous = values[values.length - 2];
  const direction: NumberSeriesSummary['direction'] = latest === previous ? 'flat' : latest > previous ? 'up' : 'down';
  const growthPercent = previous === 0 ? null : Math.round(((latest - previous) / previous) * 1000) / 10;

  return { latest, direction, growthPercent };
}
