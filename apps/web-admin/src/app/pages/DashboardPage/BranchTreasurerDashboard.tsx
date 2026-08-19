import { Badge, Card, Divider, EmptyState, ErrorState, HealthStatement, MetricCard, PageContainer, PageHeader, SectionHeader, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import type { GivingTrendResultDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from '../../router/router';
import { formatAmountMinor, useExpenseQueue, useTransactionQueue } from '../Stewardship/useStewardshipData';
import { useDashboardBreakpoint } from './useDashboardBreakpoint';
import { useGivingBreakdown } from './useGivingBreakdown';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** `[Milestone D — Portal Experiences]` `from`/`to` are the real
 * `[start, end)` bucket boundaries `useGivingBreakdown` fetched -
 * `to` is exclusive (the following week's own start), so the displayed
 * range's end date is `to` minus one day, not `to` itself. `timeZone:
 * 'UTC'` matters here - the bucket boundaries are UTC midnight
 * (`buildTimeBuckets`), and rendering them in the browser's local zone
 * could silently shift the displayed day by one. */
function formatWeekRangeLabel(fromIso: string, toIso: string): string {
  const start = new Date(fromIso);
  const end = new Date(new Date(toIso).getTime() - MILLISECONDS_PER_DAY);
  const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `Week of ${startLabel} – ${endLabel}`;
}

function bucketTotal(result: GivingTrendResultDto | undefined): string | null {
  return result?.buckets[0] ? result.buckets[0].totalAmountMinor : null;
}

function bucketByType(result: GivingTrendResultDto | undefined, type: 'OFFERING' | 'TITHE'): string | null {
  return result?.buckets[0]?.byType[type] ?? null;
}

function formatOrDash(amountMinor: string | null): string | null {
  return amountMinor === null ? null : formatAmountMinor(amountMinor, 'GHS');
}

/**
 * `[Milestone D — Portal Experiences]` Branch Treasurer (`TREASURER`)
 * Dashboard - Portal 1 spec. Rebuilt around the real giving breakdown
 * items 1-6 name explicitly (`useGivingBreakdown` - Branch
 * Tithes/Offerings, Previous Sunday, Midweek, Bacenta/Basonta giving,
 * all real, all sharing one clearly-labeled reporting week), replacing
 * the prior dashboard's demo-data "Monthly trends"/"Financial alerts"
 * sections entirely - no real Stewardship alert model or dashboard-level
 * trend endpoint exists to back them honestly, and a real multi-window
 * trend now belongs on `/insights` instead (`BranchTreasurerInsightsView`),
 * the same "Dashboard answers 'how is my Branch doing this week,'
 * Insights answers 'what's happening over time'" split
 * `BranchPastorDashboard.tsx`'s own doc comment already establishes.
 *
 * **Real, live data throughout** - the giving breakdown
 * (`useGivingBreakdown`, `GET /insights/giving-trend` x6 - the 6th,
 * `OTHER`-category call, is fetched but unused here; Portal 2's own
 * read-only Finance view is this hook's other real consumer) and the
 * Needs Your Attention / Pending Expense Requests sections (unchanged
 * from the prior dashboard - `useTransactionQueue`/`useExpenseQueue`,
 * the same real endpoints `StewardshipPage` uses for its own queues). No
 * `SampleDataBadge` anywhere on this dashboard any more.
 */
export function BranchTreasurerDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const branchName = state.status === 'authenticated' ? state.actor.branchName : '';
  const { isCompact } = useDashboardBreakpoint();

  const givingState = useGivingBreakdown(accessToken);
  const transactionsState = useTransactionQueue(accessToken);
  const expensesState = useExpenseQueue(accessToken);

  const recordedCount = transactionsState.status === 'success' ? transactionsState.data.filter((t) => t.currentState === 'RECORDED').length : undefined;
  const flaggedCount = transactionsState.status === 'success' ? transactionsState.data.filter((t) => t.currentState === 'FLAGGED' || t.currentState === 'UNDER_INVESTIGATION').length : undefined;
  const pendingExpenseCount = expensesState.status === 'success' ? expensesState.data.filter((e) => e.currentState === 'REQUESTED' || e.currentState === 'APPROVED').length : undefined;

  const attentionItems: { id: string; label: string; count: number; caption: string; status: 'danger' | 'warning' }[] = [
    ...(flaggedCount ? [{ id: 'flagged', label: 'Flagged', count: flaggedCount, caption: 'Needs investigation', status: 'danger' as const }] : []),
    ...(recordedCount ? [{ id: 'pending', label: 'Pending verification', count: recordedCount, caption: 'Awaiting Verify/Flag', status: 'warning' as const }] : []),
    ...(pendingExpenseCount ? [{ id: 'expenses', label: 'Pending expenses', count: pendingExpenseCount, caption: 'Awaiting Approve/Pay', status: 'warning' as const }] : []),
  ];
  const attentionLoading = recordedCount === undefined || flaggedCount === undefined || pendingExpenseCount === undefined;

  const weekContext = givingState.status === 'success' ? formatWeekRangeLabel(givingState.data.from, givingState.data.to) : 'This week';

  const heroBlock = (() => {
    if (givingState.status === 'loading') {
      return (
        <Card padding={6} elevation={1} testId="treasurer-health-card">
          <Skeleton height={64} />
        </Card>
      );
    }
    if (givingState.status === 'error') {
      return (
        <Card padding={6} elevation={1} testId="treasurer-health-card">
          <ErrorState title="Couldn't load this week's giving" onRetry={givingState.refetch} />
        </Card>
      );
    }
    const weekTotal = bucketTotal(givingState.data.branch);
    const notRecorded = weekTotal === null;
    const tone: 'positive' | 'attention' = notRecorded || attentionItems.length > 0 ? 'attention' : 'positive';
    const headline = notRecorded ? '—' : formatAmountMinor(weekTotal, 'GHS');
    const statement = notRecorded
      ? `No giving has been recorded for ${weekContext} yet.`
      : attentionItems.length === 0
        ? `given across the Branch, ${weekContext.toLowerCase()} — every transaction is verified and there are no open alerts.`
        : `given across the Branch, ${weekContext.toLowerCase()}. ${attentionItems.length} item${attentionItems.length === 1 ? '' : 's'} need${attentionItems.length === 1 ? 's' : ''} your attention.`;
    return (
      <Card padding={6} elevation={1} testId="treasurer-health-card">
        <HealthStatement headline={headline} statement={statement} tone={tone} testId="treasurer-health-statement" />
      </Card>
    );
  })();

  const metricGridStyle = {
    display: 'grid',
    gridTemplateColumns: isCompact ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: theme.spacing[3],
  };

  return (
    <PageContainer maxWidth={1280}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
        <PageHeader title="Dashboard" context={`${branchName} · ${weekContext}`} />

        {heroBlock}

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <SectionHeader title="Giving Breakdown" description={weekContext} />
          {givingState.status === 'loading' && (
            <Card padding={6}>
              <Skeleton height={120} />
            </Card>
          )}
          {givingState.status === 'error' && (
            <Card padding={6}>
              <ErrorState title="Couldn't load the giving breakdown" onRetry={givingState.refetch} />
            </Card>
          )}
          {givingState.status === 'success' && (
            <div style={metricGridStyle} data-testid="giving-breakdown-grid">
              <MetricCard label="Branch Tithes" value={formatOrDash(bucketByType(givingState.data.branch, 'TITHE'))} context={weekContext} testId="metric-branch-tithes" />
              <MetricCard label="Branch Offerings" value={formatOrDash(bucketByType(givingState.data.branch, 'OFFERING'))} context={weekContext} testId="metric-branch-offerings" />
              <MetricCard label="Previous Sunday — Offering" value={formatOrDash(bucketByType(givingState.data.sunday, 'OFFERING'))} context={weekContext} testId="metric-sunday-offering" />
              <MetricCard label="Previous Sunday — Tithe" value={formatOrDash(bucketByType(givingState.data.sunday, 'TITHE'))} context={weekContext} testId="metric-sunday-tithe" />
              <MetricCard label="Midweek — Offering" value={formatOrDash(bucketByType(givingState.data.midweek, 'OFFERING'))} context={weekContext} testId="metric-midweek-offering" />
              <MetricCard label="Midweek — Tithe" value={formatOrDash(bucketByType(givingState.data.midweek, 'TITHE'))} context={weekContext} testId="metric-midweek-tithe" />
              <MetricCard label="Bacenta Giving" value={formatOrDash(bucketTotal(givingState.data.bacenta))} context={weekContext} testId="metric-bacenta-giving" />
              <MetricCard label="Basonta Giving" value={formatOrDash(bucketTotal(givingState.data.basonta))} context={weekContext} testId="metric-basonta-giving" />
            </div>
          )}
        </div>

        <Card padding={6} testId="finance-needs-attention-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <SectionHeader title="Needs your attention" />
            {attentionLoading ? (
              <Skeleton height={20} />
            ) : attentionItems.length === 0 ? (
              <EmptyState icon="checkCircle" title="Nothing pending" description="Every transaction is verified and every expense request is settled." tone="positive" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                {attentionItems.map((item, index) => (
                  <div key={item.id}>
                    {index > 0 && <Divider />}
                    <button
                      type="button"
                      onClick={() => navigate('/finance')}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: `${index > 0 ? theme.spacing[3] : 0}px 0 0`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: theme.spacing[3],
                        textAlign: 'left',
                        font: 'inherit',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                        <Text variant="bodySmall">{item.label}</Text>
                        <Text variant="caption" color={theme.colors.text.secondary}>
                          {item.caption}
                        </Text>
                      </div>
                      <Badge status={item.status}>{item.count}</Badge>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {expensesState.status === 'success' && expensesState.data.filter((e) => e.currentState === 'REQUESTED').length > 0 && (
          <Card padding={6} testId="pending-expenses-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <SectionHeader title="Pending expense requests" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                {expensesState.data
                  .filter((e) => e.currentState === 'REQUESTED')
                  .slice(0, 5)
                  .map((expense, index) => (
                    <div key={expense.id}>
                      {index > 0 && <Divider />}
                      <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text variant="bodySmall">{expense.description}</Text>
                        <Badge status="info">{formatAmountMinor(expense.amountMinor, expense.currency)}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        )}

        {transactionsState.status === 'error' && <ErrorState title="Couldn't load Financial Transactions" onRetry={transactionsState.refetch} />}
        {expensesState.status === 'error' && <ErrorState title="Couldn't load Expenses" onRetry={expensesState.refetch} />}
      </div>
    </PageContainer>
  );
}
