import { BarChart, Card, EmptyState, ErrorState, HealthStatement, PageContainer, PageHeader, SectionHeader, Skeleton, Text, TrendPanel, useTheme } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { useClusterAlerts } from '../DashboardPage/useBranchPastorDashboardData';
import { growthSeriesFromSummary } from '../DashboardPage/mapBranchDashboardSummary';
import { useBranchDashboardSummary } from '../DashboardPage/useBranchDashboardSummary';
import { GroupNameText } from '../People/GroupNameText';
import { useFollowUpTaskQueueForGroups } from '../PastoralCare/usePastoralCareData';
import { AlertPriorityCard } from '../DashboardPage/AlertPriorityCard';
import { useBacentaPulseScores } from './useInsightsData';

const formatGhs = (value: number) => `GHS ${value.toLocaleString()}`;

/**
 * `[Branch Pastor portal, Insights rebuild]` Replaces `ClusterInsightsView`
 * for this role - not a refinement, a rebuild, per the audit finding that
 * the single-Bacenta-at-a-time picker it replaces could answer none of
 * this brief's own example questions ("is attendance increasing or
 * declining," "which Bacentas are healthy," "what follow-ups are
 * overdue," "what is the giving trend," "how is the branch performing
 * over time"). Every figure below is real and independently traced:
 *
 * - **Attendance/Giving trend** - `GET /insights/branch-dashboard-summary`
 *   (`insights.branch_dashboard.read`, BRANCH for `ASSISTANT_PASTOR` -
 *   confirmed live this sprint), the exact same endpoint/hook the Finance
 *   page already uses for its own Branch-wide total. A real trailing
 *   6-month monthly series, not a fabricated trend line.
 * - **Bacenta health ranking** - `useBacentaPulseScores` (new this
 *   sprint), the same per-Bacenta `cluster-dashboard` call
 *   `useClusterAlerts` already makes, read for its `pulseScore` instead.
 * - **Needs attention** - real open alerts across every Bacenta in the
 *   cluster (`useClusterAlerts`, reused verbatim from the Dashboard) plus
 *   a real overdue-follow-up count (`useFollowUpTaskQueueForGroups`,
 *   reused verbatim from the Pastoral Care sprint).
 *
 * **What this deliberately does not claim to answer**: "where are people
 * becoming inactive" has no computed aggregate anywhere in this codebase
 * today (no lapsing/silent-drift trend beyond individual `SilentDriftFlag`
 * rows, none of which are aggregated into a Branch-level signal) - see
 * the disclosure card at the bottom of this page, the same "say what's
 * missing, don't fabricate it" precedent the Finance page already set.
 */
