import type { CSSProperties } from 'react';
import { Card, ErrorState, Skeleton, useTheme } from '@ecclesia/ui-web';
import type { PersonResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import { roleLabel } from '../../shell/nav-items';
import { AlertPriorityCard } from './AlertPriorityCard';
import { BranchComparisonCard, ChurchPulseInsightsPanel } from './ChurchPulseInsightsPanel';
import { DEMO_CHURCH_PULSE_SUBMETRICS, DEMO_COUNCIL_BRANCHES } from './dashboardDemoData';
import type { GrowthSeriesPoint } from './dashboardDemoData';
import { DashboardHeader } from './DashboardHeader';
import { KpiCard } from './KpiCard';
import { buildResidentPastorKpis, growthSeriesFromSummary } from './mapBranchDashboardSummary';
import { PerformanceChartCard } from './PerformanceChartCard';
import { PrayerFocusCard } from './PrayerFocusCard';
import { QuickActionsRow } from './QuickActionsRow';
import { RecentActivityTimeline } from './RecentActivityTimeline';
import { UpcomingEventsTimeline } from './UpcomingEventsTimeline';
import { useBranchDashboard } from './useBranchDashboard';
import { useBranchDashboardSummary } from './useBranchDashboardSummary';
import { useDashboardBreakpoint } from './useDashboardBreakpoint';
import { useDashboardDemoMetrics } from './useDashboardDemoMetrics';

/**
 * Dashboard Redesign sprint - the Resident Pastor's Branch-wide dashboard,
 * rebuilt for customer demonstrations, then iterated against reference
 * screenshots the user provided across several passes (see
 * `DASHBOARD_REDESIGN_NOTES.md` for the full history).
 *
 * `[Fourth visual redesign pass]` The prior pass's 2-row-band spanning
 * grid was diagnosed, via an actual rendered screenshot (not just DOM/CSS
 * inspection), to produce large dead-space gaps: a row-band's height gets
 * set by the tallest *single-track* item placed in it, and a spanning
 * item that doesn't need that much height just leaves blank space behind
 * - exactly the "huge empty areas" the reference comparison flagged. This
 * pass replaces row-spanning with two independent, single-row regions
 * (each a 4-column grid, `alignItems: 'start'` so a shorter card never
 * stretches into false empty space) - still a wide module beside two
 * narrower ones per region, still real asymmetric composition, but each
 * row's height is driven only by what's actually in that row, not by an
 * unrelated cell two tracks away.
 *
 * Region A: `ChurchPulseInsightsPanel` (2 cols) | Needs your attention +
 * Quick actions, stacked (1 col) | Recent Activity (1 col). Region B:
 * `PerformanceChartCard` (2 cols) | Upcoming Gatherings (1 col) | Branch
 * Comparison + Prayer Focus, stacked (1 col). Every module is the same
 * real/demo data every prior pass used - this is a placement change
 * only.
 *
 * `ChurchPulseInsightsPanel`/`AlertPriorityCard` are unmodified in their
 * data contracts - `useBranchDashboard` is the same real
 * `GET /insights/branch-dashboard` call the dashboard already made; every
 * Quick Action / KPI card link target is an existing route already in
 * `app.tsx`. The Events/Prayer sections read from `useDashboardDemoMetrics`
 * - realistic, disclosed demo data, not a live fetch - since no aggregate
 * endpoint for those exists yet.
 *
 * `[Resident Pastor Dashboard - real dashboard data milestones]` The full
 * KPI grid (Members/Attendance/Giving/Volunteers) is real, via
 * `useBranchDashboardSummary` (`GET /insights/branch-dashboard-summary`) -
 * see `mapBranchDashboardSummary.ts` for the response-to-`KpiDatum`
 * mapping. Follow-up Health stays demo-sourced
 * (`DEMO_CHURCH_PULSE_SUBMETRICS`).
 *
 * `[Dashboard Visual Redesign]` `PerformanceChartCard` (real Attendance/
 * Membership/Giving 6-month series, from the same `summaryState` this
 * page already fetches) is a grid module here as the "analytics" area -
 * Final UX Design Specification §14 decision 8 moved it to Insights
 * (`BranchTrendsSection.tsx`); this pass's brief explicitly revises that
 * for this one screen only. `Insights`'s own usage of the same component
 * is untouched - a second call site, not a moved one. Follow-up Health
 * has no real time series (only a single demo percentage), so it is
 * deliberately not charted - "only visualize series that actually
 * exist."
 */
export function ResidentPastorDashboard() {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const personId = state.status === 'authenticated' ? state.actor.personId : undefined;
  const role = state.status === 'authenticated' ? state.actor.role : undefined;
  const branchName = state.status === 'authenticated' ? state.actor.branchName : '';

  const dashboardState = useBranchDashboard(accessToken);
  const summaryState = useBranchDashboardSummary(accessToken);
  const demoState = useDashboardDemoMetrics();
  const { isCompact, isNarrow } = useDashboardBreakpoint();

  const kpis = summaryState.status === 'success' ? buildResidentPastorKpis(summaryState.data) : undefined;
  // Follow-up Health is demo-sourced and independent of `summaryState` -
  // no need to gate it on the KPI fetch succeeding first.
  const pulseSubMetrics = DEMO_CHURCH_PULSE_SUBMETRICS;

  // `[Dashboard Visual Redesign]` The same real 6-month series
  // `BranchTrendsSection.tsx` already renders on Insights from this exact
  // `summaryState` - reused here for each `KpiCard`'s inline sparkline
  // AND for the full-size `PerformanceChartCard` grid module, rather than
  // fetched twice. `members` maps to the summary's `membership` series
  // (named differently for the same concept, per
  // `mapBranchDashboardSummary.ts`'s own KPI/DTO field naming);
  // `volunteers` has no real series behind it yet, so its `KpiCard`
  // simply renders without a sparkline rather than fabricating one.
  const growthSeries = summaryState.status === 'success' ? growthSeriesFromSummary(summaryState.data) : undefined;
  const kpiSeriesById: Record<string, GrowthSeriesPoint[] | undefined> = {
    members: growthSeries?.membership,
    attendance: growthSeries?.attendance,
    giving: growthSeries?.giving,
  };

  // Same `GET /people/:id` name lookup `AppShell`'s `UserMenu` already
  // performs (`/auth/me` has no name field) - a second, independent call
  // rather than a shared cache, matching `useAsyncData.ts`'s own
  // documented "no shared caching/fetch layer built yet" precedent.
  const personState = useAsyncData<PersonResponseDto>(
    (signal) => {
      if (!personId) return Promise.reject(new Error('not authenticated yet'));
      return apiGet<PersonResponseDto>(`/people/${personId}`, { authToken: accessToken, signal });
    },
    [personId, accessToken],
  );
  const displayName =
    personState.status === 'success' ? `${personState.data.firstName} ${personState.data.lastName}` : role ? roleLabel(role) : 'there';

  const alerts = dashboardState.status === 'success' ? dashboardState.data.alerts : [];
  const openAlertCount = alerts.filter((alert) => alert.status === 'OPEN').length;

  const kpiColumns = isNarrow ? 1 : isCompact ? 2 : 4;

  // `[Fourth visual redesign pass]` Both regions share this same 4-column
  // (desktop) / 2-column (tablet) / 1-column (mobile) grid shape -
  // `alignItems: 'start'` so a shorter card in the row keeps its own
  // natural height instead of being invisibly stretched into blank
  // space. `wide` is the 2-column module in each region (Church Pulse /
  // Performance Chart) - it keeps spanning 2 columns even at `isCompact`
  // (tablet), since collapsing it to the same 1-column width as every
  // other card at that breakpoint would erase the one piece of "this is
  // the primary module" hierarchy tablet has room to keep.
  const regionColumns = isNarrow ? 1 : isCompact ? 2 : 4;
  const regionStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${regionColumns}, minmax(0, 1fr))`,
    gap: theme.spacing[4],
    alignItems: 'start',
  };
  const wideSpan: CSSProperties = isNarrow ? {} : isCompact ? { gridColumn: '1 / 3' } : { gridColumn: '1 / 3' };

  // `[Dashboard Redesign sprint]` Staggers each module's entrance via the
  // `.ecclesia-dashboard-fade-in` keyframe class (`styles.css`) - a plain
  // `animationDelay` per section, not a JS animation sequencer.
  const fadeIn = (delayMs: number, extraStyle: CSSProperties = {}): { className: string; style: CSSProperties } => ({
    className: 'ecclesia-dashboard-fade-in',
    style: { animationDelay: `${delayMs}ms`, ...extraStyle },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5], maxWidth: 1600 }}>
      <div {...fadeIn(0)}>
        <DashboardHeader displayName={displayName} openAlertCount={openAlertCount} branchName={branchName} />
      </div>

      {/* KPI strip (Design System v1.0 Part 4.2) - compact, balanced
          row of the four real Members/Attendance/Giving/Volunteers
          tiles, not four tall single-column cards. */}
      <div {...fadeIn(40, { display: 'grid', gridTemplateColumns: `repeat(${kpiColumns}, minmax(0, 1fr))`, gap: theme.spacing[4] })}>
        {kpis
          ? kpis.map((kpi) => <KpiCard key={kpi.id} datum={kpi} series={kpiSeriesById[kpi.id]} testId={`kpi-card-${kpi.id}`} />)
          : Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 108, borderRadius: theme.radius.md, backgroundColor: theme.colors.border.subtle }} />
            ))}
      </div>

      {/* Region A - Church Pulse, the one true hero metric (real live
          data), beside the operational column and Recent Activity. */}
      <div style={regionStyle}>
        <div {...fadeIn(80, wideSpan)}>
          <ChurchPulseInsightsPanel
            status={dashboardState.status}
            pulseScore={dashboardState.status === 'success' ? dashboardState.data.pulseScore : undefined}
            onRetry={dashboardState.refetch}
            openAlertCount={openAlertCount}
            kpis={kpis}
            subMetrics={pulseSubMetrics}
          />
        </div>

        <div {...fadeIn(120, { display: 'flex', flexDirection: 'column', gap: theme.spacing[4] })}>
          <AlertPriorityCard status={dashboardState.status} alerts={alerts} accessToken={accessToken} onResolved={dashboardState.refetch} onRetry={dashboardState.refetch} />
          <QuickActionsRow />
        </div>

        <div {...fadeIn(140)}>
          <RecentActivityTimeline status={dashboardState.status} alerts={alerts} onRetry={dashboardState.refetch} />
        </div>
      </div>

      {/* Region B - the real Attendance/Membership/Giving analytics
          chart, beside Upcoming Gatherings and the smaller supporting
          cards. */}
      <div style={regionStyle}>
        <div {...fadeIn(160, wideSpan)}>
          {summaryState.status === 'success' && growthSeries ? (
            <PerformanceChartCard attendance={growthSeries.attendance} membership={growthSeries.membership} giving={growthSeries.giving} />
          ) : summaryState.status === 'error' ? (
            <Card padding={6}>
              <ErrorState title="Couldn't load Branch trends" onRetry={summaryState.refetch} />
            </Card>
          ) : (
            <Card padding={6}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                <Skeleton height={20} width="30%" />
                <Skeleton height={220} />
              </div>
            </Card>
          )}
        </div>

        {demoState.status === 'success' && (
          <div {...fadeIn(180)}>
            <UpcomingEventsTimeline events={demoState.data.upcomingEvents} />
          </div>
        )}

        <div {...fadeIn(200, { display: 'flex', flexDirection: 'column', gap: theme.spacing[4] })}>
          <BranchComparisonCard branches={DEMO_COUNCIL_BRANCHES} />
          <PrayerFocusCard />
        </div>
      </div>
    </div>
  );
}
