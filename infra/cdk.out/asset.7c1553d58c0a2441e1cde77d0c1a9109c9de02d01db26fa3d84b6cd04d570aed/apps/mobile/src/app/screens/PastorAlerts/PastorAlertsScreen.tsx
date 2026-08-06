import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Badge, Button, Divider, EmptyState, ErrorState, Heading, Skeleton, Text, useTheme } from '@ecclesia/ui-native';

import { useActorSession } from '../../lib/session';
import { resolveAlert, useBranchDashboard } from '../PastorDashboard/hooks/usePastorData';

/**
 * Resident Pastor Alerts - FR-INS-03/05's Alert inbox, for this persona's
 * whole Branch. Reuses `useBranchDashboard()`'s already-fetched `alerts`
 * field rather than a second network call - the "Alert inbox:
 * embedded per-dashboard" decision this codebase already settled on for
 * the Shepherd's own `NotificationsCard` (`ShepherdDashboard`), inherited
 * here rather than re-decided (there is no `GET /insights/alerts` list
 * endpoint to call instead - `AlertController`'s own doc comment).
 * Resolve actions (`PATCH /insights/alerts/:id/resolve`) hit the
 * single-Alert endpoint directly.
 */
export function PastorAlertsScreen() {
  const theme = useTheme();
  const session = useActorSession();
  const dashboardState = useBranchDashboard();

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | undefined>(undefined);

  const resolve = async (alertId: string, status: 'ACTED' | 'DISMISSED') => {
    setResolvingId(alertId);
    setActionError(undefined);
    try {
      await resolveAlert(session.authToken, alertId, status);
      dashboardState.refetch();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Something went wrong resolving this alert.');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
      <Heading level={1}>Alerts</Heading>

      {actionError && (
        <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
          {actionError}
        </Text>
      )}

      {dashboardState.status === 'loading' && (
        <View style={{ gap: theme.spacing[3] }}>
          <Skeleton height={72} radius="md" />
          <Skeleton height={72} radius="md" />
        </View>
      )}

      {dashboardState.status === 'error' && (
        <ErrorState title="Couldn't load Alerts" description={dashboardState.error.message} onRetry={dashboardState.refetch} testId="pastor-alerts-error" />
      )}

      {dashboardState.status === 'success' &&
        (() => {
          const openAlerts = dashboardState.data.alerts.filter((alert) => alert.status === 'OPEN');
          return openAlerts.length === 0 ? (
            <EmptyState icon="checkCircle" title="No open alerts" description="Every alert across your Branch has been resolved." tone="positive" />
          ) : (
            <View style={{ gap: theme.spacing[4] }}>
              {openAlerts.map((alert, index) => (
                <View key={alert.id}>
                  {index > 0 && <Divider />}
                  <View style={{ gap: theme.spacing[2], paddingTop: index > 0 ? theme.spacing[4] : 0 }} testID={`pastor-alert-row-${alert.id}`}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text variant="body">{alert.alertType}</Text>
                      <Badge status="danger">Open</Badge>
                    </View>
                    <Text variant="bodySmall" color={theme.colors.text.secondary}>
                      {alert.message ?? `Triggered ${new Date(alert.triggeredAt).toLocaleDateString()}`}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
                      <Button
                        variant="primary"
                        size="sm"
                        loading={resolvingId === alert.id}
                        onPress={() => void resolve(alert.id, 'ACTED')}
                        testId={`pastor-alert-acted-${alert.id}`}
                      >
                        Mark Acted
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={resolvingId === alert.id}
                        onPress={() => void resolve(alert.id, 'DISMISSED')}
                        testId={`pastor-alert-dismissed-${alert.id}`}
                      >
                        Dismiss
                      </Button>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          );
        })()}
    </ScrollView>
  );
}
