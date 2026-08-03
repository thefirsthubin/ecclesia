import { View } from 'react-native';
import { Badge, EmptyState, Heading, Text, useTheme } from '@ecclesia/ui-native';
import type { AlertResponseDto } from '@ecclesia/contracts';

import { useBacentaDashboard } from '../hooks/useShepherdDashboardData';
import { CardAsyncBoundary } from './CardAsyncBoundary';

/**
 * Design System §4.3's Notifications zone. Reuses `useBacentaDashboard`'s
 * already-fetched `alerts[]` rather than a separate request —
 * `INSIGHTS_DESIGN_NOTES.md`'s "Alert inbox: embedded per-dashboard, not
 * a separate cross-cutting endpoint" decision, inherited here (STEP 5).
 */
export function NotificationsCard() {
  const theme = useTheme();
  const state = useBacentaDashboard();

  return (
    <CardAsyncBoundary state={state} onRetry={state.refetch} errorTitle="Couldn't load notifications" skeletonLines={2}>
      {(data) => {
        const openAlerts = data.alerts.filter((alert: AlertResponseDto) => alert.status === 'OPEN');
        return (
          <View style={{ gap: theme.spacing[3] }}>
            <Heading level={3}>Notifications</Heading>
            {openAlerts.length === 0 ? (
              <EmptyState icon="bell" title="No alerts" tone="positive" />
            ) : (
              <View style={{ gap: theme.spacing[2] }}>
                {openAlerts.map((alert: AlertResponseDto) => (
                  <View key={alert.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing[2] }}>
                    <Badge status="warning">{alert.alertType.replace(/_/g, ' ')}</Badge>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySmall" color={theme.colors.text.secondary}>
                        {alert.message ?? 'Church Pulse has declined for your Bacenta.'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      }}
    </CardAsyncBoundary>
  );
}
