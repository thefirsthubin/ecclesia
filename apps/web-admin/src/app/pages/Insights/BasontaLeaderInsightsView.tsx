import { useState } from 'react';
import { Button, Card, EmptyState, ErrorState, Icon, LineChart, MetricCard, PageContainer, PageHeader, SectionHeader, TrendPanel, useTheme } from '@ecclesia/ui-web';
import type { GetAttendanceTrendQuery, GetGivingTrendQuery } from '@ecclesia/contracts';
import type { IconName } from '@ecclesia/ui-core';

import { useAuth } from '../../auth/AuthContext';
import { formatAmountMinor } from '../Stewardship/useStewardshipData';
import { summarizeNumberSeries, useGroupAttendanceTrend, useGroupGivingTrend, useGroupMembershipTrend } from './useGroupLeaderInsightsData';
import type { GroupTrendFilter } from './useGroupLeaderInsightsData';
import { summarizeTrend } from './useTreasurerInsightsData';

const METRIC_OPTIONS = [
  { value: 'attendance', label: 'Attendance' },
  { value: 'membership', label: 'Membership' },
  { value: 'giving', label: 'Giving' },
] as const;
type Metric = (typeof METRIC_OPTIONS)[number]['value'];

const GRANULARITY_OPTIONS: { value: GroupTrendFilter['granularity']; label: string; count: number }[] = [
  { value: 'week', label: 'Weekly', count: 8 },
  { value: 'month', label: 'Monthly', count: 6 },
  { value: 'year', label: 'Yearly', count: 5 },
];

const ATTENDANCE_CATEGORY_OPTIONS: { value: GetAttendanceTrendQuery['gatheringCategory'] | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'SUNDAY', label: 'Sunday' },
  { value: 'BASONTA_MEETING', label: 'Basonta Meeting' },
];

const GIVING_CATEGORY_OPTIONS: { value: GetGivingTrendQuery['gatheringCategory'] | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'SUNDAY', label: 'Sunday' },
  { value: 'BASONTA_MEETING', label: 'Basonta Meeting' },
  { value: 'OTHER', label: 'Other' },
];

const MEMBERSHIP_SERIES_OPTIONS = [
  { value: 'members', label: 'Members' },
  { value: 'registered', label: 'Registered' },
] as const;
type MembershipSeries = (typeof MEMBERSHIP_SERIES_OPTIONS)[number]['value'];

const TREND_ICON: Record<'up' | 'down' | 'flat', IconName> = { up: 'trendingUp', down: 'trendingDown', flat: 'arrowRight' };

function AttendanceSection({ accessToken, groupId, filter, granularityLabel }: { accessToken: string | undefined; groupId: string; filter: GroupTrendFilter; granularityLabel: string }) {
  const theme = useTheme();
  const [category, setCategory] = useState<(typeof ATTENDANCE_CATEGORY_OPTIONS)[number]['value']>('ALL');
  const trendState = useGroupAttendanceTrend(accessToken, groupId, filter, category === 'ALL' ? undefined : category);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
      <div role="group" aria-label="Attendance category" style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
        {ATTENDANCE_CATEGORY_OPTIONS.map((option) => (
          <Button key={option.value} variant={category === option.value ? 'primary' : 'secondary'} size="sm" onClick={() => setCategory(option.value)} aria-pressed={category === option.value}>
            {option.label}
          </Button>
        ))}
      </div>

      <Card padding={6} elevation={1} testId="basonta-attendance-chart-card">
        <TrendPanel
          title={`${granularityLabel} Attendance Trend`}
          description={category === 'ALL' ? 'Every Gathering category combined' : `${ATTENDANCE_CATEGORY_OPTIONS.find((c) => c.value === category)?.label} only`}
          status={trendState.status}
          onRetry={trendState.refetch}
          errorTitle="Couldn't load the attendance trend"
          skeletonHeight={200}
        >
          {trendState.status === 'success' &&
            (trendState.data.buckets.every((bucket) => bucket.presentCount === 0) ? (
              <EmptyState icon="trendingUp" title="No attendance recorded" description="No attendance has been recorded for your Basonta in this window yet." />
            ) : (
              <LineChart data={trendState.data.buckets.map((bucket) => ({ label: bucket.label, value: bucket.presentCount }))} height={200} testId="basonta-attendance-line-chart" />
            ))}
        </TrendPanel>
      </Card>

      {trendState.status === 'success' &&
        (() => {
          const summary = summarizeNumberSeries(trendState.data.buckets.map((bucket) => bucket.presentCount));
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: theme.spacing[3] }}>
              <MetricCard label="Most Recent" value={summary.latest === null ? null : String(summary.latest)} context={trendState.data.buckets[trendState.data.buckets.length - 1]?.label ?? 'No data yet'} testId="metric-attendance-latest" />
              <MetricCard
                label="Trend"
                value={summary.direction === null ? null : summary.direction === 'flat' ? 'No change' : summary.direction === 'up' ? 'Increasing' : 'Decreasing'}
                context="vs. the prior period"
                trailing={summary.direction && <Icon name={TREND_ICON[summary.direction]} size="sm" color={theme.colors.text.secondary} />}
                testId="metric-attendance-trend"
              />
              <MetricCard
                label="Growth"
                value={summary.growthPercent === null ? null : `${summary.growthPercent > 0 ? '+' : ''}${summary.growthPercent}%`}
                context="vs. the prior period"
                tone={summary.growthPercent !== null && summary.growthPercent < 0 ? 'attention' : 'neutral'}
                testId="metric-attendance-growth"
              />
            </div>
          );
        })()}
    </div>
  );
}

