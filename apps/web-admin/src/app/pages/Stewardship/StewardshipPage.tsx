import { useState } from 'react';
import { Badge, Button, Card, Divider, EmptyState, ErrorState, Heading, Input, RadioGroup, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import {
  INBOUND_TRANSACTION_STATE_VALUES,
  OUTBOUND_TRANSACTION_STATE_VALUES,
} from '@ecclesia/contracts';
import type { ExpenseResponseDto, FinancialTransactionChannelDto, FinancialTransactionResponseDto, RecordFinancialTransactionInput } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { GroupNameText } from '../People/GroupNameText';
import { PersonNameText } from '../PastoralCare/PersonNameText';
import { ReceiptUploadPanel } from './ReceiptUploadPanel';
import {
  approveExpense,
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
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
  const { state } = useAuth();
  const [transactionStateFilter, setTransactionStateFilter] = useState<string | undefined>(undefined);
  const [expenseStateFilter, setExpenseStateFilter] = useState<string | undefined>(undefined);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [reasonDraftKey, setReasonDraftKey] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState('');

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

  if (state.status !== 'authenticated') return null;

  const transactionsState = useTransactionQueue(state.accessToken, transactionStateFilter);
  const expensesState = useExpenseQueue(state.accessToken, expenseStateFilter);

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
  };
  const cancelReasonDraft = () => {
    setReasonDraftKey(null);
    setReasonText('');
  };

  const runTransactionAction = async (id: string, action: string, run: () => Promise<FinancialTransactionResponseDto>) => {
    setBusyKey(`${id}:${action}`);
    try {
      await run();
      transactionsState.refetch();
      cancelReasonDraft();
    } finally {
      setBusyKey(null);
    }
  };

  const runExpenseAction = async (id: string, action: string, run: () => Promise<ExpenseResponseDto>) => {
    setBusyKey(`${id}:${action}`);
    try {
      await run();
      expensesState.refetch();
      cancelReasonDraft();
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5], maxWidth: 780 }}>
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
                <Button variant="tertiary" size="sm" onClick={closeRecordForm}>
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
            {transactionsState.data.length === 0 ? (
              <EmptyState icon="checkCircle" title="No Financial Transactions" description="No Financial Transactions are visible in your current scope yet." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                {transactionsState.data.map((transaction, index) => {
                  const reasonKey = `${transaction.id}:flag`;
                  return (
                    <div key={transaction.id}>
                      {index > 0 && <Divider />}
                      <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[3] }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                              <Text variant="bodySmall">{transaction.type}</Text>
                              <Badge status={TRANSACTION_STATE_BADGE[transaction.currentState] ?? 'neutral'}>{transaction.currentState}</Badge>
                            </div>
                            <Text variant="caption" color={theme.colors.text.secondary}>
                              {formatAmountMinor(transaction.amountMinor, transaction.currency)}
                              {transaction.channel ? ` · ${transaction.channel}` : ''}
                              {transaction.sourceGroupId ? (
                                <>
                                  {' · '}
                                  <GroupNameText groupId={transaction.sourceGroupId} />
                                </>
                              ) : null}
                              {transaction.recordedByPersonId ? (
                                <>
                                  {' · Recorded by '}
                                  <PersonNameText personId={transaction.recordedByPersonId} />
                                </>
                              ) : null}
                              {` · ${formatDate(transaction.createdAt)}`}
                            </Text>
                          </div>
                          <div style={{ display: 'flex', gap: theme.spacing[2] }}>
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
                                <Button variant="danger" size="sm" onClick={() => openReasonDraft(reasonKey)} accessibilityLabel={`Flag transaction ${transaction.id}`}>
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
                        </div>
                        {reasonDraftKey === reasonKey && (
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
                            <Button variant="tertiary" size="sm" onClick={cancelReasonDraft}>
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                <Button variant="tertiary" size="sm" onClick={closeExpenseForm}>
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
            {expensesState.data.length === 0 ? (
              <EmptyState icon="checkCircle" title="No Expenses" description="No Expenses are visible in your current scope yet." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                {expensesState.data.map((expense, index) => {
                  const reasonKey = `${expense.id}:reject`;
                  return (
                    <div key={expense.id}>
                      {index > 0 && <Divider />}
                      <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[3] }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                              <Text variant="bodySmall">{expense.description}</Text>
                              <Badge status={EXPENSE_STATE_BADGE[expense.currentState] ?? 'neutral'}>{expense.currentState}</Badge>
                            </div>
                            <Text variant="caption" color={theme.colors.text.secondary}>
                              {formatAmountMinor(expense.amountMinor, expense.currency)}
                              {expense.category ? ` · ${expense.category}` : ''}
                              {' · Requested by '}
                              <PersonNameText personId={expense.requestedByPersonId} />
                              {` · ${formatDate(expense.createdAt)}`}
                            </Text>
                          </div>
                          <div style={{ display: 'flex', gap: theme.spacing[2] }}>
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
                                <Button variant="danger" size="sm" onClick={() => openReasonDraft(reasonKey)} accessibilityLabel={`Reject expense ${expense.id}`}>
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
                        </div>
                        {reasonDraftKey === reasonKey && (
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
                            <Button variant="tertiary" size="sm" onClick={cancelReasonDraft}>
                              Cancel
                            </Button>
                          </div>
                        )}
                        <ReceiptUploadPanel expense={expense} accessToken={state.accessToken} onUploaded={expensesState.refetch} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
