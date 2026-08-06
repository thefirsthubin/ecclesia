import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Badge, Button, Divider, EmptyState, ErrorState, Heading, Input, Skeleton, Text, useTheme } from '@ecclesia/ui-native';

import { useActorSession } from '../../lib/session';
import {
  confirmBankDeposit,
  reconcileTransaction,
  useVerifiedTransactions,
  useWeeklyReconciliation,
} from '../FinanceDashboard/hooks/useFinanceData';

/** Same string-based `amountMinor` -> display formatter this milestone's
 * other Finance screen (`FinanceVerifyScreen.tsx`) already duplicates
 * from `OfferingRecordingScreen.tsx` - see that file's own doc comment
 * for why this is deliberately not shared. */
function formatAmountLabel(amountMinor: string, currency = 'GHS'): string {
  const padded = amountMinor.padStart(3, '0');
  const whole = padded.slice(0, -2);
  const fraction = padded.slice(-2);
  return `${currency} ${whole}.${fraction}`;
}

/**
 * Finance Officer Reconcile - FR-STW-07's weekly bank-deposit comparison
 * (`GET /bank-deposit-confirmations/reconciliation`, `POST
 * /bank-deposit-confirmations`) plus FR-STW-05's per-transaction
 * reconcile action (`POST /financial-transactions/:id/reconcile`) - the
 * PRD groups both under the same "Financial Transaction: reconcile" /
 * "Bank Deposit Confirmation" umbrella (`permission-matrix.ts`'s own
 * section comments), so this screen surfaces both rather than picking
 * one. Fixed to the current calendar week - see `useWeeklyReconciliation`'s
 * own doc comment for the disclosed "no other-week browsing" limitation.
 */
