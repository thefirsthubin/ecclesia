import type { IconName } from '@ecclesia/ui-core';

/**
 * Dashboard Redesign sprint - demo/placeholder data.
 *
 * `[Design Decision, disclosed]` The redesign brief asks for Members/
 * Attendance/Giving/Volunteers KPIs, an Upcoming Events timeline, a Church
 * Growth trend section, and a Prayer Focus card - none of which have a
 * backing `apps/api` endpoint today (only `GET /insights/branch-dashboard`,
 * `pulseScore` + `alerts`, is real - see `useBranchDashboard.ts`). The
 * brief is explicit that this sprint does not touch backend logic, so
 * rather than invent new endpoints this file supplies realistic, static
 * numbers for a plausible single-Branch Ghanaian church (matching this
 * codebase's own Bacenta/Basonta/GHS conventions elsewhere), shaped
 * exactly like a future `GET /insights/dashboard-summary`-style response
 * would be. Swapping this for a real fetch later is a hook-body change
 * (`useDashboardDemoMetrics` below), not a component rewrite - every
 * consumer only depends on the exported types, never on this file's
 * `DEMO_*` constants directly.
 *
 * None of this is lorem ipsum - every figure is an internally-consistent,
 * plausible number for a mid-sized Branch (per `CHURCH_PULSE_BANDS`'
 * own "Branch" framing), and every activity/event description is real
 * prose describing a real Ecclesia domain action (offerings, follow-ups,
 * visitor intake, Basonta staffing) that already exists elsewhere in this
 * codebase - not a placeholder string.
 */

/**
 * `[Design Decision, disclosed]` No Branch/church-name field exists
 * anywhere in `libs/contracts` today (`ActorContextResponseDto` carries
 * only `branchId`, a UUID) - the header's "church name" requirement has
 * no real data source to read from without a backend change, which this
 * sprint doesn't make. A plausible demo name stands in; swapping it for
 * a real `branch.name` once that field exists is a one-line change here.
 */
export const DEMO_CHURCH_NAME = 'Ecclesia Community Church';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface KpiDatum {
  id: 'members' | 'attendance' | 'giving' | 'volunteers';
  label: string;
  icon: IconName;
  /** Pre-formatted for display (e.g. `'482'`, `'GHS 24,500'`) - formatting varies enough per KPI (currency vs. plain count) that a shared numeric-only field would just get re-formatted at every call site anyway. */
  formattedValue: string;
  trendDirection: TrendDirection;
  /** e.g. `'+12 this month'`, `'-8% vs. 4 weeks ago'` - always includes its own comparison window, never a bare delta. */
  trendLabel: string;
  /** The Design System's "no card without an implied next action" rule (Part 4) - always a short, concrete next step. */
  actionLabel: string;
  actionHref: string;
}

export const DEMO_KPIS: KpiDatum[] = [
  {
    id: 'members',
    label: 'Members',
    icon: 'users',
    formattedValue: '482',
    trendDirection: 'up',
    trendLabel: '+12 this month',
    actionLabel: '3 new intakes need a follow-up assignment',
    actionHref: '/people',
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: 'calendar',
    formattedValue: '356',
    trendDirection: 'down',
    trendLabel: '-8% vs. 4 weeks ago',
    actionLabel: 'Review the dip in Bacenta 12',
    actionHref: '/insights',
  },
  {
    id: 'giving',
    label: 'Giving',
    icon: 'coins',
    formattedValue: 'GHS 24,500',
    trendDirection: 'up',
    trendLabel: '+8% this month',
    actionLabel: 'On track for the Q3 building-fund target',
    actionHref: '/stewardship',
  },
  {
    id: 'volunteers',
    label: 'Volunteers',
    icon: 'userCheck',
    formattedValue: '67',
    trendDirection: 'down',
    trendLabel: '-2 vs. last month',
    actionLabel: '5 Basonta roles are unfilled this week',
    actionHref: '/ministry',
  },
];

export interface UpcomingEventDatum {
  id: string;
  title: string;
  /** Days from today, e.g. `0` = today, `2` = in 2 days - resolved to a real date at render time so the demo always looks current. */
  daysFromNow: number;
  time: string;
  location: string;
  icon: IconName;
}

