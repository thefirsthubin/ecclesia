import { ScrollView, View } from 'react-native';
import { Badge, Button, Heading, Text, useTheme } from '@ecclesia/ui-native';

import { useSwitchTab } from '../../navigation/Navigator';
import { CardAsyncBoundary } from '../ShepherdDashboard/components/CardAsyncBoundary';
import { useRecordedTransactions, useWeeklyReconciliation } from './hooks/useFinanceData';

/**
 * Finance Officer Dashboard - the milestone brief's first of four tabs
 * for this persona. Same "no new base component, `CardAsyncBoundary` +
 * `switchTab` links to the tab that lets you act" shape as
 * `MinistryDashboardScreen`/`ShepherdDashboardScreen`.
 *
 * Two cards: how many entries are waiting in the Verify queue
 * (`stewardship.transaction.read`, `RECORDED` state) and how many
 * Bacentas are unmatched in this week's bank-deposit reconciliation
 * (`stewardship.bank_deposit.read`) - both summaries that link to their
 * own full tab.
 */
export function FinanceDashboardScreen() {
  const theme = useTheme();
  const switchTab = useSwitchTab();
  const recordedState = useRecordedTransactions();
  const reconciliationState = useWeeklyReconciliation();

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
      <Heading level={1}>Finance Dashboard</Heading>

      <CardAsyncBoundary state={recordedState} onRetry={recordedState.refetch} errorTitle="Couldn't load the Verify queue" skeletonLines={2}>
        {(transactions) => (
          <View style={{ gap: theme.spacing[2] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Heading level={3}>Awaiting Verification</Heading>
              {transactions.length > 0 && <Badge status="warning">{`${transactions.length}`}</Badge>}
            </View>
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              {transactions.length === 0 ? 'Nothing waiting on you right now.' : `${transactions.length} entr${transactions.length === 1 ? 'y' : 'ies'} recorded and waiting for review.`}
            </Text>
            <Button variant="tertiary" size="sm" onPress={() => switchTab('finance-verify')} testId="finance-dashboard-view-verify">
              Go to Verify
            </Button>
          </View>
        )}
      </CardAsyncBoundary>

      <CardAsyncBoundary
        state={reconciliationState}
        onRetry={reconciliationState.refetch}
        errorTitle="Couldn't load this week's reconciliation"
        skeletonLines={2}
      >
        {(reconciliation) => {
          const unmatched = reconciliation.rows.filter((row) => !row.matched);
          return (
            <View style={{ gap: theme.spacing[2] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Heading level={3}>This Week's Reconciliation</Heading>
                {unmatched.length > 0 && <Badge status="danger">{`${unmatched.length} unmatched`}</Badge>}
              </View>
              <Text variant="bodySmall" color={theme.colors.text.secondary}>
                {reconciliation.rows.length === 0
                  ? 'No Bacentas have offerings or deposits recorded for this week yet.'
                  : `${reconciliation.rows.length} Bacenta${reconciliation.rows.length === 1 ? '' : 's'} with activity this week.`}
              </Text>
              <Button variant="tertiary" size="sm" onPress={() => switchTab('finance-reconcile')} testId="finance-dashboard-view-reconcile">
                Go to Reconcile
              </Button>
            </View>
          );
        }}
      </CardAsyncBoundary>
    </ScrollView>
  );
}