export function FinanceReconcileScreen() {
  const theme = useTheme();
  const session = useActorSession();
  const reconciliationState = useWeeklyReconciliation();
  const verifiedState = useVerifiedTransactions();

  const [depositGroupId, setDepositGroupId] = useState<string | null>(null);
  const [depositAmountText, setDepositAmountText] = useState('');
  const [depositReference, setDepositReference] = useState('');
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositError, setDepositError] = useState<string | undefined>(undefined);

  const [reconcilingId, setReconcilingId] = useState<string | null>(null);
  const [reconcileError, setReconcileError] = useState<string | undefined>(undefined);

  const submitDeposit = async (groupId: string) => {
    setDepositSubmitting(true);
    setDepositError(undefined);
    try {
      await confirmBankDeposit(session.authToken, {
        groupId,
        depositedAmountMinor: depositAmountText.trim(),
        bankReference: depositReference.trim() || undefined,
      });
      setDepositGroupId(null);
      setDepositAmountText('');
      setDepositReference('');
      reconciliationState.refetch();
    } catch (error) {
      setDepositError(error instanceof Error ? error.message : 'Something went wrong confirming this deposit.');
    } finally {
      setDepositSubmitting(false);
    }
  };

  const markReconciled = async (transactionId: string) => {
    setReconcilingId(transactionId);
    setReconcileError(undefined);
    try {
      await reconcileTransaction(session.authToken, transactionId);
      verifiedState.refetch();
    } catch (error) {
      setReconcileError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setReconcilingId(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
      <Heading level={1}>Reconcile</Heading>

      <View style={{ gap: theme.spacing[3] }}>
        <Heading level={3}>This Week's Bank Deposits</Heading>

        {reconciliationState.status === 'loading' && <Skeleton height={64} radius="md" />}
        {reconciliationState.status === 'error' && (
          <ErrorState
            title="Couldn't load this week's reconciliation"
            description={reconciliationState.error.message}
            onRetry={reconciliationState.refetch}
            testId="finance-reconcile-deposits-error"
          />
        )}
        {reconciliationState.status === 'success' &&
          (reconciliationState.data.rows.length === 0 ? (
            <EmptyState icon="landmark" title="No activity this week" description="No Bacenta has offerings or deposits recorded yet." />
          ) : (
            <View style={{ gap: theme.spacing[3] }}>
              {reconciliationState.data.rows.map((row, index) => (
                <View key={row.groupId}>
                  {index > 0 && <Divider />}
                  <View style={{ gap: theme.spacing[2], paddingTop: index > 0 ? theme.spacing[3] : 0 }} testID={`finance-reconcile-row-${row.groupId}`}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text variant="body">{`Verified: ${formatAmountLabel(row.verifiedTotalMinor)}`}</Text>
                      <Badge status={row.matched ? 'success' : 'danger'}>{row.matched ? 'Matched' : 'Unmatched'}</Badge>
                    </View>
                    <Text variant="bodySmall" color={theme.colors.text.secondary}>
                      {row.depositedAmountMinor
                        ? `Deposited: ${formatAmountLabel(row.depositedAmountMinor)}${row.bankReference ? ` (${row.bankReference})` : ''}`
                        : 'No deposit confirmed yet'}
                    </Text>
                    {depositGroupId === row.groupId ? (
                      <View style={{ gap: theme.spacing[2] }}>
                        <Input label="Deposited amount (minor units)" value={depositAmountText} onChangeText={setDepositAmountText} keyboardType="number-pad" placeholder="5000" testId={`finance-reconcile-deposit-amount-${row.groupId}`} />
                        <Input label="Bank reference (optional)" value={depositReference} onChangeText={setDepositReference} testId={`finance-reconcile-deposit-reference-${row.groupId}`} />
                        {depositError && (
                          <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                            {depositError}
                          </Text>
                        )}
                        <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={depositAmountText.trim().length === 0}
                            loading={depositSubmitting}
                            onPress={() => void submitDeposit(row.groupId)}
                            testId={`finance-reconcile-deposit-submit-${row.groupId}`}
                          >
                            Confirm deposit
                          </Button>
                          <Button variant="secondary" size="sm" onPress={() => setDepositGroupId(null)} testId={`finance-reconcile-deposit-cancel-${row.groupId}`}>
                            Cancel
                          </Button>
                        </View>
                      </View>
                    ) : (
                      <Button variant="tertiary" size="sm" onPress={() => setDepositGroupId(row.groupId)} testId={`finance-reconcile-deposit-open-${row.groupId}`}>
                        Confirm deposit
                      </Button>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}
      </View>

      <Divider />

      <View style={{ gap: theme.spacing[3] }}>
        <Heading level={3}>Verified Transactions</Heading>
        {reconcileError && (
          <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
            {reconcileError}
          </Text>
        )}

        {verifiedState.status === 'loading' && <Skeleton height={48} radius="md" />}
        {verifiedState.status === 'error' && (
          <ErrorState title="Couldn't load Verified transactions" description={verifiedState.error.message} onRetry={verifiedState.refetch} testId="finance-reconcile-verified-error" />
        )}
        {verifiedState.status === 'success' &&
          (verifiedState.data.length === 0 ? (
            <EmptyState icon="checkCircle" title="Nothing awaiting reconciliation" tone="positive" />
          ) : (
            <View style={{ gap: theme.spacing[3] }}>
              {verifiedState.data.map((transaction, index) => (
                <View key={transaction.id}>
                  {index > 0 && <Divider />}
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: index > 0 ? theme.spacing[3] : 0 }}
                    testID={`finance-reconcile-transaction-${transaction.id}`}
                  >
                    <Text variant="body">{`${transaction.type} · ${formatAmountLabel(transaction.amountMinor, transaction.currency)}`}</Text>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={reconcilingId === transaction.id}
                      onPress={() => void markReconciled(transaction.id)}
                      testId={`finance-reconcile-mark-${transaction.id}`}
                    >
                      Mark Reconciled
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          ))}
      </View>
    </ScrollView>
  );
}