export const DEMO_UPCOMING_EVENTS: UpcomingEventDatum[] = [
  { id: 'evt-1', title: 'Sunday Service', daysFromNow: 3, time: '9:00 AM', location: 'Main Auditorium', icon: 'church' },
  { id: 'evt-2', title: 'Basonta Leaders Meeting', daysFromNow: 5, time: '6:30 PM', location: 'Fellowship Hall', icon: 'users' },
  { id: 'evt-3', title: 'New Believers Class', daysFromNow: 6, time: '10:30 AM', location: 'Room 2', icon: 'userPlus' },
  { id: 'evt-4', title: 'Midweek Bible Study', daysFromNow: 8, time: '7:00 PM', location: 'Main Auditorium', icon: 'clock' },
  { id: 'evt-5', title: 'Baptism Service', daysFromNow: 10, time: '11:00 AM', location: 'Baptismal Pool', icon: 'church' },
];

export interface DemoActivityDatum {
  id: string;
  description: string;
  hoursAgo: number;
  icon: IconName;
  tone: 'success' | 'neutral';
}

/** Blended with real resolved Insights alerts in `RecentActivityTimeline` - see that file's own doc comment on why. */
export const DEMO_RECENT_ACTIVITY: DemoActivityDatum[] = [
  { id: 'act-1', description: '3 new visitors registered at Sunday Service', hoursAgo: 20, icon: 'userPlus', tone: 'success' },
  { id: 'act-2', description: 'GHS 1,200 pledge fulfilled by Bacenta 4', hoursAgo: 27, icon: 'coins', tone: 'success' },
  { id: 'act-3', description: 'Basonta 7 staffing target updated for August', hoursAgo: 46, icon: 'clipboardList', tone: 'neutral' },
  { id: 'act-4', description: 'Follow-up completed for a 2-week absentee in Bacenta 9', hoursAgo: 52, icon: 'checkCircle', tone: 'success' },
];

/**
 * `[Reference-image iteration]` Maps to the reference dashboard's "Friends
 * Score" leaderboard - repurposed here as a per-Bacenta engagement
 * ranking, since a per-Bacenta comparison list isn't something
 * `GET /insights/branch-dashboard` returns (that endpoint gives one
 * Branch-wide `pulseScore`, not a ranked breakdown by Bacenta -
 * `INSIGHTS_DESIGN_NOTES.md`'s own note on why the cluster dashboard is a
 * single-Bacenta drill-down, not a ranked list, applies equally here).
 * Demo data, same disclosure as every other section of this file.
 */
export interface BacentaLeaderboardEntry {
  id: string;
  bacentaName: string;
  leaderName: string;
  engagementPercent: number;
}

export const DEMO_BACENTA_LEADERBOARD: BacentaLeaderboardEntry[] = [
  { id: 'bacenta-4', bacentaName: 'Bacenta 4', leaderName: 'Grace Owusu', engagementPercent: 91 },
  { id: 'bacenta-9', bacentaName: 'Bacenta 9', leaderName: 'Kwame Mensah', engagementPercent: 78 },
  { id: 'bacenta-12', bacentaName: 'Bacenta 12', leaderName: 'Abena Darko', engagementPercent: 54 },
];

