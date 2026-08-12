import type { BacentaLeaderboardEntryDto, BranchDashboardSummaryResponseDto } from '@ecclesia/contracts';

import { formatAmountMinor } from '../Stewardship/useStewardshipData';
import type { BacentaLeaderboardEntry, GrowthSeriesPoint, KpiDatum, TrendDirection } from './dashboardDemoData';

/**
 * `[Resident Pastor Dashboard - real dashboard data milestones]` Converts
 * `BranchDashboardSummaryResponseDto` (the real
 * `GET /insights/branch-dashboard-summary` response) into the exact
 * `KpiDatum`/`GrowthSeriesPoint`/`BacentaLeaderboardEntry` shapes
 * `KpiCard`/`PerformanceChartCard`/`BacentaLeaderboardCard` already
 * render - all three components are unmodified; only what feeds them
 * changes. Follow-up Health stays demo-sourced
 * (`DEMO_CHURCH_PULSE_SUBMETRICS`) - out of this milestone's explicit
 * scope.
 *
 * `[UX Design Implementation]` Final UX Design Specification §14
 * (decision 8) moved the Growth chart and Bacenta Leaderboard to
 * Insights (`BranchTrendsSection.tsx`) - the mapping functions below are
 * unchanged, only who calls them moved.
 */

function trendDirectionForSignedNumber(value: number): TrendDirection {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'flat';
}

function signed(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

export function membersKpiFromSummary(summary: BranchDashboardSummaryResponseDto): KpiDatum {
  return {
    id: 'members',
    label: 'Members',
    icon: 'users',
    formattedValue: summary.membersCount.toLocaleString(),
    // A signed count, not a percentage - matches
    // `BranchDashboardSummaryResponseDto.membersTrend`'s own documented
    // semantics (see `libs/contracts/src/lib/insights.schemas.ts`).
    trendDirection: trendDirectionForSignedNumber(summary.membersTrend),
    trendLabel: `${signed(summary.membersTrend)} this month`,
    // Deliberately generic, not a fabricated specific claim (the demo
    // data's own "3 new intakes need a follow-up assignment" has no real
    // data behind it) - still a real, concrete next step.
    actionLabel: 'View the People directory',
    actionHref: '/people',
  };
}

export function attendanceKpiFromSummary(summary: BranchDashboardSummaryResponseDto): KpiDatum {
  return {
    id: 'attendance',
    label: 'Attendance',
    icon: 'calendar',
    formattedValue: summary.attendanceTotal.toLocaleString(),
    trendDirection: trendDirectionForSignedNumber(summary.attendanceTrend),
    trendLabel: `${signed(summary.attendanceTrend)}% vs. last month`,
    actionLabel: 'Review attendance trends in Insights',
    actionHref: '/insights',
  };
}

export function givingKpiFromSummary(summary: BranchDashboardSummaryResponseDto): KpiDatum {
  return {
    id: 'giving',
    label: 'Giving',
    icon: 'coins',
    // Reuses Stewardship's own established amountMinor -> display-string
    // formatter, the same one every other money value in this app already
    // goes through - not a second, dashboard-local formatting convention.
    formattedValue: formatAmountMinor(summary.givingTotalMinor, 'GHS'),
    trendDirection: trendDirectionForSignedNumber(summary.givingTrend),
    trendLabel: `${signed(summary.givingTrend)}% this month`,
    actionLabel: 'View giving records in Stewardship',
    actionHref: '/stewardship',
  };
}

export function volunteersKpiFromSummary(summary: BranchDashboardSummaryResponseDto): KpiDatum {
  return {
    id: 'volunteers',
    label: 'Volunteers',
    icon: 'userCheck',
    formattedValue: summary.volunteersCount.toLocaleString(),
    // A signed count, not a percentage - the exact same shape as
    // membersTrend, for the exact same reason (see this file's own doc
    // comment and the response schema's own doc comment on
    // `volunteersTrend`).
    trendDirection: trendDirectionForSignedNumber(summary.volunteersTrend),
    trendLabel: `${signed(summary.volunteersTrend)} vs. last month`,
    actionLabel: 'View rosters in Ministry',
    actionHref: '/ministry',
  };
}

/** `KpiCard`'s full Members/Attendance/Giving/Volunteers quartet, in this
 * exact order - all four are now real. */
export function buildResidentPastorKpis(summary: BranchDashboardSummaryResponseDto): KpiDatum[] {
  return [membersKpiFromSummary(summary), attendanceKpiFromSummary(summary), givingKpiFromSummary(summary), volunteersKpiFromSummary(summary)];
}

/**
 * `[Bacenta Leaderboard milestone]` `BacentaLeaderboardCard`'s `entries`
 * prop - a direct field rename from the wire DTO
 * (`groupId`->`id`, `name`->`bacentaName`, `score`->`engagementPercent`),
 * already ordered highest-first by the backend (not re-sorted here).
 * `leaderName: null` (a genuinely vacant Bacenta, or a defensive fallback
 * - see `BranchDashboardSummaryService.resolveActiveLeaderName`'s own doc
 * comment) becomes an honest, visible label - `BacentaLeaderboardCard`'s
 * own `leaderName: string` prop has no `null` case of its own to redesign
 * around, and "no name shown at all" would read as a rendering bug, not a
 * real state.
 */
export function bacentaLeaderboardFromSummary(entries: BacentaLeaderboardEntryDto[]): BacentaLeaderboardEntry[] {
  return entries.map((entry) => ({
    id: entry.groupId,
    bacentaName: entry.name,
    leaderName: entry.leaderName ?? 'No leader assigned',
    engagementPercent: Math.round(entry.score),
  }));
}

/**
 * `PerformanceChartCard`'s three series. `attendance`/`membership` are
 * already in the right unit (plain counts) - only `giving` needs
 * minor-to-major conversion here: the wire contract keeps
 * `growthSeries.giving[].value` in minor units for consistency with
 * `givingTotalMinor` (see the response schema's own doc comment), and
 * this is the one place - the chart-rendering edge - where that gets
 * converted to the major-unit numbers `PerformanceChartCard`'s own
 * `formatGhs` already expects, matching how `formatAmountMinor` is this
 * app's only other minor-to-major conversion point.
 */
export function growthSeriesFromSummary(summary: BranchDashboardSummaryResponseDto): {
  attendance: GrowthSeriesPoint[];
  membership: GrowthSeriesPoint[];
  giving: GrowthSeriesPoint[];
} {
  return {
    attendance: summary.growthSeries.attendance,
    membership: summary.growthSeries.membership,
    giving: summary.growthSeries.giving.map((point) => ({ label: point.label, value: point.value / 100 })),
  };
}
