import type { AlertResponseDto, AttendanceRecordResponseDto, GatheringResponseDto, GroupResponseDto, PersonResponseDto, WeeklyReconciliationResponseDto } from '@ecclesia/contracts';

import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

/**
 * `[Branch Pastor Dashboard sprint]` The two real `Gathering.type` values
 * this deployment (River of Life Cathedral) is seeded with
 * (`db/seed.ts`'s `gatheringTypes: ['SUNDAY_SERVICE', 'CELL_MEETING']`,
 * `BranchConfiguration.gatheringTypes`) - `Gathering.type` is Branch-
 * configurable free text (`gatherings.schemas.ts`'s own doc comment), not
 * a fixed enum, so these two literal strings are this deployment's real
 * data, not an invented convention. "Bacenta Meeting" in product language
 * is `'CELL_MEETING'` in the data model.
 */
const SUNDAY_SERVICE_TYPE = 'SUNDAY_SERVICE';
const CELL_MEETING_TYPE = 'CELL_MEETING';

export interface BacentaPerformanceRow {
  groupId: string;
  name: string;
  memberCount: number;
  /** `null` when no Sunday Service Gathering was found for the current
   * week at all (a real "missing record" state) - `0` means the
   * Gathering exists and this Bacenta had zero people marked PRESENT,
   * a different, honest fact. */
  sundayAttendance: number | null;
  sundayAttendancePercent: number | null;
  /** `null` when no Bacenta Meeting (`CELL_MEETING`) Gathering was found
   * for this Bacenta this week - same real/zero distinction as above. */
  meetingAttendance: number | null;
  meetingAttendancePercent: number | null;
  /** Minor-currency-unit decimal string, matching every other
   * `amountMinor` field in this codebase - `null` when
   * `GET /bank-deposit-confirmations/reconciliation` has no row for this
   * Bacenta this week (that endpoint's own documented semantics: a
   * Bacenta with neither a Verified transaction nor a bank deposit
   * confirmation this week is omitted, not padded with a fabricated
   * zero). */
  meetingOfferingMinor: string | null;
}

