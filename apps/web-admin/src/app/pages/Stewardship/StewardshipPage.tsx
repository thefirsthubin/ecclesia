import { useState } from 'react';
import { Badge, Button, Card, ErrorState, Heading, Input, RadioGroup, Skeleton, Table, Text, useTheme, useToast } from '@ecclesia/ui-web';
import type { TableColumn } from '@ecclesia/ui-web';
import {
  INBOUND_TRANSACTION_STATE_VALUES,
  OUTBOUND_TRANSACTION_STATE_VALUES,
} from '@ecclesia/contracts';
import type {
  ExpenseResponseDto,
  FinancialTransactionChannelDto,
  FinancialTransactionResponseDto,
  ReconciliationRowDto,
  RecordFinancialTransactionInput,
} from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../lib/api-client';
import { GroupNameText } from '../People/GroupNameText';
import { PersonNameText } from '../PastoralCare/PersonNameText';
import { ReceiptUploadPanel } from './ReceiptUploadPanel';
import {
  approveExpense,
  confirmBankDeposit,
  escalateTransaction,
  flagTransaction,
  formatAmountMinor,
  parseAmountToMinorUnits,
  payExpense,
  reconcileTransaction,
  RECORD_TRANSACTION_CHANNEL_OPTIONS,
  RECORD_TRANSACTION_TYPE_OPTIONS,
  recordTransaction,
  rejectExpense,
  requestExpense,
  useExpenseQueue,
  useTransactionQueue,
  useWeeklyReconciliation,
  verifyTransaction,
} from './useStewardshipData';

const TRANSACTION_STATE_BADGE: Record<string, 'neutral' | 'info' | 'warning' | 'danger' | 'success'> = {
  RECORDED: 'info',
  VERIFIED: 'success',
  FLAGGED: 'warning',
  UNDER_INVESTIGATION: 'danger',
  RECONCILED: 'success',
};

const EXPENSE_STATE_BADGE: Record<string, 'neutral' | 'info' | 'warning' | 'danger' | 'success'> = {
  REQUESTED: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
  PAID: 'success',
  RECEIPT_RETAINED: 'success',
};

/** `[UX Design Implementation]` Final UX Design Specification §19 (Phase
 * 5 Stewardship workflow UI) - the Type column's display label, reusing
 * `RECORD_TRANSACTION_TYPE_OPTIONS`'s own labels (the exact same ones the
 * Record Transaction form already shows) rather than a second, separately
 * maintained copy. Falls back to the raw wire value for anything not in
 * that list (e.g. a legacy or `EXPENSE`-type row) - never hides a real
 * value just because it isn't in the curated create-form list. */
const TRANSACTION_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  RECORD_TRANSACTION_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

const CHANNEL_LABEL: Record<string, string> = Object.fromEntries(RECORD_TRANSACTION_CHANNEL_OPTIONS.map((option) => [option.value, option.label]));

