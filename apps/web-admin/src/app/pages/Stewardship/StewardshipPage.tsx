import { useState } from 'react';
import { Badge, Button, Card, Divider, EmptyState, ErrorState, Heading, Input, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import {
  INBOUND_TRANSACTION_STATE_VALUES,
  OUTBOUND_TRANSACTION_STATE_VALUES,
} from '@ecclesia/contracts';
import type { ExpenseResponseDto, FinancialTransactionResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { GroupNameText } from '../People/GroupNameText';
import { PersonNameText } from '../PastoralCare/PersonNameText';
import {
  approveExpense,
  escalateTransaction,
  flagTransaction,
  formatAmountMinor,
  payExpense,
  reconcileTransaction,
  rejectExpense,
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
 * for the full scope reasoning, including why Record Transaction/Request
 * Expense/Project/Pledge surfaces are not part of this pass.
 */
export function StewardshipPage() {
  const theme = useTheme();
  const { state } = useAuth();
  const [transactionStateFilter, setTransactionStateFilter] = useState<string | undefined>(undefined);
  const [expenseStateFilter, setExpenseStateFilter] = useState<string | undefined>(undefined);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [reasonDraftKey, setReasonDraftKey] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState('');

  if (state.status !== 'authenticated') return null;

  const transactionsState = useTransactionQueue(state.accessToken, transactionStateFilter);
  const expensesState = useExpenseQueue(state.accessToken, expenseStateFilter);

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
        <Heading level={2}>Financial Transaction verification queue</Heading>
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
        <Heading level={2}>Expense approval queue</Heading>
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
