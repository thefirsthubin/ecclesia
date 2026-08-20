import type { AttendanceTrendResultDto, BranchResponseDto, GetAttendanceTrendQuery, GivingTrendResultDto, MembershipTrendResultDto } from '@ecclesia/contracts';

import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

export interface CouncilTrendFilter {
  granularity: GetAttendanceTrendQuery['granularity'];
  count: number;
}

export type BranchGivingResult = GivingTrendResultDto & { branchId: string };
export type BranchAttendanceResult = AttendanceTrendResultDto & { branchId: string };
export type BranchMembershipResult = MembershipTrendResultDto & { branchId: string };

/**
 * `[Milestone D — Portal Experiences, Portal 7: Council]` The real,
 * per-Branch Council read models - `GET /insights/giving-trend`/
 * `attendance-trend`/`membership-trend` with `council=true`
 * (`COUNCIL_OVERSEER`/`COUNCIL_TREASURER` hold `stewardship.transaction.read`/
 * `gatherings.attendance.read`/`people.person.read` at `COUNCIL` scope -
 * traced against `permission-matrix.ts`, not assumed). Every one of these
 * three trend endpoints returns `{ councilBranches: [...] }` for a
 * COUNCIL-scoped actor (`GivingTrendResponseDto`/`AttendanceTrendResponseDto`/
 * `MembershipTrendResponseDto`'s own `z.union` shape) - one real entry
 * per Branch in `actor.councilBranchIds`. With today's single-Branch
 * deployment that array has exactly one entry; it is never fabricated
 * into a "Branch Comparison" preview the way a prior sprint's now-removed
 * `DEMO_COUNCIL_BRANCHES` was - this hook renders however many real
 * Branches the actor's own Council actually has, nothing more.
 *
 * `GET /insights/branch-dashboard-summary` deliberately has no `council`
 * variant at all (confirmed by reading its schema/guard directly) - not
 * used here for that reason, unlike every other Dashboard in this app.
 */
export function useCouncilGivingTrend(accessToken: string | undefined, filter: CouncilTrendFilter): AsyncDataResult<BranchGivingResult[]> {
  return useAsyncData<BranchGivingResult[]>(
    async (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams({ granularity: filter.granularity, count: String(filter.count), council: 'true' });
      const response = await apiGet<{ councilBranches: BranchGivingResult[] } | BranchGivingResult>(`/insights/giving-trend?${params.toString()}`, { authToken: accessToken, signal });
      return 'councilBranches' in response ? response.councilBranches : [response];
    },
    [accessToken, filter.granularity, filter.count],
  );
}

export function useCouncilAttendanceTrend(accessToken: string | undefined, filter: CouncilTrendFilter): AsyncDataResult<BranchAttendanceResult[]> {
  return useAsyncData<BranchAttendanceResult[]>(
    async (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams({ granularity: filter.granularity, count: String(filter.count), council: 'true' });
      const response = await apiGet<{ councilBranches: BranchAttendanceResult[] } | BranchAttendanceResult>(`/insights/attendance-trend?${params.toString()}`, { authToken: accessToken, signal });
      return 'councilBranches' in response ? response.councilBranches : [response];
    },
    [accessToken, filter.granularity, filter.count],
  );
}

export function useCouncilMembershipTrend(accessToken: string | undefined, filter: CouncilTrendFilter): AsyncDataResult<BranchMembershipResult[]> {
  return useAsyncData<BranchMembershipResult[]>(
    async (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams({ granularity: filter.granularity, count: String(filter.count), council: 'true' });
      const response = await apiGet<{ councilBranches: BranchMembershipResult[] } | BranchMembershipResult>(`/insights/membership-trend?${params.toString()}`, { authToken: accessToken, signal });
      return 'councilBranches' in response ? response.councilBranches : [response];
    },
    [accessToken, filter.granularity, filter.count],
  );
}

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` `GET
 * /platform/branches` - every real Branch in the actor's own Council,
 * with its real name (`COUNCIL_OVERSEER`/`COUNCIL_TREASURER` both hold
 * `platform.branch.read` at COUNCIL scope, traced against
 * `permission-matrix.ts`). Closes the gap `CouncilDashboard.tsx`/
 * `CouncilInsightsView.tsx`'s own `branchLabel` fallback disclosed at
 * Milestone D ship time - those two components now use this hook instead
 * of falling back to a raw Branch id for any Branch other than the
 * actor's own.
 */
export function useBranches(accessToken: string | undefined): AsyncDataResult<BranchResponseDto[]> {
  return useAsyncData<BranchResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<BranchResponseDto[]>('/platform/branches', { authToken: accessToken, signal });
    },
    [accessToken],
  );
}
