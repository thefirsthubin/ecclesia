import { View } from 'react-native';
import { EmptyState, Heading, Icon, Text, useTheme } from '@ecclesia/ui-native';

import { useUpcomingMeeting } from '../hooks/useShepherdDashboardData';
import { CardAsyncBoundary } from './CardAsyncBoundary';

/**
 * `[Design Decision]` — no PRD section names a "today's meeting" widget
 * by that name; this composes the Gathering entity FR-GTH-01/02 already
 * models (see `SHEPHERD_DASHBOARD_DESIGN_NOTES.md` §1). Shows the
 * earliest upcoming Bacenta Meeting in the next 7 days.
 */
export function TodaysMeetingCard() {
  const theme = useTheme();
  const state = useUpcomingMeeting();

  return (
    <CardAsyncBoundary state={state} onRetry={state.refetch} errorTitle="Couldn't load your next meeting" skeletonLines={2}>
      {(gathering) =>
        gathering === null ? (
          <EmptyState icon="calendar" title="No upcoming meeting scheduled" description="Schedule your next Bacenta Meeting to see it here." />
        ) : (
          <View style={{ gap: theme.spacing[2] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
              <Icon name="calendar" accessibilityLabel="Upcoming meeting" />
              <Heading level={3}>Next meeting</Heading>
            </View>
            <Text variant="body">
              {new Date(gathering.scheduledStart).toLocaleString(undefined, {
                weekday: 'long',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
            {gathering.venue && (
              <Text variant="bodySmall" color={theme.colors.text.secondary}>
                {gathering.venue}
              </Text>
            )}
          </View>
        )
      }
    </CardAsyncBoundary>
  );
}
