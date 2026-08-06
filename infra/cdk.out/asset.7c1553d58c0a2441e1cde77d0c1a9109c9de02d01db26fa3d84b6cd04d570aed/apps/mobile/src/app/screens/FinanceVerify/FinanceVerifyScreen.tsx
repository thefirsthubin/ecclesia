import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Badge, Button, Divider, EmptyState, ErrorState, Heading, Input, Skeleton, Text, useTheme } from '@ecclesia/ui-native';

import { useActorSession } from '../../lib/session';
import { escalateTransaction, flagTransaction, useRecordedTransactions, verifyTransaction } from '../FinanceDashboard/hooks/useFinanceData';

/** `amountMinor` -> a "GHS 50.00"-shaped display string - same
 * string-manipulation approach `OfferingRecordingScreen.tsx`'s own
 * `formatAmountLabel` already established, duplicated here rather than
 * shared for the same "small screen-local glue" reasoning that file's
 * own history already carries in this codebase. */
function formatAmountLabel(amountMinor: string, currency: string): string {
  const padded = amountMinor.padStart(3, '0');
  const whole = padded.slice(0, -2);
  const fraction = padded.slice(-2);
  return `${currency} ${whole}.${fraction}`;
}

/**
 * Finance Officer Verify - FR-STW-03/04's verification queue: every
 * `RECORDED` inbound transaction, with Verify/Flag/Escalate actions
 * (`POST /financial-transactions/:id/{verify,flag,escalate}`, all
 * gated by `stewardship.transaction.verify`, `TREASURER`/`BRANCH`).
 * BR-STW-04's separation-of-duties rule (a Treasurer may never verify a
 * transaction *they themselves* recorded) is enforced server-side by
 * `RecordLevelPolicyGuard`'s `DIFFERENT_ACTOR_THAN_RECORDER` check, not
 * re-implemented client-side here - a rejected action surfaces the API's
 * own error message via `actionError`, the same "server is the source of
 * truth" approach `MinistryEventsScreen`'s date validation already takes.
 */
export function FinanceVerifyScreen() {
  const theme = useTheme();
  const session = useActorSession();
  const queueState = useRecordedTransactions();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [flaggingId, setFlaggingId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [actionError, setActionError] = useState<string | undefined>(undefined);

  const runAction = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    setActionError(undefined);
    try {
      await action();
      queueState.refetch();
      setFlaggingId(null);
      setFlagReason('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
      <Heading level={1}>Verify</Heading>

      {actionError && (
        <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
          {actionError}
        </Text>
      )}

      {queueState.status === 'loading' && (
        <View style={{ gap: theme.spacing[3] }}>
          <Skeleton height={84} radius="md" />
          <Skeleton height={84} radius="md" />
        </View>
      )}

      {queueState.status === 'error' && (
        <ErrorState title="Couldn't load the Verify queue" description={queueState.error.message} onRetry={queueState.refetch} testId="finance-verify-error" />
      )}

      {queueState.status === 'success' &&
        (queueState.data.length === 0 ? (
          <EmptyState icon="checkCircle" title="Nothing to verify" description="Every recorded transaction has been reviewed." tone="positive" />
        ) : (
          <View style={{ gap: theme.spacing[4] }}>
            {queueState.data.map((transaction, index) => (
              <View key={transaction.id}>
                {index > 0 && <Divider />}
                <View style={{ gap: theme.spacing[2], paddingTop: index > 0 ? theme.spacing[4] : 0 }} testID={`finance-verify-row-${transaction.id}`}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text variant="body">{transaction.type}</Text>
                    <Badge status="info">{formatAmountLabel(transaction.amountMinor, transaction.currency)}</Badge>
                  </View>
                  <Text variant="bodySmall" color={theme.colors.text.secondary}>
                    {transaction.channel ?? 'Unknown channel'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={busyId === transaction.id}
                      onPress={() => void runAction(transaction.id, () => verifyTransaction(session.authToken, transaction.id))}
                      testId={`finance-verify-confirm-${transaction.id}`}
                    >
                      Verify
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onPress={() => {
                        setFlaggingId(transaction.id);
                        setFlagReason('');
                      }}
                      testId={`finance-verify-flag-${transaction.id}`}
                    >
                      Flag
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={busyId === transaction.id}
                      onPress={() => void runAction(transaction.id, () => escalateTransaction(session.authToken, transaction.id))}
                      testId={`finance-verify-escalate-${transaction.id}`}
                    >
                      Escalate
                    </Button>
                  </View>
                  {flaggingId === transaction.id && (
                    <View style={{ gap: theme.spacing[2] }}>
                      <Input label="Reason" value={flagReason} onChangeText={setFlagReason} placeholder="Amount doesn't match the count" testId={`finance-verify-flag-reason-${transaction.id}`} />
                      <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={flagReason.trim().length === 0}
                          loading={busyId === transaction.id}
                          onPress={() => void runAction(transaction.id, () => flagTransaction(session.authToken, transaction.id, flagReason.trim()))}
                          testId={`finance-verify-flag-submit-${transaction.id}`}
                        >
                          Submit flag
                        </Button>
                        <Button variant="secondary" size="sm" onPress={() => setFlaggingId(null)} testId={`finance-verify-flag-cancel-${transaction.id}`}>
                          Cancel
                        </Button>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}
    </ScrollView>
  );
}
