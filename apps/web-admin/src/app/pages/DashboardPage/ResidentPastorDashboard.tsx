import type { CSSProperties } from 'react';
import { useTheme } from '@ecclesia/ui-web';
import type { PersonResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import { roleLabel } from '../../shell/nav-items';
import { AlertPriorityCard } from './AlertPriorityCard';
import { ChurchPulseInsightsPanel } from './ChurchPulseInsightsPanel';
import { DEMO_CHURCH_PULSE_SUBMETRICS, DEMO_COUNCIL_BRANCHES } from './dashboardDemoData';
import { DashboardHeader } from './DashboardHeader';
import { KpiCard } from './KpiCard';
import { buildResidentPastorKpis } from './mapBranchDashboardSummary';
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
 * rebuilt for customer demonstrations, then iterated a second time
 * against a reference screenshot the user provided (see
 * `DASHBOARD_REDESIGN_NOTES.md`'s "Reference image iteration" section for
 * the two decisions that shaped that pass: keep Ecclesia's own brand
 * color rather than the reference's pink/lavender palette, and - at the
 * time - use a top pill nav instead of the sidebar every other page kept.
 * `[UX Design Implementation]` That second decision is now reversed (Final
 * UX Design Specification §12, decision 1): the pill nav is retired, and
 * this route renders through the same `AppShell` sidebar + breadcrumb
 * grammar as every other page - one navigation model, no page-scoped
 * exception.
 *
 * `ChurchPulseCard`/`AlertPriorityCard` are the exact same, unmodified
 * components `InsightsPage.tsx` also renders - this sprint doesn't fork
 * or restyle them. No backend logic or routing changed: `useBranchDashboard`
 * is the same real `GET /insights/branch-dashboard` call the dashboard
 * already made; every Quick Action / KPI card link target is an existing
 * route already in `app.tsx`. The Events/Prayer sections read from
 * `useDashboardDemoMetrics` - realistic, disclosed demo data, not a live
 * fetch - since no aggregate endpoint for those exists yet.
 *
 * `[Resident Pastor Dashboard - real dashboard data milestones]` The full
 * KPI grid (Members/Attendance/Giving/Volunteers) is real, via
 * `useBranchDashboardSummary` (`GET /insights/branch-dashboard-summary`) -
 * see `mapBranchDashboardSummary.ts` for the response-to-`KpiDatum`
 * mapping. Follow-up Health stays demo-sourced
 * (`DEMO_CHURCH_PULSE_SUBMETRICS`).
 *
 * `[UX Design Implementation]` Final UX Design Specification §14
 * (decision 8) - the Attendance/Membership/Giving growth chart, the
 * Bacenta Leaderboard, and the Engagement Trend sub-metric moved to
 * Insights (`BranchTrendsSection.tsx`, wired in `InsightsPage.tsx`) -
 * Dashboard answers "what do I need to know right now," not "what's
 * happening over time." `summaryState` is still fetched here (the KPI
 * strip still needs it); only the trend-shaped content built from it was
 * removed from this route's render.
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
  const heroColumnStyle: CSSProperties = { display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '2fr 1fr', gap: theme.spacing[4], alignItems: 'start' };
  const pairColumnStyle: CSSProperties = { display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '1fr 1fr', gap: theme.spacing[4] };

  // `[Dashboard Redesign sprint]` Staggers each section's entrance via the
  // `.ecclesia-dashboard-fade-in` keyframe class (`styles.css`) - a plain
  // `animationDelay` per section, not a JS animation sequencer.
  const fadeIn = (delayMs: number, extraStyle: CSSProperties = {}): { className: string; style: CSSProperties } => ({
    className: 'ecclesia-dashboard-fade-in',
    style: { animationDelay: `${delayMs}ms`, ...extraStyle },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5], maxWidth: 1280 }}>
      <div {...fadeIn(0)}>
        <DashboardHeader displayName={displayName} openAlertCount={openAlertCount} branchName={branchName} />
      </div>

      {/* Primary metric zone (Design System v1.0 Part 4.2) - Church Pulse
          stays the one true hero metric, real live data, unmodified
          component. Kept even though the reference image's own hero is a
          chart, not a single number - dropping this would violate the
          design system's own "exactly one hero metric" rule this
          dashboard otherwise still follows. */}
      <div {...fadeIn(20)}>
        <ChurchPulseInsightsPanel
          status={dashboardState.status}
          pulseScore={dashboardState.status === 'success' ? dashboardState.data.pulseScore : undefined}
          onRetry={dashboardState.refetch}
          openAlertCount={openAlertCount}
          kpis={kpis}
          subMetrics={pulseSubMetrics}
          branches={DEMO_COUNCIL_BRANCHES}
        />
      </div>

      <div {...fadeIn(40, { display: 'grid', gridTemplateColumns: `repeat(${kpiColumns}, 1fr)`, gap: theme.spacing[4] })}>
        {kpis
          ? kpis.map((kpi) => <KpiCard key={kpi.id} datum={kpi} testId={`kpi-card-${kpi.id}`} />)
          : Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 150, borderRadius: theme.radius.md, backgroundColor: theme.colors.border.subtle }} />
            ))}
      </div>

      <div {...fadeIn(80, heroColumnStyle)}>
        <AlertPriorityCard status={dashboardState.status} alerts={alerts} accessToken={accessToken} onResolved={dashboardState.refetch} onRetry={dashboardState.refetch} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
          <QuickActionsRow />
          <PrayerFocusCard />
        </div>
      </div>

      <div {...fadeIn(160, pairColumnStyle)}>
        {demoState.status === 'success' && <UpcomingEventsTimeline events={demoState.data.upcomingEvents} />}
        <RecentActivityTimeline status={dashboardState.status} alerts={alerts} onRetry={dashboardState.refetch} />
      </div>
    </div>
  );
}
