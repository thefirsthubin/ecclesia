import { useState } from 'react';
import { Button, Card, EmptyState, ErrorState, Icon, LineChart, MetricCard, PageContainer, PageHeader, SectionHeader, Skeleton, useTheme } from '@ecclesia/ui-web';
import type { IconName } from '@ecclesia/ui-core';

import { useAuth } from '../../auth/AuthContext';
import { formatAmountMinor } from '../Stewardship/useStewardshipData';
import { summarizeNumberSeries } from './useGroupLeaderInsightsData';
import { useBranches, useCouncilAttendanceTrend, useCouncilGivingTrend, useCouncilMembershipTrend } from './useCouncilTrendData';
import type { BranchAttendanceResult, BranchGivingResult, BranchMembershipResult, CouncilTrendFilter } from './useCouncilTrendData';
import { summarizeTrend } from './useTreasurerInsightsData';

const GRANULARITY_OPTIONS: { value: CouncilTrendFilter['granularity']; label: string; count: number }[] = [
  { value: 'week', label: 'Weekly', count: 8 },
  { value: 'month', label: 'Monthly', count: 6 },
  { value: 'year', label: 'Yearly', count: 5 },
];

const TREND_ICON: Record<'up' | 'down' | 'flat', IconName> = { up: 'trendingUp', down: 'trendingDown', flat: 'arrowRight' };

/** `[Post-Milestone D — Portal Experiences follow-up]` Same
 * `useBranches`-backed real name resolution `CouncilDashboard.tsx`'s own
 * `branchLabel` establishes - see that function's own doc comment for
 * why the raw-id fallback still exists (only reached while `useBranches`
 * is still loading/erroring). */
function branchLabel(branchId: string, actorBranchId: string, actorBranchName: string, branchNameById: Map<string, string>): string {
  return branchNameById.get(branchId) ?? (branchId === actorBranchId ? actorBranchName : branchId);
}

function GivingBranchPanel({ branch, granularityLabel }: { branch: BranchGivingResult; granularityLabel: string; branchName: string }) {
  const theme = useTheme();
  const allZero = branch.buckets.every((bucket) => bucket.totalAmountMinor === '0');
  const summary = summarizeTrend(branch);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
      {allZero ? (
        <EmptyState icon="trendingUp" title="No giving recorded" description="No giving has been recorded for this Branch in this window yet." />
      ) : (
        <LineChart data={branch.buckets.map((bucket) => ({ label: bucket.label, value: Number(bucket.totalAmountMinor) / 100 }))} height={160} testId="council-giving-line-chart" />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: theme.spacing[3] }}>
        <MetricCard label="Total" value={formatAmountMinor(summary.totalMinor, 'GHS')} context={`Across ${branch.buckets.length} ${granularityLabel.toLowerCase()}`} testId="metric-council-giving-total" />
        <MetricCard label="Most Recent" value={summary.latestMinor === null ? null : formatAmountMinor(summary.latestMinor, 'GHS')} context={branch.buckets[branch.buckets.length - 1]?.label ?? 'No data yet'} testId="metric-council-giving-latest" />
        <MetricCard
          label="Growth"
          value={summary.growthPercent === null ? null : `${summary.growthPercent > 0 ? '+' : ''}${summary.growthPercent}%`}
          context="vs. the prior period"
          tone={summary.growthPercent !== null && summary.growthPercent < 0 ? 'attention' : 'neutral'}
          testId="metric-council-giving-growth"
        />
      </div>
    </div>
  );
}

function AttendanceBranchPanel({ branch }: { branch: BranchAttendanceResult }) {
  const theme = useTheme();
  const allZero = branch.buckets.every((bucket) => bucket.presentCount === 0);
  const summary = summarizeNumberSeries(branch.buckets.map((bucket) => bucket.presentCount));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
      {allZero ? (
        <EmptyState icon="trendingUp" title="No attendance recorded" description="No attendance has been recorded for this Branch in this window yet." />
      ) : (
        <LineChart data={branch.buckets.map((bucket) => ({ label: bucket.label, value: bucket.presentCount }))} height={160} testId="council-attendance-line-chart" />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: theme.spacing[3] }}>
        <MetricCard label="Most Recent" value={summary.latest === null ? null : String(summary.latest)} context={branch.buckets[branch.buckets.length - 1]?.label ?? 'No data yet'} testId="metric-council-attendance-latest" />
        <MetricCard
          label="Trend"
          value={summary.direction === null ? null : summary.direction === 'flat' ? 'No change' : summary.direction === 'up' ? 'Increasing' : 'Decreasing'}
          context="vs. the prior period"
          trailing={summary.direction && <Icon name={TREND_ICON[summary.direction]} size="sm" color={theme.colors.text.secondary} />}
          testId="metric-council-attendance-trend"
        />
      </div>
    </div>
  );
}

function MembershipBranchPanel({ branch }: { branch: BranchMembershipResult }) {
  const theme = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
      {branch.membersSeries.length === 0 ? (
        <EmptyState icon="trendingUp" title="No membership history yet" description="No membership data is available for this Branch in this window yet." />
      ) : (
        <LineChart data={branch.membersSeries.map((point) => ({ label: point.label, value: point.value }))} height={160} testId="council-membership-line-chart" />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: theme.spacing[3] }}>
        <MetricCard label="Members" value={String(branch.snapshot.membersCount)} context="Confirmed Members, right now" testId="metric-council-members" />
        <MetricCard label="Active" value={String(branch.snapshot.activeMembersCount)} context={`Attended Sunday in the last ${branch.snapshot.activeMemberWindowWeeks} weeks`} testId="metric-council-active-members" />
        <MetricCard
          label="Inactive"
          value={String(branch.snapshot.inactiveMembersCount)}
          context="Registered but not recently attending"
          tone={branch.snapshot.inactiveMembersCount > 0 ? 'attention' : 'neutral'}
          testId="metric-council-inactive-members"
        />
      </div>
    </div>
  );
}