/** Best-effort extraction of the server's actual denial/conflict reason -
 * same precedent as `GatheringsListPage.tsx`'s own `extractErrorMessage`.
 * `[UX Design Implementation]` Final UX Design Specification §19 (Phase 5
 * Stewardship workflow UI) - now also used by `runTransactionAction`/
 * `runExpenseAction` (previously had no error handling at all - see
 * their own doc comment); Record Transaction/Request Expense keep their
 * own generic `error.message` shape unchanged. */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.body && typeof error.body === 'object' && 'message' in error.body) {
    const message = (error.body as { message: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every((entry) => typeof entry === 'string')) return message.join('; ');
  }
  return error instanceof Error ? error.message : fallback;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/** `[UX Design Implementation]` Final UX Design Specification §19 (Phase
 * 5 Stewardship workflow UI) - the Reconciliation table's Difference
 * column ("difference where the existing data supports it"). Pure
 * display arithmetic on two real, already-displayed minor-unit amounts
 * (`depositedAmountMinor - verifiedTotalMinor`) - the same `Number()`
 * conversion `formatAmountMinor` itself already uses for display, not a
 * new reconciliation calculation: the backend's own `matched` boolean
 * remains the sole authority on whether a row is actually a match, this
 * only makes the size of a mismatch visible rather than making the
 * caller re-read two separate amounts and subtract in their head. */
function formatDifferenceMinor(depositedAmountMinor: string, verifiedTotalMinor: string, currency: string): string {
  const differenceMinor = Number(depositedAmountMinor) - Number(verifiedTotalMinor);
  const sign = differenceMinor > 0 ? '+' : '';
  const major = differenceMinor / 100;
  return `${sign}${currency} ${major.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * PRD §16.5's "Financial Transaction verification queue" and "Expense
 * approval queue" surfaces, in one page: both list endpoints resolve to
 * the same Branch-wide scope (see `useStewardshipData.ts`'s doc comments),
 * so there's no per-role split the way Ministry's Basonta
 * directory-vs-roster view needed. See `STEWARDSHIP_PAGE_DESIGN_NOTES.md`
 * for the full scope reasoning, including why Project/Pledge surfaces are
 * still not part of this page.
 *
 * `[Stewardship gaps sprint]` **Record Transaction** and **Request
 * Expense** are now built - each queue section gets its own inline
 * "+ Record"/"+ Request" reveal (the same collapsible-inline-form pattern
 * Flag/Reject/Escalate already established on this page, not a `Modal` -
 * still none exists in `libs/ui/web`). Neither pre-empts the backend's own
 * 403 for a role that can't call the endpoint (e.g. `RESIDENT_PASTOR` on
 * Record Transaction, `ADMIN` on either) - the button is always visible,
 * the same "don't pre-empt the backend" precedent this page's `state`
 * filter already established for queue *visibility*.
 */
export function StewardshipPage() {
  const theme = useTheme();
  const toast = useToast();
  const { state } = useAuth();
  const [transactionStateFilter, setTransactionStateFilter] = useState<string | undefined>(undefined);
  const [expenseStateFilter, setExpenseStateFilter] = useState<string | undefined>(undefined);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [reasonDraftKey, setReasonDraftKey] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>(undefined);

  const [recordFormOpen, setRecordFormOpen] = useState(false);
  const [recordType, setRecordType] = useState<RecordFinancialTransactionInput['type']>('OFFERING');
  const [recordChannel, setRecordChannel] = useState<FinancialTransactionChannelDto>('CASH');
  const [recordAmountText, setRecordAmountText] = useState('');
  const [recordSubmitting, setRecordSubmitting] = useState(false);
  const [recordSubmitError, setRecordSubmitError] = useState<string | undefined>(undefined);

  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [expenseAmountText, setExpenseAmountText] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [expenseSubmitError, setExpenseSubmitError] = useState<string | undefined>(undefined);

  const [reconciliationWeekStartDate, setReconciliationWeekStartDate] = useState('');
  const [confirmingGroupId, setConfirmingGroupId] = useState<string | null>(null);
  const [confirmAmountText, setConfirmAmountText] = useState('');
  const [confirmBankReference, setConfirmBankReference] = useState('');
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | undefined>(undefined);

  if (state.status !== 'authenticated') return null;

  const transactionsState = useTransactionQueue(state.accessToken, transactionStateFilter);
  const expensesState = useExpenseQueue(state.accessToken, expenseStateFilter);
  const reconciliationState = useWeeklyReconciliation(state.accessToken, reconciliationWeekStartDate || undefined);

  const recordAmountMinor = parseAmountToMinorUnits(recordAmountText);
  const recordAmountError = recordAmountText.length > 0 && recordAmountMinor === null ? 'Enter a valid amount greater than 0' : undefined;

  const closeRecordForm = () => {
    setRecordFormOpen(false);
    setRecordType('OFFERING');
    setRecordChannel('CASH');
    setRecordAmountText('');
    setRecordSubmitError(undefined);
  };

  const submitRecordTransaction = async () => {
    if (!recordAmountMinor) {
      setRecordSubmitError('Enter a valid amount greater than 0');
      return;
    }
    setRecordSubmitting(true);
    setRecordSubmitError(undefined);
    try {
      // `BACENTA_LEADER` is the only role that ever needs `sourceGroupId` -
      // and always their own Bacenta (`GET /auth/me`'s `bacentaId`), never
      // a picked-Group - see `recordTransaction`'s own doc comment.
      // `TREASURER`/`MEMBER` (`SELF` scope) omit it entirely.
      const sourceGroupId = state.actor.role === 'BACENTA_LEADER' ? state.actor.bacentaId : undefined;
      await recordTransaction(state.accessToken, { type: recordType, sourceGroupId, channel: recordChannel, amountMinor: recordAmountMinor });
      transactionsState.refetch();
      closeRecordForm();
    } catch (error) {
      setRecordSubmitError(error instanceof Error ? error.message : 'Something went wrong recording this transaction.');
    } finally {
      setRecordSubmitting(false);
    }
  };

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
    if (!expenseAmountMinor) {
      setExpenseSubmitError('Enter a valid amount greater than 0');
      return;
    }
    if (expenseDescription.trim().length === 0) {
      setExpenseSubmitError('A description is required');
      return;
    }
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
      setExpenseSubmitError(error instanceof Error ? error.message : 'Something went wrong requesting this expense.');
    } finally {
      setExpenseSubmitting(false);
    }
  };

  const openReasonDraft = (key: string) => {
    setReasonDraftKey(key);
    setReasonText('');
    setReasonError(undefined);
  };
  const cancelReasonDraft = () => {
    setReasonDraftKey(null);
    setReasonText('');
    setReasonError(undefined);
  };

  /** Labels for the (rare) success toast a queue action gets - only the
   * four single-click, no-reveal-form actions (Verify/Escalate/
   * Reconcile/Approve/Pay) need one at all, since Flag/Reject already
   * have their own reveal form to close on success, which is itself a
   * clear success signal (matches `submitCreate`'s own precedent). */
  const ACTION_SUCCESS_LABEL: Record<string, string> = {
    verify: 'Transaction verified.',
    escalate: 'Transaction escalated.',
    reconcile: 'Transaction reconciled.',
    approve: 'Expense approved.',
    pay: 'Expense marked paid.',
  };

  /** `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 5 Stewardship workflow UI) - previously had no `catch` at
   * all, so a failed Verify/Escalate/Reconcile/Flag (e.g. the backend's
   * real same-actor-verification-restriction 409, or an RBAC denial)
   * left the button simply no longer loading, with no success or error
   * signal - exactly the "silent failure" the phase brief explicitly
   * forbids. Flag surfaces its error inline in the still-open reveal
   * form (mirrors `submitCreate`'s own pattern elsewhere on this page);
   * the three single-click actions with no form of their own to show an
   * inline error in use a toast instead (the same pattern Pastoral
   * Care's Complete action established). */
  const runTransactionAction = async (id: string, action: string, run: () => Promise<FinancialTransactionResponseDto>) => {
    setBusyKey(`${id}:${action}`);
    if (action === 'flag') setReasonError(undefined);
    try {
      await run();
      transactionsState.refetch();
      cancelReasonDraft();
      if (action !== 'flag' && ACTION_SUCCESS_LABEL[action]) {
        toast.show({ status: 'success', message: ACTION_SUCCESS_LABEL[action] });
      }
    } catch (error) {
      const message = extractErrorMessage(error, 'Something went wrong with this action.');
      if (action === 'flag') {
        setReasonError(message);
      } else {
        toast.show({ status: 'danger', message });
      }
    } finally {
      setBusyKey(null);
    }
  };

  const runExpenseAction = async (id: string, action: string, run: () => Promise<ExpenseResponseDto>) => {
    setBusyKey(`${id}:${action}`);
    if (action === 'reject') setReasonError(undefined);
    try {
      await run();
      expensesState.refetch();
      cancelReasonDraft();
      if (action !== 'reject' && ACTION_SUCCESS_LABEL[action]) {
        toast.show({ status: 'success', message: ACTION_SUCCESS_LABEL[action] });
      }
    } catch (error) {
      const message = extractErrorMessage(error, 'Something went wrong with this action.');
      if (action === 'reject') {
        setReasonError(message);
      } else {
        toast.show({ status: 'danger', message });
      }
    } finally {
      setBusyKey(null);
    }
  };

  const confirmAmountMinor = parseAmountToMinorUnits(confirmAmountText);
  const confirmAmountError = confirmAmountText.length > 0 && confirmAmountMinor === null ? 'Enter a valid amount greater than 0' : undefined;

  const openConfirmDeposit = (groupId: string) => {
    setConfirmingGroupId(groupId);
    setConfirmAmountText('');
    setConfirmBankReference('');
    setConfirmError(undefined);
  };
  const cancelConfirmDeposit = () => {
    setConfirmingGroupId(null);
    setConfirmError(undefined);
  };
  const submitConfirmDeposit = async (groupId: string) => {
    if (!confirmAmountMinor || !reconciliationWeekStartDate) return;
    setConfirmSubmitting(true);
    setConfirmError(undefined);
    try {
      await confirmBankDeposit(state.accessToken, {
        groupId,
        weekStartDate: reconciliationWeekStartDate,
        depositedAmountMinor: confirmAmountMinor,
        bankReference: confirmBankReference.trim().length > 0 ? confirmBankReference.trim() : undefined,
      });
      reconciliationState.refetch();
      setConfirmingGroupId(null);
    } catch (error) {
      setConfirmError(extractErrorMessage(error, 'Something went wrong confirming this deposit.'));
    } finally {
      setConfirmSubmitting(false);
    }
  };

  /**
   * `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 5 Stewardship workflow UI) - split from a 3-column shape
   * (Type+status-badge, one caption cramming amount/channel/group/
   * recorder/date together, Actions) into the explicit columns the
   * phase brief itself names: Date / Type / Group / Channel / Amount /
   * Recorder / Status / Actions. Same underlying fields throughout, no
   * new data - this queue's whole job is deciding what to do with each
   * transaction, and that decision depends on exactly these facts, each
   * now independently scannable down its own column instead of buried
   * in a sentence.
   */
  const transactionColumns: TableColumn<FinancialTransactionResponseDto>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (transaction) => (
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {formatDate(transaction.createdAt)}
        </Text>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (transaction) => <Text variant="bodySmall">{TRANSACTION_TYPE_LABEL[transaction.type] ?? transaction.type}</Text>,
    },
    {
      key: 'group',
      header: 'Group',
      render: (transaction) =>
        transaction.sourceGroupId ? (
          <GroupNameText groupId={transaction.sourceGroupId} />
        ) : (
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            —
          </Text>
        ),
    },
    {
      key: 'channel',
      header: 'Channel',
      render: (transaction) => (
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {transaction.channel ? (CHANNEL_LABEL[transaction.channel] ?? transaction.channel) : '—'}
        </Text>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (transaction) => <Text variant="bodySmall">{formatAmountMinor(transaction.amountMinor, transaction.currency)}</Text>,
    },
    {
      key: 'recorder',
      header: 'Recorder',
      render: (transaction) =>
        transaction.recordedByPersonId ? (
          <PersonNameText personId={transaction.recordedByPersonId} />
        ) : (
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            —
          </Text>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (transaction) => <Badge status={TRANSACTION_STATE_BADGE[transaction.currentState] ?? 'neutral'}>{transaction.currentState}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (transaction) => (
        <div style={{ display: 'flex', gap: theme.spacing[2], justifyContent: 'flex-end' }}>
          {transaction.currentState === 'RECORDED' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                loading={busyKey === `${transaction.id}:verify`}
                onClick={() => void runTransactionAction(transaction.id, 'verify', () => verifyTransaction(state.accessToken, transaction.id))}
                accessibilityLabel={`Verify transaction ${transaction.id}`}
              >
                Verify
              </Button>
              <Button variant="danger" size="sm" onClick={() => openReasonDraft(`${transaction.id}:flag`)} accessibilityLabel={`Flag transaction ${transaction.id}`}>
                Flag
              </Button>
            </>
          )}
          {transaction.currentState === 'FLAGGED' && (
            <Button
              variant="secondary"
              size="sm"
              loading={busyKey === `${transaction.id}:escalate`}
              onClick={() => void runTransactionAction(transaction.id, 'escalate', () => escalateTransaction(state.accessToken, transaction.id))}
              accessibilityLabel={`Escalate transaction ${transaction.id}`}
            >
              Escalate
            </Button>
          )}
          {transaction.currentState === 'VERIFIED' && (
            <Button
              variant="secondary"
              size="sm"
              loading={busyKey === `${transaction.id}:reconcile`}
              onClick={() => void runTransactionAction(transaction.id, 'reconcile', () => reconcileTransaction(state.accessToken, transaction.id))}
              accessibilityLabel={`Reconcile transaction ${transaction.id}`}
            >
              Reconcile
            </Button>
          )}
        </div>
      ),
    },
  ];

  /**
   * `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 5 Stewardship workflow UI) - same explicit-column treatment
   * as `transactionColumns` above. "What is this expense waiting for?"
   * (the phase brief's own framing) is easier to answer once Amount/
   * Category/Requester/Status are each their own column rather than one
   * caption sentence.
   */
  const expenseColumns: TableColumn<ExpenseResponseDto>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (expense) => (
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {formatDate(expense.createdAt)}
        </Text>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (expense) => <Text variant="bodySmall">{expense.description}</Text>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (expense) => (
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {expense.category ?? '—'}
        </Text>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (expense) => <Text variant="bodySmall">{formatAmountMinor(expense.amountMinor, expense.currency)}</Text>,
    },
    {
      key: 'requestedBy',
      header: 'Requested by',
      render: (expense) => <PersonNameText personId={expense.requestedByPersonId} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (expense) => <Badge status={EXPENSE_STATE_BADGE[expense.currentState] ?? 'neutral'}>{expense.currentState}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (expense) => (
        <div style={{ display: 'flex', gap: theme.spacing[2], justifyContent: 'flex-end' }}>
          {expense.currentState === 'REQUESTED' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                loading={busyKey === `${expense.id}:approve`}
                onClick={() => void runExpenseAction(expense.id, 'approve', () => approveExpense(state.accessToken, expense.id))}
                accessibilityLabel={`Approve expense ${expense.id}`}
              >
                Approve
              </Button>
              <Button variant="danger" size="sm" onClick={() => openReasonDraft(`${expense.id}:reject`)} accessibilityLabel={`Reject expense ${expense.id}`}>
                Reject
              </Button>
            </>
          )}
          {expense.currentState === 'APPROVED' && (
            <Button
              variant="secondary"
              size="sm"
              loading={busyKey === `${expense.id}:pay`}
              onClick={() => void runExpenseAction(expense.id, 'pay', () => payExpense(state.accessToken, expense.id))}
              accessibilityLabel={`Pay expense ${expense.id}`}
            >
              Pay
            </Button>
          )}
        </div>
      ),
    },
  ];

  /**
   * `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 5 Stewardship workflow UI) - the phase brief's own
   * reconciliation column list: Bacenta / verified amount / confirmed
   * deposit amount / difference (where the data supports it) / match
   * status / reference. "Week" is deliberately not a per-row column -
   * the whole table is already scoped to one chosen week (the date
   * picker above it), so every row would show the identical value,
   * exactly the "column simply because the data exists" the brief warns
   * against.
   */
  const reconciliationColumns: TableColumn<ReconciliationRowDto>[] = [
    {
      key: 'group',
      header: 'Bacenta',
      render: (row) => <GroupNameText groupId={row.groupId} />,
    },
    {
      key: 'verified',
      header: 'Verified',
      align: 'right',
      render: (row) => <Text variant="bodySmall">{formatAmountMinor(row.verifiedTotalMinor, 'GHS')}</Text>,
    },
    {
      key: 'deposited',
      header: 'Deposited',
      align: 'right',
      render: (row) => (
        <Text variant="bodySmall" color={row.depositedAmountMinor === null ? theme.colors.text.secondary : theme.colors.text.primary}>
          {row.depositedAmountMinor !== null ? formatAmountMinor(row.depositedAmountMinor, 'GHS') : '—'}
        </Text>
      ),
    },
    {
      key: 'difference',
      header: 'Difference',
      align: 'right',
      render: (row) => (
        <Text variant="bodySmall" color={row.matched || row.depositedAmountMinor === null ? theme.colors.text.secondary : theme.colors.status.danger.strong}>
          {row.depositedAmountMinor !== null ? formatDifferenceMinor(row.depositedAmountMinor, row.verifiedTotalMinor, 'GHS') : '—'}
        </Text>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge status={row.matched ? 'success' : row.depositedAmountMinor === null ? 'warning' : 'danger'}>
          {row.matched ? 'Matched' : row.depositedAmountMinor === null ? 'Not yet confirmed' : 'Mismatch'}
        </Badge>
      ),
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (row) => (
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {row.bankReference ?? '—'}
        </Text>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) =>
        row.depositedAmountMinor === null && confirmingGroupId !== row.groupId ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="sm" onClick={() => openConfirmDeposit(row.groupId)} accessibilityLabel={`Confirm deposit for group ${row.groupId}`}>
              Confirm Deposit
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5], maxWidth: 900 }}>
      <Heading level={1}>Stewardship</Heading>

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[3] }}>
          <Heading level={2}>Financial Transaction verification queue</Heading>
          {!recordFormOpen && (
            <Button variant="secondary" size="sm" onClick={() => setRecordFormOpen(true)} accessibilityLabel="Record a new Financial Transaction">
              + Record Transaction
            </Button>
          )}
        </div>

        {recordFormOpen && (
          <Card padding={6} testId="record-transaction-form">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
              <RadioGroup
                label="Type"
                name="record-transaction-type"
                options={RECORD_TRANSACTION_TYPE_OPTIONS}
                value={recordType}
                onChange={(value) => setRecordType(value as RecordFinancialTransactionInput['type'])}
              />
              <RadioGroup
                label="Channel"
                name="record-transaction-channel"
                options={RECORD_TRANSACTION_CHANNEL_OPTIONS}
                value={recordChannel}
                onChange={(value) => setRecordChannel(value as FinancialTransactionChannelDto)}
                direction="row"
              />
              <Input
                label="Amount (GHS)"
                value={recordAmountText}
                onChange={(event) => setRecordAmountText(event.target.value)}
                placeholder="0.00"
                error={recordAmountError}
                testId="record-transaction-amount"
              />
              {recordSubmitError && (
                <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                  {recordSubmitError}
                </Text>
              )}
              <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={recordAmountText.length === 0 || Boolean(recordAmountError)}
                  loading={recordSubmitting}
                  onClick={() => void submitRecordTransaction()}
                  testId="record-transaction-submit"
                >
                  Record
                </Button>
                <Button variant="secondary" size="sm" onClick={closeRecordForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
          <Button
            variant={transactionStateFilter === undefined ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setTransactionStateFilter(undefined)}
          >
            All
          </Button>
          {INBOUND_TRANSACTION_STATE_VALUES.map((value) => (
            <Button
              key={value}
              variant={transactionStateFilter === value ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setTransactionStateFilter(value)}
            >
              {value}
            </Button>
          ))}
        </div>

        {transactionsState.status === 'loading' && (
          <Card padding={6}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <Skeleton height={40} />
              <Skeleton height={40} />
            </div>
          </Card>
        )}

        {transactionsState.status === 'error' && (
          <Card padding={6}>
            <ErrorState title="Couldn't load Financial Transactions" onRetry={transactionsState.refetch} />
          </Card>
        )}

        {transactionsState.status === 'success' && (
          <Card padding={6} testId="transaction-queue-card">
            <Table
              testId="transaction-queue-table"
              columns={transactionColumns}
              data={transactionsState.data}
              getRowId={(transaction) => transaction.id}
              isRowExpanded={(transaction) => reasonDraftKey === `${transaction.id}:flag`}
              renderRowDetail={(transaction) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }} data-testid="flag-form">
                  <div style={{ display: 'flex', gap: theme.spacing[2], alignItems: 'flex-end' }}>
                    <Input label="Reason" value={reasonText} onChange={(event) => setReasonText(event.target.value)} placeholder="Why is this being flagged?" />
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={reasonText.trim().length === 0}
                      loading={busyKey === `${transaction.id}:flag`}
                      onClick={() =>
                        void runTransactionAction(transaction.id, 'flag', () => flagTransaction(state.accessToken, transaction.id, { reason: reasonText.trim() }))
                      }
                    >
                      Submit flag
                    </Button>
                    <Button variant="secondary" size="sm" onClick={cancelReasonDraft}>
                      Cancel
                    </Button>
                  </div>
                  {reasonError && (
                    <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                      {reasonError}
                    </Text>
                  )}
                </div>
              )}
              emptyIcon="checkCircle"
              emptyTitle="No Financial Transactions"
              emptyDescription="No Financial Transactions are visible in your current scope yet."
            />
          </Card>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[3] }}>
          <Heading level={2}>Expense approval queue</Heading>
          {!expenseFormOpen && (
            <Button variant="secondary" size="sm" onClick={() => setExpenseFormOpen(true)} accessibilityLabel="Request a new Expense">
              + Request Expense
            </Button>
          )}
        </div>

        {expenseFormOpen && (
          <Card padding={6} testId="request-expense-form">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
              <Input
                label="Amount (GHS)"
                value={expenseAmountText}
                onChange={(event) => setExpenseAmountText(event.target.value)}
                placeholder="0.00"
                error={expenseAmountError}
                testId="request-expense-amount"
              />
              <Input
                label="Description"
                value={expenseDescription}
                onChange={(event) => setExpenseDescription(event.target.value)}
                placeholder="What is this expense for?"
                testId="request-expense-description"
              />
              <Input
                label="Category (optional)"
                value={expenseCategory}
                onChange={(event) => setExpenseCategory(event.target.value)}
                placeholder="e.g. Facilities, Ministry supplies"
                testId="request-expense-category"
              />
              {expenseSubmitError && (
                <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                  {expenseSubmitError}
                </Text>
              )}
              <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={expenseAmountText.length === 0 || Boolean(expenseAmountError) || expenseDescription.trim().length === 0}
                  loading={expenseSubmitting}
                  onClick={() => void submitRequestExpense()}
                  testId="request-expense-submit"
                >
                  Request
                </Button>
                <Button variant="secondary" size="sm" onClick={closeExpenseForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
          <Button variant={expenseStateFilter === undefined ? 'primary' : 'secondary'} size="sm" onClick={() => setExpenseStateFilter(undefined)}>
            All
          </Button>
          {OUTBOUND_TRANSACTION_STATE_VALUES.map((value) => (
            <Button key={value} variant={expenseStateFilter === value ? 'primary' : 'secondary'} size="sm" onClick={() => setExpenseStateFilter(value)}>
              {value}
            </Button>
          ))}
        </div>

        {expensesState.status === 'loading' && (
          <Card padding={6}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <Skeleton height={40} />
              <Skeleton height={40} />
            </div>
          </Card>
        )}

        {expensesState.status === 'error' && (
          <Card padding={6}>
            <ErrorState title="Couldn't load Expenses" onRetry={expensesState.refetch} />
          </Card>
        )}

        {expensesState.status === 'success' && (
          <Card padding={6} testId="expense-queue-card">
            <Table
              testId="expense-queue-table"
              columns={expenseColumns}
              data={expensesState.data}
              getRowId={(expense) => expense.id}
              // `[Stewardship gaps sprint]` `ReceiptUploadPanel` is always
              // rendered per Expense row, not just while a reject-reason
              // draft is open (unlike the Transaction/Reconciliation
              // tables' conditional reveal below) - `isRowExpanded` is
              // therefore unconditional here, and `renderRowDetail`
              // itself decides whether the reject form also shows.
              isRowExpanded={() => true}
              renderRowDetail={(expense) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                  {reasonDraftKey === `${expense.id}:reject` && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }} data-testid="reject-form">
                      <div style={{ display: 'flex', gap: theme.spacing[2], alignItems: 'flex-end' }}>
                        <Input label="Reason" value={reasonText} onChange={(event) => setReasonText(event.target.value)} placeholder="Why is this being rejected?" />
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={reasonText.trim().length === 0}
                          loading={busyKey === `${expense.id}:reject`}
                          onClick={() => void runExpenseAction(expense.id, 'reject', () => rejectExpense(state.accessToken, expense.id, { reason: reasonText.trim() }))}
                        >
                          Submit rejection
                        </Button>
                        <Button variant="secondary" size="sm" onClick={cancelReasonDraft}>
                          Cancel
                        </Button>
                      </div>
                      {reasonError && (
                        <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                          {reasonError}
                        </Text>
                      )}
                    </div>
                  )}
                  <ReceiptUploadPanel expense={expense} accessToken={state.accessToken} onUploaded={expensesState.refetch} />
                </div>
              )}
              emptyIcon="checkCircle"
              emptyTitle="No Expenses"
              emptyDescription="No Expenses are visible in your current scope yet."
            />
          </Card>
        )}
      </div>

      {/* `[Bank Deposit Confirmation milestone]` FR-STW-07's bank-deposit
          comparison half. Unlike Transaction/Expense above, this is not a
          queue of existing records with a state to transition - a
          `BankDepositConfirmation` is created fresh per Bacenta/week
          (`@@unique([groupId, weekStartDate])`, confirmed via
          `BankDepositConfirmationRepository`), so "Confirm Deposit" is a
          create action per unmatched row, not a status button. No client
          role check - only `TREASURER` (BRANCH) actually holds
          `stewardship.bank_deposit.confirm` (traced against
          `permission-matrix.ts`), the backend's real response is what
          every other caller sees. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        <Heading level={2}>Bank Deposit Reconciliation</Heading>
        <Input
          label="Week starting"
          type="date"
          value={reconciliationWeekStartDate}
          onChange={(event) => setReconciliationWeekStartDate(event.target.value)}
          testId="reconciliation-week-start"
        />

        {reconciliationWeekStartDate === '' && (
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            Choose a week to view its reconciliation.
          </Text>
        )}

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
            <ErrorState title="Couldn't load the weekly reconciliation" onRetry={reconciliationState.refetch} />
          </Card>
        )}

        {reconciliationState.status === 'success' && (
          <Card padding={6} testId="reconciliation-card">
            <Table
              testId="reconciliation-table"
              columns={reconciliationColumns}
              data={reconciliationState.data.rows}
              getRowId={(row) => row.groupId}
              isRowExpanded={(row) => confirmingGroupId === row.groupId}
              renderRowDetail={(row) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }} data-testid="confirm-deposit-form">
                  {/* `[UX Design Implementation]` Final UX Design
                      Specification §19 (Phase 5 Stewardship workflow UI)
                      - "make [immutability] clear before confirmation."
                      Purely informational copy describing real, existing
                      backend behavior (`confirmBankDeposit`'s own doc
                      comment: no `PATCH`/delete route exists anywhere on
                      this controller) - not a new rule or workflow. */}
                  <Text variant="bodySmall" color={theme.colors.text.secondary}>
                    This creates a permanent record for this Bacenta and week - it can&apos;t be edited or deleted afterward.
                  </Text>
                  <Input
                    label="Deposited amount (GHS)"
                    value={confirmAmountText}
                    onChange={(event) => setConfirmAmountText(event.target.value)}
                    placeholder="0.00"
                    error={confirmAmountError}
                    testId="confirm-deposit-amount"
                  />
                  <Input
                    label="Bank reference (optional)"
                    value={confirmBankReference}
                    onChange={(event) => setConfirmBankReference(event.target.value)}
                    placeholder="e.g. slip number"
                  />
                  {confirmError && (
                    <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                      {confirmError}
                    </Text>
                  )}
                  <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={confirmAmountText.length === 0 || Boolean(confirmAmountError)}
                      loading={confirmSubmitting}
                      onClick={() => void submitConfirmDeposit(row.groupId)}
                      testId="confirm-deposit-submit"
                    >
                      Confirm
                    </Button>
                    <Button variant="secondary" size="sm" onClick={cancelConfirmDeposit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              emptyIcon="checkCircle"
              emptyTitle="Nothing to reconcile"
              emptyDescription="No Verified transactions or bank deposit confirmations exist for this week yet."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