function GivingSection({ accessToken, groupId, filter, granularityLabel }: { accessToken: string | undefined; groupId: string; filter: GroupTrendFilter; granularityLabel: string }) {
  const theme = useTheme();
  const [category, setCategory] = useState<(typeof GIVING_CATEGORY_OPTIONS)[number]['value']>('ALL');
  const trendState = useGroupGivingTrend(accessToken, groupId, filter, category === 'ALL' ? undefined : category);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
      <div role="group" aria-label="Giving category" style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
        {GIVING_CATEGORY_OPTIONS.map((option) => (
          <Button key={option.value} variant={category === option.value ? 'primary' : 'secondary'} size="sm" onClick={() => setCategory(option.value)} aria-pressed={category === option.value}>
            {option.label}
          </Button>
        ))}
      </div>

      <Card padding={6} elevation={1} testId="basonta-giving-chart-card">
        <TrendPanel
          title={`${granularityLabel} Giving Trend`}
          description={category === 'ALL' ? 'Every attribution combined' : `${GIVING_CATEGORY_OPTIONS.find((c) => c.value === category)?.label} giving only`}
          status={trendState.status}
          onRetry={trendState.refetch}
          errorTitle="Couldn't load the giving trend"
          skeletonHeight={200}
        >
          {trendState.status === 'success' &&
            (trendState.data.buckets.every((bucket) => bucket.totalAmountMinor === '0') ? (
              <EmptyState icon="trendingUp" title="No giving recorded" description="No giving has been recorded for your Basonta in this window yet." />
            ) : (
              <LineChart data={trendState.data.buckets.map((bucket) => ({ label: bucket.label, value: Number(bucket.totalAmountMinor) / 100 }))} height={200} testId="basonta-giving-line-chart" />
            ))}
        </TrendPanel>
      </Card>

      {trendState.status === 'success' &&
        (() => {
          const summary = summarizeTrend(trendState.data);
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: theme.spacing[3] }}>
              <MetricCard label="Total" value={formatAmountMinor(summary.totalMinor, 'GHS')} context={`Across ${trendState.data.buckets.length} period${trendState.data.buckets.length === 1 ? '' : 's'}`} testId="metric-giving-total" />
              <MetricCard label="Most Recent" value={summary.latestMinor === null ? null : formatAmountMinor(summary.latestMinor, 'GHS')} context={trendState.data.buckets[trendState.data.buckets.length - 1]?.label ?? 'No data yet'} testId="metric-giving-latest" />
              <MetricCard
                label="Growth"
                value={summary.growthPercent === null ? null : `${summary.growthPercent > 0 ? '+' : ''}${summary.growthPercent}%`}
                context="vs. the prior period"
                tone={summary.growthPercent !== null && summary.growthPercent < 0 ? 'attention' : 'neutral'}
                testId="metric-giving-growth"
              />
            </div>
          );
        })()}
    </div>
  );
}

