import { Injectable } from '@nestjs/common';
import type { BacentaLeaderboardEntryDto, BranchDashboardSummaryResponseDto, EngagementTrendDto, GrowthSeriesPointDto } from '@ecclesia/contracts';
import { DEFAULT_PULSE_TREND_WINDOW_DAYS, evaluatePulseTrend } from '@ecclesia/domain-insights';
import type { PulseScorePoint } from '@ecclesia/domain-insights';

import { AttendanceRecordService } from '../../gatherings/services/attendance-record.service';
import { GroupLeadershipService } from '../../people/services/group-leadership.service';
import { GroupMembershipService } from '../../people/services/group-membership.service';
import { GroupService } from '../../people/services/group.service';
import { PersonService } from '../../people/services/person.service';
import { FinancialTransactionService } from '../../stewardship/services/financial-transaction.service';
import { PulseScoreHistoryRepository } from '../repositories/pulse-score-history.repository';
import { PulseScoreRepository } from '../repositories/pulse-score.repository';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SERIES_MONTH_COUNT = 6;

interface MonthBoundary {
  /** Inclusive start, UTC month boundary. */
  start: Date;
  /** Exclusive end (the following month's start) - matches every
   * `[from, to)` window this codebase's date-range queries already use
   * (e.g. `FinancialTransactionRepository.sumVerifiedAmountByGroupForWeek`). */
  end: Date;
  label: string;
}

/**
 * `[Resident Pastor Dashboard - real Members/Attendance/Giving data
 * milestone]` The last `SERIES_MONTH_COUNT` calendar months, oldest first,
 * ending at the current (in-progress) month - `boundaries[boundaries.length - 1]`
 * is always "this month." Computed in UTC explicitly, not the server's
 * local timezone - `AttendanceRecord.recordedAt`/`FinancialTransaction.createdAt`
 * are `@db.Timestamptz`, and this codebase has no established
 * server-locale convention to lean on instead (`db/schema.prisma`'s own
 * `@db.Timestamptz` choice already implies "don't assume a wall-clock
 * timezone").
 */
function lastSixMonthBoundaries(now: Date): MonthBoundary[] {
  const boundaries: MonthBoundary[] = [];
  for (let i = SERIES_MONTH_COUNT - 1; i >= 0; i -= 1) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
    boundaries.push({ start, end, label: MONTH_LABELS[start.getUTCMonth()] });
  }
  return boundaries;
}

/** Signed whole-number percentage change, matching the demo data this
 * endpoint replaces (`'-8% vs. 4 weeks ago'`, `'+8% this month'` - whole
 * numbers, not decimals). `previous === 0` has no well-defined percentage
 * change; treated as `0` (flat) rather than `Infinity`/`NaN` reaching the
 * client - a Branch with genuinely zero attendance/giving two months
 * running has a real problem `attendanceTotal`/`givingTotalMinor`
 * themselves already surface, not one a fabricated "+100%" trend should
 * paper over or a broken number should represent. */