export function BranchInsightsView() {
  const theme = useTheme();
  const { state } = useAuth();
  const clusterBacentaIds = state.status === 'authenticated' ? (state.actor.clusterBacentaIds ?? []) : [];
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;

  const summaryState = useBranchDashboardSummary(accessToken);
  const pulseState = useBacentaPulseScores(accessToken, clusterBacentaIds);
  const alertsState = useClusterAlerts(accessToken, clusterBacentaIds);
  const followUpsState = useFollowUpTaskQueueForGroups(accessToken, clusterBacentaIds);

  if (state.status !== 'authenticated') return null;

  if (clusterBacentaIds.length === 0) {
    return (
      <PageContainer maxWidth={720}>
        <EmptyState icon="home" title="No Bacentas assigned" description="This Branch currently has no Bacentas assigned to your pastoral oversight." />
      </PageContainer>
    );
  }

  const now = new Date();
  const overdueFollowUps =
    followUpsState.status === 'success'
      ? followUpsState.data.filter((task) => task.status === 'OPEN' && task.dueAt !== null && new Date(task.dueAt).getTime() < now.getTime())
      : undefined;

  const pulseChartData =
    pulseState.status === 'success'
      ? pulseState.data.map((row) => ({ label: row.groupId, value: Math.round(row.score) }))
      : [];

  // `[Wholesale visual redesign]` The editorial thesis for "what's
  // happening over time" - unlike the Dashboard's own hero statement
  // (deliberately trend-free, see that file's doc comment), this one
  // genuinely has a real trailing series to draw from
  // (`GET /insights/branch-dashboard-summary`'s `growthSeries.attendance`,
  // already fetched for the chart below) - the sparkline here is real,
  // not fabricated for the sake of having one.
  const attendanceSeries = summaryState.status === 'success' ? growthSeriesFromSummary(summaryState.data).attendance : [];
  const givingSeries = summaryState.status === 'success' ? growthSeriesFromSummary(summaryState.data).giving : [];
  const latestAttendance = attendanceSeries.length > 0 ? attendanceSeries[attendanceSeries.length - 1] : undefined;
  const previousAttendance = attendanceSeries.length > 1 ? attendanceSeries[attendanceSeries.length - 2] : undefined;
  const attendanceDeltaPercent =
    previousAttendance && previousAttendance.value > 0 && latestAttendance
      ? Math.round(((latestAttendance.value - previousAttendance.value) / previousAttendance.value) * 100)
      : undefined;
  const latestGiving = givingSeries.length > 0 ? givingSeries[givingSeries.length - 1] : undefined;

  const trendHeroBlock = (() => {
    if (summaryState.status === 'loading') {
      return (
        <Card padding={6} elevation={1} testId="insights-trend-hero-card">
          <Skeleton height={64} />
        </Card>
      );
    }
    if (summaryState.status === 'error') {
      return (
        <Card padding={6} elevation={1} testId="insights-trend-hero-card">
          <ErrorState title="Couldn't load Branch performance" onRetry={summaryState.refetch} />
        </Card>
      );
    }
    if (!latestAttendance) {
      return (
        <Card padding={6} elevation={1} testId="insights-trend-hero-card">
          <EmptyState title="Not enough history yet" description="Branch performance needs at least one real month of data before a trend can be shown." />
        </Card>
      );
    }
    const tone: 'positive' | 'neutral' | 'attention' = attendanceDeltaPercent === undefined ? 'neutral' : attendanceDeltaPercent < 0 ? 'attention' : 'positive';
    const statement =
      attendanceDeltaPercent === undefined
        ? `attended in ${latestAttendance.label} across your Branch.`
        : `attended in ${latestAttendance.label} — ${attendanceDeltaPercent >= 0 ? 'up' : 'down'} ${Math.abs(attendanceDeltaPercent)}% from ${previousAttendance?.label}.`;
    return (
      <Card padding={6} elevation={1} testId="insights-trend-hero-card">
        <HealthStatement
          headline={String(latestAttendance.value)}
          statement={statement}
          tone={tone}
          trend={attendanceSeries}
          trailing={
            latestGiving && (
              <Text as="span" variant="bodySmall" color={theme.colors.text.secondary}>
                {`${formatGhs(latestGiving.value)} given in ${latestGiving.label}`}
              </Text>
            )
          }
          testId="insights-trend-statement"
        />
      </Card>
    );
  })();

  return (
    <PageContainer maxWidth={1080}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
      <PageHeader title="Insights" context={`${state.actor.branchName} · decision support across People, Gatherings, Finance, and Pastoral Care`} />

      {trendHeroBlock}

      {/* Branch performance over time - real, Branch-wide, 6 real months. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: theme.spacing[4] }}>
        <Card padding={6} testId="insights-attendance-trend-card">
          <TrendPanel title="Attendance Trend" description="Last 6 months, Branch-wide" status={summaryState.status} onRetry={summaryState.refetch} errorTitle="Couldn't load attendance trend">
            <BarChart data={attendanceSeries} testId="insights-attendance-chart" />
          </TrendPanel>
        </Card>
        <Card padding={6} testId="insights-giving-trend-card">
          <TrendPanel title="Giving Trend" description="Last 6 months, Branch-wide" status={summaryState.status} onRetry={summaryState.refetch} errorTitle="Couldn't load giving trend">
            <BarChart data={givingSeries} formatValue={formatGhs} testId="insights-giving-chart" />
          </TrendPanel>
        </Card>
      </div>

      {/* Which Bacentas are healthy - a real ranked comparison, not a
          single-Bacenta-at-a-time picker. */}
      <Card padding={6} testId="insights-bacenta-health-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
          <SectionHeader title="Bacenta Health" description="Current Church Pulse score, strongest first" />
          {pulseState.status === 'loading' && <Skeleton height={140} />}
          {pulseState.status === 'error' && <ErrorState title="Couldn't load Bacenta health" onRetry={pulseState.refetch} />}
          {pulseState.status === 'success' && pulseChartData.length === 0 && (
            <EmptyState icon="checkCircle" title="No scores yet" description="Church Pulse hasn't computed a score for any Bacenta in your cluster yet." />
          )}
          {pulseState.status === 'success' && pulseChartData.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              {pulseState.data.map((row) => (
                <div key={row.groupId} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
                  <div style={{ width: 140, flexShrink: 0 }}>
                    <Text variant="bodySmall">
                      <GroupNameText groupId={row.groupId} />
                    </Text>
                  </div>
                  <div style={{ flex: 1 }}>
                    <BarChart data={[{ label: '', value: Math.round(row.score) }]} orientation="horizontal" testId={`insights-pulse-${row.groupId}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Pastoral Attention - real open alerts and a real overdue
          Follow-up count, both merged across every Bacenta in the
          cluster, grouped under one heading so "where do I need to look"
          reads as one decision, not two unrelated cards. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <SectionHeader title="Pastoral Attention" description="Open alerts and overdue Follow-ups across your cluster" />

        <Card padding={6} testId="insights-overdue-followups-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
            <Text variant="label" color={theme.colors.text.secondary}>
              OVERDUE FOLLOW-UPS
            </Text>
            {followUpsState.status === 'loading' && <Skeleton height={20} />}
            {followUpsState.status === 'error' && <ErrorState title="Couldn't load Follow-ups" onRetry={followUpsState.refetch} />}
            {followUpsState.status === 'success' &&
              (overdueFollowUps && overdueFollowUps.length === 0 ? (
                <Text variant="bodySmall" color={theme.colors.text.secondary}>
                  Nothing is overdue across your cluster right now.
                </Text>
              ) : (
                <Text variant="numericTabular" color={theme.colors.status.danger.strong}>
                  {`${(overdueFollowUps ?? []).length} overdue`}
                </Text>
              ))}
          </div>
        </Card>

        <AlertPriorityCard status={alertsState.status} alerts={alertsState.status === 'success' ? alertsState.data : []} accessToken={accessToken} onResolved={alertsState.refetch} onRetry={alertsState.refetch} />
      </div>

      {/* Honest disclosure, not a fabricated figure - see this
          component's own top doc comment for the full reasoning. */}
      <Card padding={4} testId="insights-scope-note">
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          This page cannot yet show which members are becoming inactive - no Branch-level lapsing trend is computed anywhere in
          Ecclesia today, only individual silent-drift flags already reflected in the alerts above.
        </Text>
      </Card>
    </div>
    </PageContainer>
  );
}