/**
 * `[Milestone D — Portal Experiences, Portal 7: Council]` Insights -
 * previously fell to the generic "not available for this role" stub for
 * both `COUNCIL_OVERSEER` and `COUNCIL_TREASURER`. Real
 * `council=true`-scoped trend data (`useCouncilTrendData.ts`), one panel
 * per real Branch in the actor's own Council - no fabricated Branch
 * Comparison for today's single-Branch deployment. `COUNCIL_TREASURER`
 * only sees the Giving metric (the one grant this role actually holds -
 * `stewardship.transaction.read` at COUNCIL); Attendance/Membership are
 * `COUNCIL_OVERSEER`-only.
 */
export function CouncilInsightsView() {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const actorBranchId = state.status === 'authenticated' ? state.actor.branchId : '';
  const actorBranchName = state.status === 'authenticated' ? state.actor.branchName : '';
  const isOverseer = state.status === 'authenticated' && state.actor.role === 'COUNCIL_OVERSEER';

  const branchesState = useBranches(accessToken);
  const branchNameById = new Map<string, string>();
  if (branchesState.status === 'success') for (const branch of branchesState.data) branchNameById.set(branch.id, branch.name);

  const metricOptions = isOverseer
    ? ([
        { value: 'giving', label: 'Giving' },
        { value: 'attendance', label: 'Attendance' },
        { value: 'membership', label: 'Membership' },
      ] as const)
    : ([{ value: 'giving', label: 'Giving' }] as const);
  const [metric, setMetric] = useState<'giving' | 'attendance' | 'membership'>('giving');
  const [granularity, setGranularity] = useState<CouncilTrendFilter['granularity']>('month');
  const selectedGranularity = GRANULARITY_OPTIONS.find((option) => option.value === granularity) ?? GRANULARITY_OPTIONS[1];
  const filter: CouncilTrendFilter = { granularity, count: selectedGranularity.count };

  const givingState = useCouncilGivingTrend(metric === 'giving' ? accessToken : undefined, filter);
  const attendanceState = useCouncilAttendanceTrend(isOverseer && metric === 'attendance' ? accessToken : undefined, filter);
  const membershipState = useCouncilMembershipTrend(isOverseer && metric === 'membership' ? accessToken : undefined, filter);

  const activeState = metric === 'giving' ? givingState : metric === 'attendance' ? attendanceState : membershipState;

  return (
    <PageContainer maxWidth={1280}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
        <PageHeader title="Insights" context={state.status === 'authenticated' && state.actor.role === 'COUNCIL_OVERSEER' ? 'Council Administrator' : 'Council Treasurer'} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <SectionHeader title="Your Council, over time" />
          {metricOptions.length > 1 && (
            <div role="group" aria-label="Metric" style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
              {metricOptions.map((option) => (
                <Button key={option.value} variant={metric === option.value ? 'primary' : 'secondary'} size="sm" onClick={() => setMetric(option.value)} aria-pressed={metric === option.value}>
                  {option.label}
                </Button>
              ))}
            </div>
          )}
          <div role="group" aria-label="Trend granularity" style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
            {GRANULARITY_OPTIONS.map((option) => (
              <Button key={option.value} variant={granularity === option.value ? 'primary' : 'secondary'} size="sm" onClick={() => setGranularity(option.value)} aria-pressed={granularity === option.value}>
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {activeState.status === 'loading' && (
          <Card padding={6}>
            <Skeleton height={160} />
          </Card>
        )}
        {activeState.status === 'error' && (
          <Card padding={6}>
            <ErrorState title="Couldn't load Council Insights" onRetry={activeState.refetch} />
          </Card>
        )}
        {activeState.status === 'success' &&
          (activeState.data.length === 0 ? (
            <EmptyState icon="home" title="No Branches in your Council" description="Your account is not yet associated with any Branch." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
              {metric === 'giving' &&
                givingState.status === 'success' &&
                givingState.data.map((branch) => (
                  <Card padding={6} elevation={1} key={branch.branchId} testId="council-insights-branch-card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                      <SectionHeader title={branchLabel(branch.branchId, actorBranchId, actorBranchName, branchNameById)} description={`${selectedGranularity.label} Giving Trend`} />
                      <GivingBranchPanel branch={branch} granularityLabel={selectedGranularity.label} branchName={branchLabel(branch.branchId, actorBranchId, actorBranchName, branchNameById)} />
                    </div>
                  </Card>
                ))}
              {metric === 'attendance' &&
                attendanceState.status === 'success' &&
                attendanceState.data.map((branch) => (
                  <Card padding={6} elevation={1} key={branch.branchId} testId="council-insights-branch-card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                      <SectionHeader title={branchLabel(branch.branchId, actorBranchId, actorBranchName, branchNameById)} description={`${selectedGranularity.label} Attendance Trend`} />
                      <AttendanceBranchPanel branch={branch} />
                    </div>
                  </Card>
                ))}
              {metric === 'membership' &&
                membershipState.status === 'success' &&
                membershipState.data.map((branch) => (
                  <Card padding={6} elevation={1} key={branch.branchId} testId="council-insights-branch-card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                      <SectionHeader title={branchLabel(branch.branchId, actorBranchId, actorBranchName, branchNameById)} description={`${selectedGranularity.label} Membership Growth`} />
                      <MembershipBranchPanel branch={branch} />
                    </div>
                  </Card>
                ))}
            </div>
          ))}
      </div>
    </PageContainer>
  );
}