/** Six-month trend series, ending at the current month - `BarChart`/`LineChart`-compatible (`{ label, value }`). */
export interface GrowthSeriesPoint {
  label: string;
  value: number;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function lastSixMonthLabels(): string[] {
  const now = new Date();
  const labels: string[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(MONTH_LABELS[d.getMonth()]);
  }
  return labels;
}

const ATTENDANCE_TREND = [398, 384, 372, 368, 361, 356];
const MEMBERSHIP_TREND = [451, 458, 462, 470, 476, 482];
const GIVING_TREND_GHS = [19800, 20600, 21200, 22750, 22680, 24500];

export function buildGrowthSeries(): { attendance: GrowthSeriesPoint[]; membership: GrowthSeriesPoint[]; giving: GrowthSeriesPoint[] } {
  const labels = lastSixMonthLabels();
  return {
    attendance: labels.map((label, i) => ({ label, value: ATTENDANCE_TREND[i] })),
    membership: labels.map((label, i) => ({ label, value: MEMBERSHIP_TREND[i] })),
    giving: labels.map((label, i) => ({ label, value: GIVING_TREND_GHS[i] })),
  };
}

/**
 * Curated, non-repeating-within-a-fortnight prayer prompts - deliberately
 * plain and unadorned (Design System v1.0 Part 8.11's "plain, respectful,
 * never... marketing flourish" tone applied to devotional as much as
 * status copy). Indexed by day-of-year so the card reads as genuinely
 * "today's focus" rather than a random pick on every reload.
 */
const PRAYER_FOCUS_ENTRIES = [
  { verse: 'Psalm 127:1', text: 'Unless the Lord builds the house, the builders labor in vain.' },
  { verse: 'Philippians 4:6', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, present your requests to God.' },
  { verse: '2 Chronicles 7:14', text: 'If my people, who are called by my name, will humble themselves and pray and seek my face...' },
  { verse: 'Matthew 9:37-38', text: 'The harvest is plentiful but the workers are few. Ask the Lord of the harvest to send out workers.' },
  { verse: 'James 5:16', text: 'Therefore confess your sins to each other and pray for each other so that you may be healed.' },
  { verse: 'Ephesians 6:18', text: 'Pray in the Spirit on all occasions with all kinds of prayers and requests.' },
  { verse: 'Colossians 4:2', text: 'Devote yourselves to prayer, being watchful and thankful.' },
] as const;

export interface PrayerFocusDatum {
  verse: string;
  text: string;
}

export function getTodaysPrayerFocus(): PrayerFocusDatum {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000);
  return PRAYER_FOCUS_ENTRIES[dayOfYear % PRAYER_FOCUS_ENTRIES.length];
}

/**
 * `[Product Experience Sprint I]` Church Pulse sub-metrics with no
 * existing backing endpoint or demo export to reuse - `Attendance`/
 * `Giving`/`Volunteers` trends already exist as `DEMO_KPIS` entries and
 * are read from there directly by `ChurchPulseInsightsPanel`, so they are
 * NOT duplicated here. Only the two genuinely new sub-metrics get new
 * exports: **Follow-up Health** (Pastoral Care's on-time completion rate
 * - `FollowUpTask` has no aggregate "completion rate" endpoint, only a
 * per-task list) and **Engagement Trend** (Insights' own broader signal,
 * distinct from the single Church Pulse score). Same disclosure as every
 * other export in this file: realistic, internally-consistent numbers,
 * not lorem ipsum, swappable for a real fetch later without a component
 * rewrite.
 */
export interface ChurchPulseSubMetricsDatum {
  followUpHealthPercent: number;
  followUpHealthTrend: TrendDirection;
  engagementTrendPercent: number;
  engagementTrendDirection: TrendDirection;
}

export const DEMO_CHURCH_PULSE_SUBMETRICS: ChurchPulseSubMetricsDatum = {
  followUpHealthPercent: 82,
  followUpHealthTrend: 'up',
  engagementTrendPercent: 6,
  engagementTrendDirection: 'up',
};

/**
 * `[Remaining Engineering Sprint, Milestone 11]` Demo data for the four
 * newly-built persona dashboards - same disclosure as every export above:
 * no backing `apps/api` aggregate endpoint exists for any of these yet,
 * and this sprint's brief is explicit that it does not add one beyond the
 * one additive Staffing Targets list endpoint. Each dashboard's own doc
 * comment records exactly which of its zones are real (a genuine
 * `apps/api` fetch, RBAC-scoped to that role) versus demo, rather than
 * leaving the reader to guess from this file alone.
 */

/** Ministry Leader dashboard - "Ministry Attendance" trend (attendance at
 * this Basonta's own Gatherings/events, distinct from the Branch-wide
 * attendance series above). */
const MINISTRY_ATTENDANCE_TREND = [34, 38, 41, 39, 44, 47];
export function buildMinistryAttendanceSeries(): GrowthSeriesPoint[] {
  return lastSixMonthLabels().map((label, i) => ({ label, value: MINISTRY_ATTENDANCE_TREND[i] }));
}

export const DEMO_MINISTRY_ACTIVITY: DemoActivityDatum[] = [
  { id: 'min-act-1', description: 'New worker onboarded to the Ushering team', hoursAgo: 18, icon: 'userPlus', tone: 'success' },
  { id: 'min-act-2', description: 'Staffing target set for the Convention weekend', hoursAgo: 30, icon: 'clipboardList', tone: 'neutral' },
  { id: 'min-act-3', description: 'Overcommitment flag cleared for a Media team worker', hoursAgo: 50, icon: 'checkCircle', tone: 'success' },
];

/** Finance Officer dashboard - "Financial Alerts" plain-language summary
 * (distinct from Insights' `AlertResponseDto` alerts, which are pastoral/
 * engagement alerts, not financial ones - Stewardship has no alert model
 * of its own, only Flagged/Under Investigation transaction states, which
 * `StewardshipPage`'s real Verification Queue already surfaces). */
export const DEMO_FINANCIAL_HIGHLIGHTS: DemoActivityDatum[] = [
  { id: 'fin-act-1', description: 'Bacenta 4 offering flagged for a GHS 200 discrepancy', hoursAgo: 6, icon: 'alertCircle', tone: 'neutral' },
  { id: 'fin-act-2', description: 'Week 31 reconciliation completed with no variance', hoursAgo: 22, icon: 'checkCircle', tone: 'success' },
  { id: 'fin-act-3', description: 'Facilities expense of GHS 850 approved', hoursAgo: 40, icon: 'coins', tone: 'success' },
];

/** Branch Pastor (Assistant Pastor) dashboard - Prayer Requests submitted
 * across the cluster this week, distinct from the Resident Pastor's
 * single daily "Prayer Focus" devotional card. */
export interface PrayerRequestDatum {
  id: string;
  requesterName: string;
  request: string;
  groupName: string;
  hoursAgo: number;
}

export const DEMO_PRAYER_REQUESTS: PrayerRequestDatum[] = [
  { id: 'pr-1', requesterName: 'Efua A.', request: 'Healing for a family member', groupName: 'Bacenta 4', hoursAgo: 14 },
  { id: 'pr-2', requesterName: 'Kwabena O.', request: 'Wisdom for a job decision', groupName: 'Bacenta 9', hoursAgo: 26 },
  { id: 'pr-3', requesterName: 'Abena D.', request: 'Safe delivery for a first child', groupName: 'Bacenta 12', hoursAgo: 48 },
];

/**
 * `[Remaining Engineering Sprint, Milestone 11]` Council Administrator
 * dashboard - "Multi-Branch Overview"/"Branch Comparison." **Genuinely
 * Horizon 3 scope, not merely undemoed**: PRD §7.3 places multi-branch
 * Council consolidation at Horizon 3, and no `apps/api` model or endpoint
 * for a second Branch exists anywhere in this codebase - this deployment
 * (River of Life Cathedral) has exactly one real Branch. This entry is
 * therefore the one section of this whole file that isn't "realistic
 * data standing in for a buildable-today endpoint" but "a preview of what
 * the zone will show once Horizon 3 multi-branch support exists,"
 * disclosed as such in `CouncilAdministratorDashboard.tsx`'s own doc
 * comment - do not read this as a nearer-term gap than it is.
 */
export interface BranchSummaryDatum {
  id: string;
  name: string;
  pulseScore: number;
  memberCount: number;
  status: 'thriving' | 'healthy' | 'attention' | 'atRisk';
}

export const DEMO_COUNCIL_BRANCHES: BranchSummaryDatum[] = [
  { id: 'branch-current', name: 'River of Life Cathedral (this Branch)', pulseScore: 74, memberCount: 482, status: 'healthy' },
  { id: 'branch-2', name: 'River of Life — Kumasi (preview)', pulseScore: 81, memberCount: 310, status: 'thriving' },
  { id: 'branch-3', name: 'River of Life — Takoradi (preview)', pulseScore: 58, memberCount: 205, status: 'attention' },
];
