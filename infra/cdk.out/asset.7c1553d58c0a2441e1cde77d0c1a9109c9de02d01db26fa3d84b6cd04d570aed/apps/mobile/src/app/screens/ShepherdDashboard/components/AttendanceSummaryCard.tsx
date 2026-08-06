import { View } from 'react-native';
import { EmptyState, Heading, Text, useTheme } from '@ecclesia/ui-native';

import { useLastMeetingAttendance } from '../hooks/useShepherdDashboardData';
import { CardAsyncBoundary } from './CardAsyncBoundary';

/** §16.2's "attendance trend" content, composed from the existing
 * `GET /gatherings` + `GET /gatherings/:id/attendance-records` endpoints
 * (STEP 6 — no new aggregation endpoint invented for this). */
export function AttendanceSummaryCard() {
  const theme = useTheme();
  const state = useLastMeetingAttendance();

  return (
    <CardAsyncBoundary state={state} onRetry={state.refetch} errorTitle="Couldn't load attendance" skeletonLines={2}>
      {(summary) =>
        summary === null ? (
          <EmptyState icon="users" title="No attendance recorded yet" description="Your last Bacenta Meeting's attendance will appear here." />
        ) : (
          <View style={{ gap: theme.spacing[2] }}>
            <Heading level={3}>Last meeting attendance</Heading>
            <Heading level={1}>{`${summary.records.filter((r) => r.status === 'PRESENT').length}`}</Heading>
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              {`Present on ${new Date(summary.gathering.scheduledStart).toLocaleDateString()}, out of ${summary.records.length} recorded`}
            </Text>
          </View>
        )
      }
    </CardAsyncBoundary>
  );
}