function MembershipSection({ accessToken, groupId, filter, granularityLabel }: { accessToken: string | undefined; groupId: string; filter: GroupTrendFilter; granularityLabel: string }) {
  const theme = useTheme();
  const [series, setSeries] = useState<MembershipSeries>('members');
  const trendState = useGroupMembershipTrend(accessToken, groupId, filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
      <div role="group" aria-label="Membership series" style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
        {MEMBERSHIP_SERIES_OPTIONS.map((option) => (
          <Button key={option.value} variant={series === option.value ? 'primary' : 'secondary'} size="sm" onClick={() => setSeries(option.value)} aria-pressed={series === option.value}>
            {option.label}
          </Button>
        ))}
      </div>

      <Card padding={6} elevation={1} testId="basonta-membership-chart-card">
        <TrendPanel
          title={`${granularityLabel} Membership Growth`}
          description={series === 'members' ? 'Confirmed Members of your Basonta' : 'Every registered Person on your Basonta'}
          status={trendState.status}
          onRetry={trendState.refetch}
          errorTitle="Couldn't load the membership trend"
          skeletonHeight={200}
        >
          {trendState.status === 'success' &&
            (() => {
              const points = series === 'members' ? trendState.data.membersSeries : trendState.data.registeredPeopleSeries;
              return points.length === 0 ? (
                <EmptyState icon="trendingUp" title="No membership history yet" description="No membership data is available for your Basonta in this window yet." />
              ) : (
                <LineChart data={points.map((point) => ({ label: point.label, value: point.value }))} height={200} testId="basonta-membership-line-chart" />
              );
            })()}
        </TrendPanel>
      </Card>

      {trendState.status === 'success' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: theme.spacing[3] }}>
          <MetricCard label="Members" value={String(trendState.data.snapshot.membersCount)} context="Confirmed Members, right now" testId="metric-membership-members" />
          <MetricCard label="Active" value={String(trendState.data.snapshot.activeMembersCount)} context={`Attended Sunday in the last ${trendState.data.snapshot.activeMemberWindowWeeks} weeks`} testId="metric-membership-active" />
          <MetricCard
            label="Inactive"
            value={String(trendState.data.snapshot.inactiveMembersCount)}
            context="Registered but not recently attending"
            tone={trendState.data.snapshot.inactiveMembersCount > 0 ? 'attention' : 'neutral'}
            testId="metric-membership-inactive"
          />
          <MetricCard label="First Timers" value={String(trendState.data.snapshot.firstTimersCount)} context="Right now" testId="metric-membership-first-timers" />
          <MetricCard label="Visitors" value={String(trendState.data.snapshot.visitorsCount)} context="Right now" testId="metric-membership-visitors" />
        </div>
      )}
    </div>
  );
}

/**
 * `[Milestone D — Portal Experiences, Portal 4: Basonta Leader]` Insights -
 * the same real attendance/membership/giving trend composition Portal 3
 * (`BacentaLeaderInsightsView`) established, reusing the identical
 * `useGroupLeaderInsightsData.ts` hooks (that file's own doc comment
 * covers the RBAC/scope tracing) - `groupId` is always this leader's own
 * `actor.basontaId`, never user-editable, so every number on this page is
 * genuinely their own Basonta's, never Branch-wide.
 */
export function BasontaLeaderInsightsView() {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const groupId = state.status === 'authenticated' ? state.actor.basontaId : undefined;
  const branchName = state.status === 'authenticated' ? state.actor.branchName : '';

  const [metric, setMetric] = useState<Metric>('attendance');
  const [granularity, setGranularity] = useState<GroupTrendFilter['granularity']>('month');
  const selectedGranularity = GRANULARITY_OPTIONS.find((option) => option.value === granularity) ?? GRANULARITY_OPTIONS[1];
  const filter: GroupTrendFilter = { granularity, count: selectedGranularity.count };

  if (!groupId) {
    return (
      <PageContainer maxWidth={720}>
        <ErrorState title="No Basonta assigned" description="Your account has no Basonta assigned yet - contact your Admin." onRetry={() => undefined} />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth={1280}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
        <PageHeader title="Insights" context={branchName} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <SectionHeader title="Your Basonta, over time" />
          <div role="group" aria-label="Metric" style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
            {METRIC_OPTIONS.map((option) => (
              <Button key={option.value} variant={metric === option.value ? 'primary' : 'secondary'} size="sm" onClick={() => setMetric(option.value)} aria-pressed={metric === option.value}>
                {option.label}
              </Button>
            ))}
          </div>
          <div role="group" aria-label="Trend granularity" style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
            {GRANULARITY_OPTIONS.map((option) => (
              <Button key={option.value} variant={granularity === option.value ? 'primary' : 'secondary'} size="sm" onClick={() => setGranularity(option.value)} aria-pressed={granularity === option.value}>
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {metric === 'attendance' && <AttendanceSection accessToken={accessToken} groupId={groupId} filter={filter} granularityLabel={selectedGranularity.label} />}
        {metric === 'giving' && <GivingSection accessToken={accessToken} groupId={groupId} filter={filter} granularityLabel={selectedGranularity.label} />}
        {metric === 'membership' && <MembershipSection accessToken={accessToken} groupId={groupId} filter={filter} granularityLabel={selectedGranularity.label} />}
      </div>
    </PageContainer>
  );
}
