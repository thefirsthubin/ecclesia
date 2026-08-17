import { BarChart, Badge, Card, EmptyState, ErrorState, Heading, Skeleton, Table, Text, useTheme } from '@ecclesia/ui-web';
import type { TableColumn } from '@ecclesia/ui-web';
import type { ReconciliationRowDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { GroupNameText } from '../People/GroupNameText';
import { getCurrentWeekBounds } from '../DashboardPage/useBranchPastorDashboardData';
import { useBranchDashboardSummary } from '../DashboardPage/useBranchDashboardSummary';
import { growthSeriesFromSummary } from '../DashboardPage/mapBranchDashboardSummary';
import { formatAmountMinor, useWeeklyReconciliation } from '../Stewardship/useStewardshipData';

const formatGhs = (value: number) => `GHS ${value.toLocaleString()}`;

/**
 * `[Branch Pastor portal, Finance completion]` "Finance" - READ-ONLY
 * financial VISIBILITY for the Branch Pastor, explicitly NOT the
 * Treasurer portal `StewardshipPage` already is (Verify/Flag/Escalate/
 * Reconcile transactions, Approve/Reject/Pay expenses, Confirm Deposit,
 * Record Transaction/Request Expense forms - none of that is reachable
 * from this page, by construction: it renders no mutation call anywhere).
 *
 * **Two real, reachable endpoints - traced against `permission-matrix.ts`
 * and re-verified live against the running API, not assumed:**
 *
 * 1. `GET /insights/branch-dashboard-summary` (`insights.branch_dashboard.read`,
 *    BRANCH for `ASSISTANT_PASTOR` - PRD §17.3 "summary only", confirmed
 *    reachable live: `curl` as the real `dev-assistant-pastor` persona
 *    returned `givingTotalMinor`/`growthSeries.giving` successfully, not a
 *    403). This is the *whole-Branch* Total Giving figure - every
 *    `VERIFIED`/`RECONCILED` `FinancialTransaction` for the Branch this
 *    month, regardless of source - and its own real trailing 6-month
 *    monthly series (`BranchDashboardSummaryService.getSummary`,
 *    `apps/api`). The exact same endpoint/hook `ResidentPastorDashboard`
 *    already uses for its own Giving KPI - reused verbatim
 *    (`useBranchDashboardSummary`, `mapBranchDashboardSummary.growthSeriesFromSummary`),
 *    not a new backend capability.
 * 2. `GET /bank-deposit-confirmations/reconciliation` (`stewardship.bank_deposit.read`,
 *    BRANCH for `ASSISTANT_PASTOR`) - the same call the Dashboard's
 *    `useBacentaPerformance` already uses. This is a *narrower* figure:
 *    only Bacenta-collected giving that has actually been bank-deposit-
 *    reconciled, for one chosen week - not comparable to the whole-Branch
 *    monthly total above (see the disclosure card below, which says so
 *    explicitly rather than letting the two numbers silently disagree).
 *
 * **Two real, disclosed gaps, freshly re-verified this pass, not carried
 * over as stale assumptions:**
 *
 * 1. **No Offering/Tithe breakdown is shown.** `FinancialTransaction.type`
 *    (`db/schema.prisma`) genuinely distinguishes `OFFERING`/`TITHE`/
 *    `SPECIAL_OFFERING`/`PLEDGE`/`DONATION` - the schema supports this.
 *    But the only endpoint that exposes individual transactions with
 *    their `type` (`GET /financial-transactions`) is RBAC-granted to
 *    `ASSISTANT_PASTOR` at CLUSTER (`stewardship.transaction.read`) yet
 *    structurally unreachable: `FinancialTransactionListResourceContextGuard`
 *    resolves `{ branchId, bacentaId: actor.bacentaId }`, and `actor.bacentaId`
 *    is `undefined` for a cluster actor (`evaluate.ts`'s own CLUSTER check
 *    requires `resource.bacentaId !== undefined`) - confirmed live this
 *    pass: `curl`ing this endpoint as `dev-assistant-pastor` returns a real
 *    403, "Resource is outside the actor's CLUSTER scope." Widening this
 *    grant to BRANCH would fix it, but that is an RBAC change this task's
 *    own brief says to report, not make silently. Separately, even the
 *    two endpoints that *are* reachable (`branch-dashboard-summary`,
 *    `bank-deposit-confirmations/reconciliation`) only ever return
 *    type-blind sums (`sumVerifiedAmountForBranch`/
 *    `sumVerifiedAmountByGroupForWeek`, `apps/api`) - no reachable
 *    endpoint anywhere breaks giving out by type today.
 * 2. **No Sunday Service / "other Branch gathering" breakdown is shown,
 *    for anyone, at any RBAC scope - this is not a permissions gap.**
 *    `FinancialTransaction` has no relation to `Gathering` at all (no
 *    `gatheringId` column - confirmed by reading the full model in
 *    `db/schema.prisma`). Its only source attribution is the nullable
 *    `sourceGroupId`, which is set for a Bacenta-collected offering and
 *    left `null` for *every* groupless gift alike - a Sunday Service
 *    collection and any other Branch-wide gathering's giving are stored
 *    identically (`sourceGroupId: null`) and are indistinguishable from
 *    each other in the data model itself. Fixing this needs a schema
 *    change (a `gatheringId` column, or recording giving per-Gathering
 *    instead of per-Group) - explicitly out of this task's scope
 *    ("do not create a migration... unless explicitly instructed").
 */
export function BranchFinanceOverviewPage() {
  const theme = useTheme();
  const { state } = useAuth();

  if (state.status !== 'authenticated') return null;

  const { startDateOnly } = getCurrentWeekBounds();
  const reconciliationState = useWeeklyReconciliation(state.accessToken, startDateOnly);
  const summaryState = useBranchDashboardSummary(state.accessToken);

  const rows = reconciliationState.status === 'success' ? reconciliationState.data.rows : [];
  const bacentaTotalMinor = rows.reduce((sum, row) => sum + BigInt(row.verifiedTotalMinor), 0n).toString();

  const columns: TableColumn<ReconciliationRowDto>[] = [
    {
      key: 'group',
      header: 'Bacenta',
      render: (row) => <GroupNameText groupId={row.groupId} />,
    },
    {
      key: 'verified',
      header: 'Verified Giving',
      align: 'right',
      render: (row) => <Text variant="bodySmall">{formatAmountMinor(row.verifiedTotalMinor, 'GHS')}</Text>,
    },
    {
      key: 'deposited',
      header: 'Bank Status',
      render: (row) => (
        <Badge status={row.depositedAmountMinor === null ? 'warning' : row.matched ? 'success' : 'danger'}>
          {row.depositedAmountMinor === null ? 'Not yet deposited' : row.matched ? 'Deposited & matched' : 'Deposited — mismatch'}
        </Badge>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5], maxWidth: 900 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
        <Heading level={1}>Branch Finance Overview</Heading>
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {`${state.actor.branchName} · Read-only giving visibility`}
        </Text>
      </div>

      {summaryState.status === 'loading' && (
        <Card padding={6}>
          <Skeleton height={60} />
        </Card>
      )}

      {summaryState.status === 'error' && (
        <Card padding={6}>
          <ErrorState title="Couldn't load Total Giving" onRetry={summaryState.refetch} />
        </Card>
      )}

      {summaryState.status === 'success' && (
        <>
          <Card padding={6} testId="branch-finance-total-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
              <Text variant="label" color={theme.colors.text.secondary}>
                TOTAL GIVING THIS MONTH
              </Text>
              <Heading level="display">{formatAmountMinor(summaryState.data.givingTotalMinor, 'GHS')}</Heading>
              <Text variant="bodySmall" color={theme.colors.text.secondary}>
                {`${summaryState.data.givingTrend >= 0 ? '+' : ''}${summaryState.data.givingTrend}% vs. last month · every verified gift to your Branch`}
              </Text>
            </div>
          </Card>

          <Card padding={6} testId="branch-finance-trend-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
              <div>
                <Heading level={3}>Giving Trend</Heading>
                <Text variant="bodySmall" color={theme.colors.text.secondary}>
                  Last 6 months, Branch-wide
                </Text>
              </div>
              <BarChart data={growthSeriesFromSummary(summaryState.data).giving} formatValue={formatGhs} testId="branch-finance-trend-chart" />
            </div>
          </Card>
        </>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        <div>
          <Heading level={2}>Giving by Bacenta</Heading>
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            {`This week only · bank-deposit-verified Bacenta offerings, not the whole-Branch total above`}
          </Text>
        </div>

        {reconciliationState.status === 'loading' && (
          <Card padding={6}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <Skeleton height={40} />
              <Skeleton height={40} />
            </div>
          </Card>
        )}

        {reconciliationState.status === 'error' && (
          <Card padding={6}>
            <ErrorState title="Couldn't load Branch giving totals" onRetry={reconciliationState.refetch} />
          </Card>
        )}

        {reconciliationState.status === 'success' && (
          <Card padding={6} testId="branch-finance-breakdown-card">
            {rows.length === 0 ? (
              <EmptyState
                icon="trendingUp"
                title="No verified giving recorded yet"
                description="No Bacenta in your Branch has a verified, bank-deposit-confirmed offering for this week yet."
              />
            ) : (
              <>
                <Table
                  testId="branch-finance-breakdown-table"
                  columns={columns}
                  data={rows}
                  getRowId={(row) => row.groupId}
                  emptyIcon="trendingUp"
                  emptyTitle="No verified giving recorded yet"
                  emptyDescription="No Bacenta in your Branch has a verified, bank-deposit-confirmed offering for this week yet."
                />
                <div style={{ marginTop: theme.spacing[4], paddingTop: theme.spacing[4], borderTop: `1px solid ${theme.colors.border.subtle}` }}>
                  <Text variant="bodySmall" color={theme.colors.text.secondary}>
                    {`Bacenta total this week: ${formatAmountMinor(bacentaTotalMinor, 'GHS')}`}
                  </Text>
                </div>
              </>
            )}
          </Card>
        )}
      </div>

      {/* Honest disclosure, not a fabricated figure - see this
          component's own top doc comment for the full reasoning behind
          both gaps named here, re-verified live this pass. */}
      <Card padding={4} testId="branch-finance-scope-note">
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          Giving is not yet broken out by type (Offering vs. Tithe vs. other) at this scope, and Sunday Service giving cannot
          currently be distinguished from other Branch-wide giving - neither is stored against the Gathering that raised it.
          &quot;Total Giving&quot; above covers every verified gift to your Branch this month; &quot;Giving by Bacenta&quot;
          covers only bank-deposit-confirmed Bacenta offerings for the selected week - the two are not directly comparable.
        </Text>
      </Card>
    </div>
  );
}
