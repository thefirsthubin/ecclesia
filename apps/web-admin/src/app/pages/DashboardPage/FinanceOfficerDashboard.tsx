import { Badge, Card, Divider, EmptyState, ErrorState, Heading, Icon, PageContainer, SampleDataBadge, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import type { PersonResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import { useNavigate } from '../../router/router';
import { formatAmountMinor, useExpenseQueue, useTransactionQueue } from '../Stewardship/useStewardshipData';
import { DashboardHeader } from './DashboardHeader';
import { DEMO_FINANCIAL_HIGHLIGHTS, buildGrowthSeries } from './dashboardDemoData';
import { TrendCard } from './TrendCard';
import { useDashboardBreakpoint } from './useDashboardBreakpoint';

function hoursAgoLabel(hoursAgo: number): string {
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  return `${Math.round(hoursAgo / 24)}d ago`;
}

/**
 * `[Remaining Engineering Sprint, Milestone 11]` Objective 1, the Finance
 * Officer (`TREASURER`) Web Admin dashboard - previously no
 * `DashboardPage.tsx` branch at all, falling to the generic "coming soon"
 * stub despite `TREASURER` holding broad, real BRANCH-scoped Stewardship
 * grants (`permission-matrix.ts`).
 *
 * **Real, live data**: Offering Summary/Verification Queue/Pending
 * Expenses/Reconciliation Status - all four are computed client-side from
 * `useTransactionQueue`/`useExpenseQueue`, the exact same real endpoints
 * `StewardshipPage` already uses (no new backend work; this dashboard is
 * a curated, counted view over the same data that page shows as a full
 * queue). **Demo data, disclosed**: Monthly Trends (reuses
 * `dashboardDemoData.ts`'s existing giving series) and Financial Alerts
 * (`DEMO_FINANCIAL_HIGHLIGHTS`) - Stewardship has no alert model or
 * monthly-aggregate endpoint of its own.
 */
export function FinanceOfficerDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const personId = state.status === 'authenticated' ? state.actor.personId : undefined;
  const branchName = state.status === 'authenticated' ? state.actor.branchName : '';
  const { isNarrow } = useDashboardBreakpoint();

  const personState = useAsyncData<PersonResponseDto>(
    (signal) => {
      if (!personId) return Promise.reject(new Error('not authenticated yet'));
      return apiGet<PersonResponseDto>(`/people/${personId}`, { authToken: accessToken, signal });
    },
    [personId, accessToken],
  );
  const displayName = personState.status === 'success' ? `${personState.data.firstName} ${personState.data.lastName}` : 'there';

  const transactionsState = useTransactionQueue(accessToken);
  const expensesState = useExpenseQueue(accessToken);

  const recordedCount = transactionsState.status === 'success' ? transactionsState.data.filter((t) => t.currentState === 'RECORDED').length : undefined;
  const flaggedCount = transactionsState.status === 'success' ? transactionsState.data.filter((t) => t.currentState === 'FLAGGED' || t.currentState === 'UNDER_INVESTIGATION').length : undefined;
  const pendingExpenseCount = expensesState.status === 'success' ? expensesState.data.filter((e) => e.currentState === 'REQUESTED' || e.currentState === 'APPROVED').length : undefined;
  const reconciledCount = transactionsState.status === 'success' ? transactionsState.data.filter((t) => t.currentState === 'RECONCILED').length : undefined;
  const reconciliationRate =
    transactionsState.status === 'success' && transactionsState.data.length > 0 ? Math.round(((reconciledCount ?? 0) / transactionsState.data.length) * 100) : undefined;
  // `[Design Decision, disclosed]` Client-side `Number` summation over an
  // already-fetched, single-page queue for a dashboard *summary* tile
  // only - not a ledger operation, and not what `stewardship.schemas.ts`'s
  // own doc comment on why `amountMinor` is a decimal *string* on the
  // wire (BigInt/JSON round-tripping precision) is protecting against.
  // GHS amounts at this Branch's scale stay well inside `Number`'s exact
  // integer range; a true reconciliation total still comes from the real
  // Reconciliation flow on `StewardshipPage`, not this KPI.
  const verifiedTotalMinor =
    transactionsState.status === 'success'
      ? transactionsState.data.filter((t) => t.currentState === 'VERIFIED' || t.currentState === 'RECONCILED').reduce((sum, t) => sum + Number(t.amountMinor), 0)
      : undefined;

  /**
   * `[Product Experience Sprint II, Phase 4]` The four former KPI cards
   * split cleanly into two different questions this dashboard's own data
   * already answers, once actually looked at rather than mapped into
   * identical tiles: three are real *action queues* (Pending
   * Verification/Flagged/Pending Expenses - work waiting to be done),
   * one is a *state* metric (Reconciliation Rate - how healthy things
   * are overall). Queues become a real "Needs your attention" card,
   * same shape `AlertPriorityCard` already establishes elsewhere in this
   * product; the state metric moves beside the Offering Summary's own
   * hero number below, where the other health-of-the-books number
   * already lives.
   */
  const attentionItems: { id: string; label: string; count: number; caption: string; status: 'danger' | 'warning' }[] = [
    ...(flaggedCount ? [{ id: 'flagged', label: 'Flagged', count: flaggedCount, caption: 'Needs investigation', status: 'danger' as const }] : []),
    ...(recordedCount ? [{ id: 'pending', label: 'Pending verification', count: recordedCount, caption: 'Awaiting Verify/Flag', status: 'warning' as const }] : []),
    ...(pendingExpenseCount ? [{ id: 'expenses', label: 'Pending expenses', count: pendingExpenseCount, caption: 'Awaiting Approve/Pay', status: 'warning' as const }] : []),
  ];
  const attentionLoading = recordedCount === undefined || flaggedCount === undefined || pendingExpenseCount === undefined;

  return (
    <PageContainer maxWidth={1280}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
        <DashboardHeader displayName={displayName} openAlertCount={flaggedCount ?? 0} branchName={branchName} />

        <Card padding={6} testId="finance-needs-attention-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <Heading level={3}>Needs your attention</Heading>
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
                      onClick={() => navigate('/stewardship')}
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

        <Card padding={6} testId="offering-summary-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: theme.spacing[3] }}>
            <div>
              <Heading level={3}>Offering summary</Heading>
              <Text variant="bodySmall" color={theme.colors.text.secondary}>
                Total of Verified + Reconciled Financial Transactions currently in scope
              </Text>
              {reconciliationRate !== undefined && (
                <Text variant="caption" color={theme.colors.text.secondary}>
                  {`${reconciliationRate}% reconciled (${reconciledCount ?? 0} of ${transactionsState.status === 'success' ? transactionsState.data.length : 0})`}
                </Text>
              )}
            </div>
            {verifiedTotalMinor === undefined ? (
              <Skeleton height={40} width={140} />
            ) : (
              <Heading level="display" color={theme.colors.brand.default}>
                {formatAmountMinor(String(verifiedTotalMinor), 'GHS')}
              </Heading>
            )}
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: theme.spacing[4] }}>
          <TrendCard title="Monthly trends" subtitle="Giving, last 6 months" series={buildGrowthSeries().giving} color={theme.colors.status.warning.strong} kind="bar" formatValue={(v) => `GHS ${v.toLocaleString()}`} testId="finance-monthly-trend" />

          <Card padding={6} testId="financial-alerts-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                <Heading level={3}>Financial alerts</Heading>
                <SampleDataBadge testId="financial-alerts-sample-badge" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                {DEMO_FINANCIAL_HIGHLIGHTS.map((item, index) => (
                  <div key={item.id}>
                    {index > 0 && <Divider />}
                    <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
                      {/* `[Dashboard Visual Redesign]` Icon-in-tinted-circle -
                          same row treatment as `UpcomingEventsTimeline`/
                          `RecentActivityTimeline`, applied in place. */}
                      <div
                        aria-hidden
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 36,
                          height: 36,
                          flexShrink: 0,
                          borderRadius: theme.radius.full,
                          backgroundColor: item.tone === 'success' ? theme.colors.status.success.background : theme.colors.status.warning.background,
                        }}
                      >
                        <Icon name={item.icon} size="sm" color={item.tone === 'success' ? theme.colors.status.success.strong : theme.colors.status.warning.strong} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1], flex: 1 }}>
                        <Text variant="bodySmall">{item.description}</Text>
                        <Text variant="caption" color={theme.colors.text.secondary}>
                          {hoursAgoLabel(item.hoursAgo)}
                        </Text>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {expensesState.status === 'success' && expensesState.data.filter((e) => e.currentState === 'REQUESTED').length > 0 && (
          <Card padding={6} testId="pending-expenses-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <Heading level={3}>Pending expense requests</Heading>
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
        {transactionsState.status === 'success' && transactionsState.data.length === 0 && (
          <EmptyState icon="checkCircle" title="No Financial Transactions yet" description="Nothing recorded in your scope yet." />
        )}
      </div>
    </PageContainer>
  );
}
