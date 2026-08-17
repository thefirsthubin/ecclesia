import { Card, ErrorState, Heading, Icon, PageContainer, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import type { IconName } from '@ecclesia/ui-core';

import { BacentaLeaderboardCard } from '../DashboardPage/BacentaLeaderboardCard';
import { bacentaLeaderboardFromSummary, growthSeriesFromSummary } from '../DashboardPage/mapBranchDashboardSummary';
import { PerformanceChartCard } from '../DashboardPage/PerformanceChartCard';
import { useBranchDashboardSummary } from '../DashboardPage/useBranchDashboardSummary';

const TREND_ICON: Record<'up' | 'down' | 'flat', IconName> = { up: 'trendingUp', down: 'trendingDown', flat: 'arrowRight' };

/**
 * `[UX Design Implementation]` Final UX Design Specification §14
 * (decision 8) - the "what's happening over time, and what does it
 * mean" content that used to live on the Dashboard: the six-month
 * Attendance/Membership/Giving growth chart, the Bacenta Leaderboard, and
 * the Engagement Trend figure. All three are real, sourced from
 * `GET /insights/branch-dashboard-summary` - the exact same endpoint
 * `ResidentPastorDashboard`'s KPI strip already calls, not a new backend
 * capability. Shared between `InsightsPage`'s Resident Pastor branch and
 * `AdminInsightsView` (both roles hold `insights.branch_dashboard.read`,
 * traced against `permission-matrix.ts`, not assumed) rather than
 * duplicated - this is precisely the fix for the Design Spec's own
 * finding that Super Administrator's Insights previously showed *less*
 * than their Dashboard.
 */
export function BranchTrendsSection({ accessToken }: { accessToken: string | undefined }) {
  const theme = useTheme();
  const summaryState = useBranchDashboardSummary(accessToken);

  if (summaryState.status === 'loading') {
    return (
      <PageContainer maxWidth={1280}>
        <Card padding={6}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <Skeleton height={20} width="30%" />
            <Skeleton height={220} />
          </div>
        </Card>
      </PageContainer>
    );
  }

  if (summaryState.status === 'error') {
    return (
      <PageContainer maxWidth={1280}>
        <Card padding={6}>
          <ErrorState title="Couldn't load trend data" onRetry={summaryState.refetch} />
        </Card>
      </PageContainer>
    );
  }

  const summary = summaryState.data;
  const growthSeries = growthSeriesFromSummary(summary);
  const bacentaLeaderboard = bacentaLeaderboardFromSummary(summary.bacentaLeaderboard);
  const { deltaPoints, direction, windowDays } = summary.engagementTrend;

  return (
    <PageContainer maxWidth={1280}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <PerformanceChartCard attendance={growthSeries.attendance} membership={growthSeries.membership} giving={growthSeries.giving} />

        <Card padding={6} testId="engagement-trend-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
            <Text variant="label" color={theme.colors.text.secondary}>
              ENGAGEMENT TREND
            </Text>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing[2] }}>
              <Heading level="display">{`${deltaPoints >= 0 ? '+' : ''}${deltaPoints}`}</Heading>
              <Icon name={TREND_ICON[direction]} size="md" color={theme.colors.text.secondary} />
            </div>
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              {`Church Pulse point movement over the last ${windowDays} days`}
            </Text>
          </div>
        </Card>

        {/* Omitted, not a fabricated empty-looking card, when the Branch
            genuinely has no active Bacenta with a computed score yet - same
            "no card without an implied next action" rule
            `ResidentPastorDashboard` already followed for this exact card. */}
        {bacentaLeaderboard.length > 0 && <BacentaLeaderboardCard entries={bacentaLeaderboard} />}
      </div>
    </PageContainer>
  );
}
