import { View } from 'react-native';
import { Badge, Heading, Text, useTheme } from '@ecclesia/ui-native';
import { getChurchPulseBand } from '@ecclesia/ui-tokens';
import type { GroupDashboardResponseDto } from '@ecclesia/contracts';

import { useBacentaDashboard } from '../hooks/useShepherdDashboardData';
import { CardAsyncBoundary } from './CardAsyncBoundary';

const BAND_TO_BADGE_STATUS = {
  thriving: 'success',
  healthy: 'success',
  attention: 'warning',
  atRisk: 'danger',
} as const;

/**
 * Design System §4.3's Primary metric zone for this persona: own-Bacenta
 * Church Pulse (FR-INS-01, `GET /insights/bacenta-dashboard/:groupId`).
 * `getChurchPulseBand` (`@ecclesia/ui-tokens`) is the same band/color
 * logic every other Church Pulse display in this codebase will use — not
 * a one-off threshold invented for this card.
 */
export function ChurchPulseCard() {
  const theme = useTheme();
  const state = useBacentaDashboard();

  return (
    <CardAsyncBoundary state={state} onRetry={state.refetch} errorTitle="Couldn't load Church Pulse" skeletonLines={2}>
      {(data: GroupDashboardResponseDto) => {
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
              {"Your Bacenta's engagement score, from attendance, follow-up, and serving activity."}
            </Text>
          </View>
        );
      }}
    </CardAsyncBoundary>
  );
}