export interface BranchPastorPerformanceData {
  rows: BacentaPerformanceRow[];
  /** Distinct People across every Bacenta in the cluster (deduplicated by
   * `personId`, not a sum of each row's `memberCount` - the same "one
   * Person, not double-counted across memberships" shape
   * `BranchDashboardSummaryResponseDto.volunteersCount`'s own doc comment
   * already establishes elsewhere in this codebase). */
  totalBranchMembers: number;
  /** The Monday this week's figures are computed for (`YYYY-MM-DD`,
   * matching `GET .../reconciliation`'s own `weekStartDate` convention -
   * `[INFERRED]`, no PRD section pins a week-boundary convention, per
   * that schema's own doc comment). */
  weekStartDateOnly: string;
  /** Whether a Sunday Service Gathering was found for the current week
   * at all - `false` means every row's `sundayAttendance` is `null` for
   * the same underlying reason (no Gathering to read attendance from),
   * not N independent per-Bacenta failures. */
  hasSundayGathering: boolean;
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

function toDateOnlyString(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * The Monday..next-Monday window "this week" means throughout this file -
 * local time, matching `GET .../reconciliation`'s own inferred
 * Monday-start convention (`useStewardshipData.ts`'s `useWeeklyReconciliation`
 * doc comment). Pure date math, no backend dependency - `[INFERRED]`
 * convention, disclosed as such rather than presented as a pinned business
 * rule.
 */
export function getCurrentWeekBounds(now: Date = new Date()): { startDate: Date; endDate: Date; startDateOnly: string } {
  const day = now.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday, 0, 0, 0, 0);
  const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { startDate, endDate, startDateOnly: toDateOnlyString(startDate) };
}

function sumAmountMinor(values: (string | null)[]): string | null {
  const present = values.filter((value): value is string => value !== null);
  if (present.length === 0) return null;
  return present.reduce((sum, value) => sum + BigInt(value), 0n).toString();
}

/**
 * `[Branch Pastor Dashboard sprint]` Composes six existing, already-
 * authorized endpoints into one Bacenta-by-Bacenta performance view - no
 * new endpoint, no new aggregate. One `useAsyncData` call (not one hook
 * per Bacenta) because React's rules of hooks forbid calling a hook once
 * per array element; `Promise.all` inside a single fetcher is this
 * codebase's own established alternative for exactly this shape
 * (`BankDepositConfirmationService.getWeeklyReconciliation`'s own two-
 * parallel-queries-plus-merge doc comment describes the identical
 * reasoning server-side).
 *
 * Data sources, one per real endpoint:
 * - `GET /groups/:id` x N - Bacenta name (`people.group.read`, CLUSTER).
 * - `GET /people?groupId=:id` x N - real roster, both this Bacenta's
 *   member count and the personId set Sunday attendance is
 *   cross-referenced against (`people.person.read`, CLUSTER).
 * - `GET /gatherings?type=SUNDAY_SERVICE&from&to` - the Branch-wide
 *   Sunday Service Gathering for this week, if recorded
 *   (`gatherings.gathering.read`, now BRANCH scope - see
 *   `permission-matrix.ts`'s own doc comment on this sprint's widening).
 * - `GET /gatherings/:id/attendance-records` (Sunday) - real PRESENT
 *   records, intersected against each Bacenta's own roster to attribute
 *   Sunday attendance per Bacenta (`gatherings.attendance.read`, the
 *   grant this sprint added).
 * - `GET /gatherings?ownerGroupId=:id&type=CELL_MEETING&from&to` x N -
 *   each Bacenta's own Meeting Gathering for this week, if recorded.
 * - `GET /gatherings/:id/attendance-records` (Meeting) x N - real
 *   PRESENT records, already scoped to that one Bacenta's Gathering, no
 *   cross-referencing needed.
 * - `GET /bank-deposit-confirmations/reconciliation?weekStartDate` - real
 *   per-Bacenta verified-offering totals for the week
 *   (`stewardship.bank_deposit.read`, CLUSTER) - the closest existing
 *   proxy to "Bacenta meeting offering": every `FinancialTransaction`
 *   attributed to that Bacenta's `sourceGroupId` or the week, regardless
 *   of `type` (`OFFERING`/`TITHE`/`SPECIAL_OFFERING`/`PLEDGE`/`DONATION`)
 *   - the data model has no literal "Bacenta meeting offering" transaction
 *   type distinct from other Bacenta-attributed giving, disclosed here
 *   rather than silently assumed.
 */
export function useBacentaPerformance(
  accessToken: string | undefined,
  clusterBacentaIds: string[],
): AsyncDataResult<BranchPastorPerformanceData> {
  return useAsyncData<BranchPastorPerformanceData>(
    async (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      if (clusterBacentaIds.length === 0) {
        const { startDateOnly } = getCurrentWeekBounds();
        return { rows: [], totalBranchMembers: 0, weekStartDateOnly: startDateOnly, hasSundayGathering: false };
      }

      const { startDate, endDate, startDateOnly } = getCurrentWeekBounds();
      const fromIso = startDate.toISOString();
      const toIso = endDate.toISOString();
      const opts = { authToken: accessToken, signal };

      const [groups, rosters, sundayGatherings, reconciliation] = await Promise.all([
        Promise.all(clusterBacentaIds.map((groupId) => apiGet<GroupResponseDto>(`/groups/${groupId}`, opts))),
        Promise.all(clusterBacentaIds.map((groupId) => apiGet<PersonResponseDto[]>(`/people?groupId=${groupId}`, opts))),
        apiGet<GatheringResponseDto[]>(`/gatherings?type=${SUNDAY_SERVICE_TYPE}&from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`, opts),
        apiGet<WeeklyReconciliationResponseDto>(`/bank-deposit-confirmations/reconciliation?weekStartDate=${encodeURIComponent(startDateOnly)}`, opts),
      ]);

      const sundayGathering = sundayGatherings[0];
      const sundayPresentPersonIds = sundayGathering
        ? new Set(
            (await apiGet<AttendanceRecordResponseDto[]>(`/gatherings/${sundayGathering.id}/attendance-records`, opts))
              .filter((record) => record.status === 'PRESENT')
              .map((record) => record.personId),
          )
        : null;

      const cellMeetingGatherings = await Promise.all(
        clusterBacentaIds.map((groupId) =>
          apiGet<GatheringResponseDto[]>(
            `/gatherings?ownerGroupId=${groupId}&type=${CELL_MEETING_TYPE}&from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
            opts,
          ),
        ),
      );

      const meetingAttendanceCounts = await Promise.all(
        cellMeetingGatherings.map((gatherings) => {
          const gathering = gatherings[0];
          if (!gathering) return Promise.resolve<number | null>(null);
          return apiGet<AttendanceRecordResponseDto[]>(`/gatherings/${gathering.id}/attendance-records`, opts).then(
            (records) => records.filter((record) => record.status === 'PRESENT').length,
          );
        }),
      );

      const reconciliationByGroup = new Map(reconciliation.rows.map((row) => [row.groupId, row]));
      const allMemberIds = new Set<string>();

      const rows: BacentaPerformanceRow[] = clusterBacentaIds.map((groupId, index) => {
        const roster = rosters[index];
        roster.forEach((person) => allMemberIds.add(person.id));
        const memberCount = roster.length;
        const sundayAttendance = sundayPresentPersonIds
          ? roster.filter((person) => sundayPresentPersonIds.has(person.id)).length
          : null;
        const meetingAttendance = meetingAttendanceCounts[index];
        const reconciliationRow = reconciliationByGroup.get(groupId);

        return {
          groupId,
          name: groups[index].name,
          memberCount,
          sundayAttendance,
          sundayAttendancePercent: sundayAttendance !== null && memberCount > 0 ? Math.round((sundayAttendance / memberCount) * 100) : null,
          meetingAttendance,
          meetingAttendancePercent: meetingAttendance !== null && memberCount > 0 ? Math.round((meetingAttendance / memberCount) * 100) : null,
          meetingOfferingMinor: reconciliationRow?.verifiedTotalMinor ?? null,
        };
      });

      return {
        rows,
        totalBranchMembers: allMemberIds.size,
        weekStartDateOnly: startDateOnly,
        hasSundayGathering: sundayGathering !== undefined,
      };
    },
    [accessToken, clusterBacentaIds.join(',')],
  );
}

/** Total Bacenta meeting offering across every Bacenta with a known
 * amount this week - `null`, not `'0'`, when not a single Bacenta has a
 * verified figure yet, so the KPI strip can say "not recorded yet"
 * rather than a misleading zero. */
export function sumMeetingOffering(rows: BacentaPerformanceRow[]): string | null {
  return sumAmountMinor(rows.map((row) => row.meetingOfferingMinor));
}

/** Total Sunday attendance across every Bacenta with a known count this
 * week - `null` when no Sunday Service Gathering was found at all. */
export function sumSundayAttendance(rows: BacentaPerformanceRow[]): number | null {
  const known = rows.filter((row) => row.sundayAttendance !== null);
  if (known.length === 0) return null;
  return known.reduce((sum, row) => sum + (row.sundayAttendance ?? 0), 0);
}

export interface BacentaAlert extends AlertResponseDto {
  /** The Bacenta this alert's `scopeId` refers to - `scopeId` itself
   * already is that Bacenta's `groupId` (`AlertResponseDto`'s own shape),
   * so this is a plain alias for readability at call sites, not a second
   * identifier. */
  bacentaId: string;
}

/**
 * Real Insights alerts (`insights.alert.read`, CLUSTER) merged across
 * every Bacenta in the cluster - the same real
 * `GET /insights/cluster-dashboard/:groupId` endpoint `useClusterDashboard`
 * (`Insights/useInsightsData.ts`) already calls for one selected Bacenta
 * at a time, called once per Bacenta and combined, so "Needs attention"
 * reflects the whole Branch Pastor's cluster rather than only whichever
 * single Bacenta happened to be selected. Callers resolve `bacentaId` to
 * a display name from their own already-fetched `BacentaPerformanceRow[]`
 * (`rows`) rather than this hook doing a second name lookup.
 */
export function useClusterAlerts(accessToken: string | undefined, clusterBacentaIds: string[]): AsyncDataResult<BacentaAlert[]> {
  return useAsyncData<BacentaAlert[]>(
    async (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      if (clusterBacentaIds.length === 0) return [];
      const opts = { authToken: accessToken, signal };
      const perBacenta = await Promise.all(
        clusterBacentaIds.map((groupId) =>
          apiGet<{ alerts: AlertResponseDto[] }>(`/insights/cluster-dashboard/${groupId}`, opts).then((dashboard) =>
            dashboard.alerts.filter((alert) => alert.status === 'OPEN').map((alert) => ({ ...alert, bacentaId: groupId })),
          ),
        ),
      );
      return perBacenta.flat().sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
    },
    [accessToken, clusterBacentaIds.join(',')],
  );
}
