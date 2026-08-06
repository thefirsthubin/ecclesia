import { ScrollView, View } from 'react-native';
import { Badge, Button, Heading, Text, useTheme } from '@ecclesia/ui-native';
import { getChurchPulseBand } from '@ecclesia/ui-tokens';

import { useSwitchTab } from '../../navigation/Navigator';
import { CardAsyncBoundary } from '../ShepherdDashboard/components/CardAsyncBoundary';
import { useBranchDashboard } from './hooks/usePastorData';

const BAND_TO_BADGE_STATUS = {
  thriving: 'success',
  healthy: 'success',
  attention: 'warning',
  atRisk: 'danger',
} as const;

/**
 * Resident Pastor Dashboard - the milestone brief's first of four tabs
 * for this persona. `GET /insights/branch-dashboard` (FR-INS-04) is the
 * single data source for both cards here: the Branch Pulse score (same
 * `getChurchPulseBand` band/color logic `ChurchPulseCard` already uses
 * for the Shepherd's own Bacenta-scoped pulse - one shared source of
 * truth for what a score "means," just a different scope) and the open
 * Alert count (the "Alert inbox: embedded per-dashboard" pattern this
 * codebase already established, not a new list endpoint).
 */
export function PastorDashboardScreen() {
  const theme = useTheme();
  const switchTab = useSwitchTab();
  const dashboardState = useBranchDashboard();

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
      <Heading level={1}>Branch Dashboard</Heading>

      <CardAsyncBoundary state={dashboardState} onRetry={dashboardState.refetch} errorTitle="Couldn't load Church Pulse" skeletonLines={2}>
        {(data) => {
          const band = getChurchPulseBand(data.pulseScore.score);
          return (
            <View style={{ gap: theme.spacing[2] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Heading level={3}>Church Pulse</Heading>
                <Badge status={BAND_TO_BADGE_STATUS[band.key]}>{band.label}</Badge>
              </View>
              <Heading level="display" color={band.color}>
                {`${Math.round(data.pulseScore.score)}`}
              </Heading>
              <Text variant="bodySmall" color={theme.colors.text.secondary}>
                Your Branch's engagement score, from attendance, follow-up, and serving activity.
              </Text>
            </View>
          );
        }}
      </CardAsyncBoundary>

      <CardAsyncBoundary state={dashboardState} onRetry={dashboardState.refetch} errorTitle="Couldn't load Alerts" skeletonLines={2}>
        {(data) => {
          const openAlerts = data.alerts.filter((alert) => alert.status === 'OPEN');
          return (
            <View style={{ gap: theme.spacing[2] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Heading level={3}>Alerts</Heading>
                {openAlerts.length > 0 && <Badge status="warning">{`${openAlerts.length} open`}</Badge>}
              </View>
              <Text variant="bodySmall" color={theme.colors.text.secondary}>
                {openAlerts.length === 0 ? 'No open alerts across your Branch.' : `${openAlerts.length} alert${openAlerts.length === 1 ? '' : 's'} need your attention.`}
              </Text>
              <Button variant="tertiary" size="sm" onPress={() => switchTab('pastor-alerts')} testId="pastor-dashboard-view-alerts">
                View Alerts
              </Button>
            </View>
          );
        }}
      </CardAsyncBoundary>

      <Button variant="secondary" onPress={() => switchTab('pastor-cluster')} testId="pastor-dashboard-view-branch">
        View Branch Bacentas
      </Button>
    </ScrollView>
  );
}
