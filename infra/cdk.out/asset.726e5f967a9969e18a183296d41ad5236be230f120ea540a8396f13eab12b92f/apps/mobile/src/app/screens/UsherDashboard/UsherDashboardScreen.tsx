import { ScrollView, View } from 'react-native';
import { Badge, Button, EmptyState, Heading, Text, useTheme } from '@ecclesia/ui-native';

import { useSwitchTab } from '../../navigation/Navigator';
import { CardAsyncBoundary } from '../ShepherdDashboard/components/CardAsyncBoundary';
import { useAttendanceRecords, useTodayGathering } from './hooks/useUsherData';

/**
 * Usher Dashboard - the milestone brief's first of four tabs for this
 * persona (`USHER_ROLE_PROPOSAL.md` §4). Same "no new base component,
 * `CardAsyncBoundary` + `switchTab` links to the tab that lets you act"
 * shape as `MinistryDashboardScreen`/`FinanceDashboardScreen`/
 * `PastorDashboardScreen`.
 *
 * One card: today's Gathering (or an honest "none scheduled" state) with
 * its recorded-attendance count, linking to the Attendance tab. A second,
 * static card links to Visitor Intake directly - unlike the other three
 * personas' second dashboard card, Visitor Intake has no its-own-data
 * summary worth fetching (there is no `GET`-list endpoint for visitor
 * intake submissions at all - `gatherings.visitor_intake.read` is granted
 * to `RESIDENT_PASTOR` only, and unused even there, see
 * `permission-matrix.ts`'s own note), so this card is a plain navigation
 * shortcut, not a data card.
 */
export function UsherDashboardScreen() {
  const theme = useTheme();
  const switchTab = useSwitchTab();
  const gatheringState = useTodayGathering();
  const gatheringId = gatheringState.status === 'success' ? (gatheringState.data?.id ?? null) : null;
  const recordsState = useAttendanceRecords(gatheringId);

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
      <Heading level={1}>Usher Dashboard</Heading>

      <CardAsyncBoundary state={gatheringState} onRetry={gatheringState.refetch} errorTitle="Couldn't load today's Gathering" skeletonLines={2}>
        {(gathering) =>
          gathering ? (
            <View style={{ gap: theme.spacing[2] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Heading level={3}>{gathering.type}</Heading>
                {recordsState.status === 'success' && <Badge status="success">{`${recordsState.data.length} recorded`}</Badge>}
              </View>
              {gathering.venue && (
                <Text variant="bodySmall" color={theme.colors.text.secondary}>
                  {gathering.venue}
                </Text>
              )}
              <Button variant="tertiary" size="sm" onPress={() => switchTab('usher-attendance')} testId="usher-dashboard-view-attendance">
                Go to Attendance
              </Button>
            </View>
          ) : (
            <EmptyState icon="calendar" title="No Gathering scheduled today" description="Attendance can be recorded once a Gathering is scheduled for today." />
          )
        }
      </CardAsyncBoundary>

      <View style={{ gap: theme.spacing[2] }}>
        <Heading level={3}>Visitor Intake</Heading>
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          Capture a first-time guest's details on the digital form.
        </Text>
        <Button variant="tertiary" size="sm" onPress={() => switchTab('visitor-intake')} testId="usher-dashboard-view-visitor-intake">
          Go to Visitor Intake
        </Button>
      </View>
    </ScrollView>
  );
}