function percentChange(previous: number, current: number): number {
  if (previous === 0) {
    return 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

function toSeries(boundaries: MonthBoundary[], values: number[]): GrowthSeriesPointDto[] {
  return boundaries.map((boundary, index) => ({ label: boundary.label, value: values[index] }));
}

/**
 * `[Resident Pastor Dashboard - real dashboard data milestones]` Backs
 * `GET /insights/branch-dashboard-summary` (`DashboardController`) - see
 * `libs/contracts/src/lib/insights.schemas.ts`'s
 * `branchDashboardSummaryResponseSchema` doc comment for the full field
 * semantics. Deliberately narrow: Members/Attendance/Giving/Volunteers/
 * Bacenta Leaderboard/Engagement Trend, per these two milestones' explicit
 * scope - not a generalized analytics service. `branchId` always comes
 * from the caller (`DashboardController`, which resolves it from the
 * authenticated actor's own `ActorContext`) - this service never resolves
 * or trusts a client-supplied Branch id.
 *
 * **Two different kinds of "point in a 6-month series" here, on purpose**:
 * Attendance and Giving are **period sums** (how much happened *during*
 * each month - `countPresentInWindow`/`sumVerifiedAmountForBranch`, both
 * `[start, end)`-windowed). Membership is a **cumulative snapshot** (the
 * running total *as of* each month's end - `countByBranchCreatedBefore`,
 * an unbounded-below count). This matches the demo data being replaced
 * exactly: `ATTENDANCE_TREND`/`GIVING_TREND_GHS` fluctuate independently
 * month to month, while `MEMBERSHIP_TREND` only ever increases -
 * `db/schema.prisma`'s `Person` model has no departure/deletion concept,
 * so a headcount trend can only be a running total, never a period count
 * of "people who joined that specific month" without double-subtracting
 * departures this schema has no way to represent. `volunteersTrend`
 * (below) reuses this exact same "current minus as-of-start-of-month"
 * shape, for the same reason - `GroupMembership` has no departure event
 * either, only an `endedAt` timestamp, which is what makes the
 * point-in-time reconstruction honest rather than invented.
 *
 * **Bacenta Leaderboard and Engagement Trend are pure reads, never
 * computations**: the former reads `PulseScore` rows `apps/worker`'s
 * `ChurchPulseRecomputeJob` already wrote; the latter reads
 * `PulseScoreHistory` rows that same job already appended, through
 * `libs/domain/insights`'s own `evaluatePulseTrend()` - this service adds
 * no new Church Pulse math anywhere.
 */
@Injectable()
export class BranchDashboardSummaryService {
  constructor(
    private readonly personService: PersonService,
    private readonly attendanceRecordService: AttendanceRecordService,
    private readonly financialTransactionService: FinancialTransactionService,
    private readonly groupMembershipService: GroupMembershipService,
    private readonly groupService: GroupService,
    private readonly groupLeadershipService: GroupLeadershipService,
    private readonly pulseScoreRepository: PulseScoreRepository,
    private readonly pulseScoreHistoryRepository: PulseScoreHistoryRepository,
  ) {}

  async getSummary(branchId: string, now: Date = new Date()): Promise<BranchDashboardSummaryResponseDto> {
    const boundaries = lastSixMonthBoundaries(now);
    const currentMonth = boundaries[boundaries.length - 1];

    const [
      membersCount,
      membersCountStartOfMonth,
      attendanceByMonth,
      givingByMonth,
      membershipByMonth,
      volunteersCount,
      volunteersCountStartOfMonth,
      bacentaLeaderboard,
      engagementTrend,
    ] = await Promise.all([
      this.personService.countByBranch(branchId),
      this.personService.countByBranchCreatedBefore(branchId, currentMonth.start),
      Promise.all(boundaries.map((boundary) => this.attendanceRecordService.countPresentInWindow(branchId, boundary.start, boundary.end))),
      Promise.all(boundaries.map((boundary) => this.financialTransactionService.sumVerifiedAmountForBranch(branchId, boundary.start, boundary.end))),
      Promise.all(boundaries.map((boundary) => this.personService.countByBranchCreatedBefore(branchId, boundary.end))),
      this.groupMembershipService.countDistinctActiveMinistryMembersByBranch(branchId),
      this.groupMembershipService.countDistinctActiveMinistryMembersByBranch(branchId, currentMonth.start),
      this.buildBacentaLeaderboard(branchId),
      this.computeEngagementTrend(branchId, now),
    ]);

    const attendanceTotal = attendanceByMonth[attendanceByMonth.length - 1];
    const givingTotalMinor = givingByMonth[givingByMonth.length - 1];

    return {
      branchId,
      membersCount,
      // A signed count, not a percentage - see the response schema's own
      // doc comment for why this differs in kind from attendanceTrend/givingTrend.
      membersTrend: membersCount - membersCountStartOfMonth,
      attendanceTotal,
      attendanceTrend: percentChange(attendanceByMonth[attendanceByMonth.length - 2], attendanceTotal),
      givingTotalMinor: givingTotalMinor.toString(),
      givingTrend: percentChange(Number(givingByMonth[givingByMonth.length - 2]), Number(givingTotalMinor)),
      growthSeries: {
        attendance: toSeries(boundaries, attendanceByMonth),
        membership: toSeries(boundaries, membershipByMonth),
        // Minor units, deliberately not converted here - see the response
        // schema's own doc comment on `growthSeries.giving[].value`.
        giving: toSeries(boundaries, givingByMonth.map(Number)),
      },
      volunteersCount,
      // Same signed-count shape as membersTrend, same reasoning.
      volunteersTrend: volunteersCount - volunteersCountStartOfMonth,
      bacentaLeaderboard,
      engagementTrend,
    };
  }

  /**
   * `[Bacenta Leaderboard milestone]` Every active Bacenta with an
   * already-computed Church Pulse score, highest first, with its current
   * Shepherd's name resolved where one is actively assigned.
   * `groupService.listActiveBacentasForBranch`/`pulseScoreRepository.findByBranchAndScopeType`
   * both run once, up front - the per-Bacenta leader-name resolution is
   * the only per-row work, bounded by however many Bacentas actually have
   * a score (typically small, single-Branch scale).
   */
  private async buildBacentaLeaderboard(branchId: string): Promise<BacentaLeaderboardEntryDto[]> {
    const [activeBacentas, scores] = await Promise.all([
      this.groupService.listActiveBacentasForBranch(branchId),
      this.pulseScoreRepository.findByBranchAndScopeType(branchId, 'GROUP'),
    ]);

    const scoreByGroupId = new Map(scores.map((score) => [score.scopeId, score]));

    // Omit, don't fabricate a 0 - a Bacenta the nightly recompute sweep
    // hasn't reached yet has no honest score to rank it by.
    const scored = activeBacentas
      .map((bacenta) => ({ bacenta, score: scoreByGroupId.get(bacenta.id) }))
      .filter((entry): entry is { bacenta: (typeof activeBacentas)[number]; score: NonNullable<(typeof entry)['score']> } => entry.score !== undefined);

    const entries = await Promise.all(
      scored.map(async ({ bacenta, score }) => ({
        groupId: bacenta.id,
        name: bacenta.name,
        leaderName: await this.resolveActiveLeaderName(bacenta.id),
        score: score.score.toNumber(),
      })),
    );

    return entries.sort((a, b) => b.score - a.score);
  }

  /** `null` for a genuinely vacant Bacenta (no active `BACENTA_LEADER`
   * Role Assignment) - a real, honest state, not an error. Also `null` on
   * the defensive, shouldn't-happen case of a Role Assignment pointing at
   * a Person record that no longer resolves - one broken leader lookup
   * must not fail the whole leaderboard. */
  private async resolveActiveLeaderName(groupId: string): Promise<string | null> {
    const leaderPersonId = await this.groupLeadershipService.getActiveBacentaLeaderPersonId(groupId);
    if (!leaderPersonId) {
      return null;
    }
    try {
      const leader = await this.personService.getById(leaderPersonId);
      return `${leader.firstName} ${leader.lastName}`;
    } catch {
      return null;
    }
  }

  /**
   * `[Engagement Trend milestone]` A direct read of `evaluatePulseTrend()`
   * (`libs/domain/insights`, FR-INS-03) applied to the Branch's own
   * `PulseScoreHistory` - the identical function/window
   * `apps/worker`'s `ChurchPulseRecomputeJob` already uses for decline
   * alerting, reused here for display rather than duplicated. `direction`
   * is derived from `deltaPoints`' sign, not `evaluation.declined` (that
   * field is threshold-gated for alerting, a different question - see the
   * response schema's own doc comment).
   */
  private async computeEngagementTrend(branchId: string, now: Date): Promise<EngagementTrendDto> {
    const since = new Date(now.getTime() - DEFAULT_PULSE_TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const history = await this.pulseScoreHistoryRepository.findRecentByScope('BRANCH', branchId, since);
    const points: PulseScorePoint[] = history.map((point) => ({ score: point.score.toNumber(), computedAt: point.computedAt }));

    const evaluation = evaluatePulseTrend(points, now, DEFAULT_PULSE_TREND_WINDOW_DAYS);
    const deltaPoints = Math.round(evaluation.deltaPoints * 100) / 100;

    return {
      direction: deltaPoints > 0 ? 'up' : deltaPoints < 0 ? 'down' : 'flat',
      deltaPoints,
      windowDays: DEFAULT_PULSE_TREND_WINDOW_DAYS,
    };
  }
}
