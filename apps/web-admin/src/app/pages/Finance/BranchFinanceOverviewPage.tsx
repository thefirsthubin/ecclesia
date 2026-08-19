import { useState } from 'react';
import { Badge, Button, Card, ErrorState, HealthStatement, Input, MetricCard, PageContainer, PageHeader, SectionHeader, Skeleton, Table, Text, useTheme, useToast } from '@ecclesia/ui-web';
import type { TableColumn } from '@ecclesia/ui-web';
import type { ExpenseResponseDto, GivingTrendResultDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../lib/api-client';
import { PersonNameText } from '../PastoralCare/PersonNameText';
import { ReceiptUploadPanel } from '../Stewardship/ReceiptUploadPanel';
import { approveExpense, formatAmountMinor, parseAmountToMinorUnits, rejectExpense, requestExpense, useExpenseQueue } from '../Stewardship/useStewardshipData';
import { useGivingBreakdown } from '../DashboardPage/useGivingBreakdown';
import { useDashboardBreakpoint } from '../DashboardPage/useDashboardBreakpoint';

const EXPENSE_STATE_BADGE: Record<string, 'neutral' | 'info' | 'warning' | 'danger' | 'success'> = {
  REQUESTED: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
  PAID: 'success',
  RECEIPT_RETAINED: 'success',
};

/** Same best-effort server-reason extraction `PersonDetailPage.tsx`/
 * `GatheringsListPage.tsx` already establish. */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.body && typeof error.body === 'object' && 'message' in error.body) {
    const message = (error.body as { message: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every((entry) => typeof entry === 'string')) return message.join('; ');
  }
  return error instanceof Error ? error.message : fallback;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** Same `[start, end)` -> inclusive-end-date display convention
 * `BranchTreasurerDashboard.tsx`'s own `formatWeekRangeLabel` establishes -
 * duplicated rather than extracted, matching this codebase's "small
 * per-page glue, not worth extracting" precedent. */
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
 * `[Branch Pastor portal, Finance completion]` `[Milestone D — Portal
 * Experiences, rebuild]` "Finance" - read-only financial VISIBILITY for
 * `ADMIN` (BRANCH, `stewardship.transaction.read` with zero accompanying
 * mutation grant, Milestone C Phase 1 decision #8) - no
 * Record/Verify/Flag/Escalate/Reconcile/Confirm Deposit control is ever
 * reachable for that role. Shared by Branch Pastor (`ASSISTANT_PASTOR`,
 * CLUSTER), whose grant shape is genuinely different, not identical:
 * `[Milestone D — Portal Experiences, Portal 6: Assistant Pastor]` this
 * role also holds `stewardship.expense.request`/`.approve`/`.receipt`/
 * `.read` at CLUSTER scope (PRD §17.3 - Branch Pastor may approve
 * expenses "if delegated by the Resident Pastor") - a real, held
 * capability this page previously had zero UI for (traced against
 * `permission-matrix.ts`, not assumed; this role holds no `.pay` grant,
 * so no Pay action renders here - that stays Treasurer-only on
 * `StewardshipPage`). The Expense section below only renders for
 * `ASSISTANT_PASTOR`.
 *
 * **Rebuilt on `useGivingBreakdown`** (`GET /insights/giving-trend`,
 * Milestone C's read model) - replacing the two real, disclosed gaps the
 * prior version of this page carried ("no Sunday/Bacenta/Basonta
 * breakdown is possible - `FinancialTransaction` has no relation to
 * `Gathering`"). That was true when written; it no longer is -
 * `FinancialTransaction.gatheringId` exists today (confirmed against
 * `financialTransactionResponseSchema`), and `GivingTrendService`'s own
 * `gatheringCategory` filtering (`SUNDAY`/`MIDWEEK`/`BACENTA_MEETING`/
 * `BASONTA_MEETING`/`OTHER`) already exposes exactly the breakdown this
 * page previously disclosed as unbuildable. Portal 2's own spec names
 * this breakdown explicitly ("Sunday offerings, Sunday tithes, Bacenta
 * giving, Basonta giving, other giving"), which is what surfaced the
 * stale disclosure - fixed for both real consumers of this page, not
 * just the one that prompted the fix.
 */
export function BranchFinanceOverviewPage() {
  const theme = useTheme();
  const toast = useToast();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const { isCompact } = useDashboardBreakpoint();

  const givingState = useGivingBreakdown(accessToken);
  const weekContext = givingState.status === 'success' ? formatWeekRangeLabel(givingState.data.from, givingState.data.to) : 'This week';

  // `[Milestone D — Portal Experiences, Portal 6: Assistant Pastor]`
  // Called unconditionally (Rules of Hooks) - `undefined` token is this
  // codebase's own "don't fetch" idiom, so `ADMIN` never makes this call.
  const canSeeExpenses = state.status === 'authenticated' && state.actor.role === 'ASSISTANT_PASTOR';
  const expensesState = useExpenseQueue(canSeeExpenses ? accessToken : undefined);

  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [expenseAmountText, setExpenseAmountText] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [expenseSubmitError, setExpenseSubmitError] = useState<string | undefined>(undefined);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [rejectDraftId, setRejectDraftId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | undefined>(undefined);

  if (state.status !== 'authenticated') return null;

  const expenseAmountMinor = parseAmountToMinorUnits(expenseAmountText);
  const expenseAmountError = expenseAmountText.length > 0 && expenseAmountMinor === null ? 'Enter a valid amount greater than 0' : undefined;

  const closeExpenseForm = () => {
    setExpenseFormOpen(false);
    setExpenseAmountText('');
    setExpenseDescription('');
    setExpenseCategory('');
    setExpenseSubmitError(undefined);
  };
  const submitRequestExpense = async () => {
    if (!expenseAmountMinor || expenseDescription.trim().length === 0) return;
    setExpenseSubmitting(true);
    setExpenseSubmitError(undefined);
    try {
      await requestExpense(state.accessToken, {
        amountMinor: expenseAmountMinor,
        description: expenseDescription.trim(),
        category: expenseCategory.trim().length > 0 ? expenseCategory.trim() : undefined,
      });
      expensesState.refetch();
      closeExpenseForm();
    } catch (error) {
      setExpenseSubmitError(extractErrorMessage(error, 'Something went wrong requesting this expense.'));
    } finally {
      setExpenseSubmitting(false);
    }
  };

  const openRejectDraft = (id: string) => {
    setRejectDraftId(id);
    setRejectReason('');
    setRejectError(undefined);
  };
  const cancelRejectDraft = () => {
    setRejectDraftId(null);
    setRejectReason('');
    setRejectError(undefined);
  };
  const runExpenseAction = async (id: string, action: 'approve' | 'reject', run: () => Promise<ExpenseResponseDto>) => {
    setBusyKey(`${id}:${action}`);
    try {
      await run();
      expensesState.refetch();
      if (action === 'approve') toast.show({ status: 'success', message: 'Expense approved.' });
      else cancelRejectDraft();
    } catch (error) {
      const message = extractErrorMessage(error, 'Something went wrong with this action.');
      if (action === 'reject') setRejectError(message);
      else toast.show({ status: 'danger', message });
    } finally {
      setBusyKey(null);
    }
  };

  const expenseColumns: TableColumn<ExpenseResponseDto>[] = [
    { key: 'description', header: 'Description', render: (expense) => <Text variant="bodySmall">{expense.description}</Text> },
    {
      key: 'category',
      header: 'Category',
      render: (expense) => (
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {expense.category ?? '—'}
        </Text>
      ),
    },
    { key: 'amount', header: 'Amount', align: 'right', render: (expense) => <Text variant="bodySmall">{formatAmountMinor(expense.amountMinor, expense.currency)}</Text> },
    { key: 'requestedBy', header: 'Requested by', render: (expense) => <PersonNameText personId={expense.requestedByPersonId} /> },
    { key: 'status', header: 'Status', render: (expense) => <Badge status={EXPENSE_STATE_BADGE[expense.currentState] ?? 'neutral'}>{expense.currentState}</Badge> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (expense) =>
        expense.currentState === 'REQUESTED' ? (
          <div style={{ display: 'flex', gap: theme.spacing[2], justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              size="sm"
              loading={busyKey === `${expense.id}:approve`}
              onClick={() => void runExpenseAction(expense.id, 'approve', () => approveExpense(state.accessToken, expense.id))}
              accessibilityLabel={`Approve expense: ${expense.description}`}
            >
              Approve
            </Button>
            <Button variant="danger" size="sm" onClick={() => openRejectDraft(expense.id)} accessibilityLabel={`Reject expense: ${expense.description}`}>
              Reject
            </Button>
          </div>
        ) : null,
    },
  ];

  const metricGridStyle = {
    display: 'grid',
    gridTemplateColumns: isCompact ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: theme.spacing[3],
  };

  const heroBlock = (() => {
    if (givingState.status === 'loading') {
      return (
        <Card padding={6} elevation={1} testId="branch-finance-total-card">
          <Skeleton height={64} />
        </Card>
      );
    }
    if (givingState.status === 'error') {
      return (
        <Card padding={6} elevation={1} testId="branch-finance-total-card">
          <ErrorState title="Couldn't load this week's giving" onRetry={givingState.refetch} />
        </Card>
      );
    }
    const weekTotal = bucketTotal(givingState.data.branch);
    const notRecorded = weekTotal === null;
    return (
      <Card padding={6} elevation={1} testId="branch-finance-total-card">
        <HealthStatement
          headline={notRecorded ? '—' : formatAmountMinor(weekTotal, 'GHS')}
          statement={notRecorded ? `No giving has been recorded for ${weekContext} yet.` : `given across the Branch, ${weekContext.toLowerCase()}.`}
          tone={notRecorded ? 'attention' : 'positive'}
          testId="branch-finance-total-statement"
        />
      </Card>
    );
  })();

  return (
    <PageContainer maxWidth={1120}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
        <PageHeader
          title="Finance"
          context={`${state.actor.branchName} · ${canSeeExpenses ? 'Giving visibility + expense workflow' : 'Read-only giving visibility'} · ${weekContext}`}
          action={
            canSeeExpenses && !expenseFormOpen ? (
              <Button variant="secondary" size="sm" onClick={() => setExpenseFormOpen(true)} accessibilityLabel="Request expense">
                + Request expense
              </Button>
            ) : undefined
          }
        />

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
            <div style={metricGridStyle} data-testid="branch-finance-breakdown-grid">
              <MetricCard label="Sunday Offerings" value={formatOrDash(bucketByType(givingState.data.sunday, 'OFFERING'))} context={weekContext} testId="metric-sunday-offerings" />
              <MetricCard label="Sunday Tithes" value={formatOrDash(bucketByType(givingState.data.sunday, 'TITHE'))} context={weekContext} testId="metric-sunday-tithes" />
              <MetricCard label="Bacenta Giving" value={formatOrDash(bucketTotal(givingState.data.bacenta))} context={weekContext} testId="metric-bacenta-giving" />
              <MetricCard label="Basonta Giving" value={formatOrDash(bucketTotal(givingState.data.basonta))} context={weekContext} testId="metric-basonta-giving" />
              <MetricCard label="Other Giving" value={formatOrDash(bucketTotal(givingState.data.other))} context={weekContext} testId="metric-other-giving" />
            </div>
          )}
        </div>

        {givingState.status === 'success' && givingState.data.branch.unattributedAmountMinor !== '0' && (
          <Card padding={4} testId="branch-finance-unattributed-card">
            <SectionHeader
              title="Some giving has no linked Gathering or Group"
              description={`${formatAmountMinor(givingState.data.branch.unattributedAmountMinor, 'GHS')} this week - never guessed into a category above`}
            />
          </Card>
        )}

        {/* `[Milestone D — Portal Experiences, Portal 6: Assistant Pastor]`
            The real expense request/approve workflow this role's own
            CLUSTER-scoped `stewardship.expense.*` grants support - no Pay
            action (Treasurer-only, `.pay` not held by this role). */}
        {canSeeExpenses && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <SectionHeader title="Expenses" description="Request, approve, or reject expenses across your cluster" />

            {expenseFormOpen && (
              <Card padding={6} testId="expense-request-form">
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                  <Input label="Amount (GHS)" value={expenseAmountText} onChange={(event) => setExpenseAmountText(event.target.value)} error={expenseAmountError} placeholder="0.00" />
                  <Input label="Description" value={expenseDescription} onChange={(event) => setExpenseDescription(event.target.value)} placeholder="What is this expense for?" />
                  <Input label="Category (optional)" value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value)} placeholder="e.g. Transport, Facilities" />
                  {expenseSubmitError && (
                    <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                      {expenseSubmitError}
                    </Text>
                  )}
                  <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!expenseAmountMinor || expenseDescription.trim().length === 0}
                      loading={expenseSubmitting}
                      onClick={() => void submitRequestExpense()}
                    >
                      Submit request
                    </Button>
                    <Button variant="secondary" size="sm" onClick={closeExpenseForm}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {expensesState.status === 'loading' && (
              <Card padding={6}>
                <Skeleton height={40} />
              </Card>
            )}
            {expensesState.status === 'error' && (
              <Card padding={6}>
                <ErrorState title="Couldn't load Expenses" onRetry={expensesState.refetch} />
              </Card>
            )}
            {expensesState.status === 'success' && (
              <Card padding={6} testId="branch-finance-expense-queue-card">
                <Table
                  testId="branch-finance-expense-queue-table"
                  columns={expenseColumns}
                  data={expensesState.data}
                  getRowId={(expense) => expense.id}
                  // `ReceiptUploadPanel` renders per row unconditionally
                  // (same precedent as `StewardshipPage.tsx`'s own Expense
                  // table) - `isRowExpanded` is therefore always true;
                  // `renderRowDetail` itself decides whether the reject
                  // form also shows.
                  isRowExpanded={() => true}
                  renderRowDetail={(expense) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                      {rejectDraftId === expense.id && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }} data-testid="expense-reject-form">
                          <div style={{ display: 'flex', gap: theme.spacing[2], alignItems: 'flex-end' }}>
                            <Input label="Reason" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Why is this being rejected?" />
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={rejectReason.trim().length === 0}
                              loading={busyKey === `${expense.id}:reject`}
                              onClick={() => void runExpenseAction(expense.id, 'reject', () => rejectExpense(state.accessToken, expense.id, { reason: rejectReason.trim() }))}
                            >
                              Submit rejection
                            </Button>
                            <Button variant="secondary" size="sm" onClick={cancelRejectDraft}>
                              Cancel
                            </Button>
                          </div>
                          {rejectError && (
                            <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                              {rejectError}
                            </Text>
                          )}
                        </div>
                      )}
                      <ReceiptUploadPanel expense={expense} accessToken={state.accessToken} onUploaded={expensesState.refetch} />
                    </div>
                  )}
                  emptyIcon="checkCircle"
                  emptyTitle="No Expenses"
                  emptyDescription="No Expenses are visible in your cluster yet."
                />
              </Card>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
