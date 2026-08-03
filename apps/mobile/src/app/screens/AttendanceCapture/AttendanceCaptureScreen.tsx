import { useMemo } from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { Button, EmptyState, ErrorState, Heading, Skeleton, Text, useTheme } from '@ecclesia/ui-native';

import { useGoBack } from '../../navigation/Navigator';
import { RosterRow } from './components/RosterRow';
import { useAttendanceCaptureData } from './hooks/useAttendanceCaptureData';

/**
 * Attendance Capture — PRD FR-GTH-03/FR-GTH-05, NFR-PERF-01 ("attendance
 * capture completes in under 60 seconds for up to 30 attendees"). Reached
 * from `ShepherdDashboardScreen`'s "Take Attendance" quick action. See
 * `ATTENDANCE_CAPTURE_DESIGN_NOTES.md` for the full spec, endpoint-reuse
 * rationale, and disclosed scope boundaries.
 *
 * NFR-PERF-01 is why this screen stages every tap locally
 * (`useAttendanceCaptureData`'s `pendingStatuses`) and commits with one
 * "Save attendance" action rather than firing a network request per tap:
 * a Shepherd working through 30 rows should be gated by their own
 * scrolling/tapping speed, not by 30 sequential round-trips.
 */
export function AttendanceCaptureScreen() {
  const theme = useTheme();
  const { goBack } = useGoBack();
  const { state, setStatus, hasUnsavedChanges, saving, saveError, save, refetch } = useAttendanceCaptureData();

  const summary = useMemo(() => {
    if (state.status !== 'ready') return undefined;
    const recorded = state.roster.filter((entry) => entry.status !== undefined).length;
    return `${recorded} of ${state.roster.length} recorded`;
  }, [state]);

  const handleSave = async () => {
    const succeeded = await save();
    if (succeeded) {
      goBack();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface.default }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing[4],
          paddingBottom: theme.spacing[2],
        }}
      >
        <Button variant="tertiary" iconLeft="arrowLeft" onPress={goBack} testId="attendance-capture-back">
          Back
        </Button>
      </View>

      {state.status === 'loading' && (
        <View style={{ padding: theme.spacing[4], gap: theme.spacing[3] }}>
          <Skeleton height={28} width="60%" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={72} radius="md" />
          ))}
        </View>
      )}

      {state.status === 'error' && (
        <ErrorState title="Couldn't load the roster" description={state.message} onRetry={refetch} testId="attendance-capture-error" />
      )}

      {state.status === 'no-gathering' && (
        <EmptyState
          icon="calendar"
          title="No meeting scheduled today"
          description="Attendance can only be recorded for a Bacenta Meeting scheduled for today. Schedule one first."
        />
      )}

      {state.status === 'ready' && (
        <>
          <ScrollView contentContainerStyle={{ padding: theme.spacing[4], paddingTop: 0, gap: theme.spacing[3] }}>
            <View style={{ gap: theme.spacing[1] }}>
              <Heading level={1}>Take Attendance</Heading>
              <Text variant="bodySmall" color={theme.colors.text.secondary}>
                {new Date(state.gathering.scheduledStart).toLocaleString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' })}
              </Text>
              {state.gathering.venue && (
                <Text variant="bodySmall" color={theme.colors.text.secondary}>
                  {state.gathering.venue}
                </Text>
              )}
              {summary && (
                <Text variant="bodySmall" color={theme.colors.text.secondary}>
                  {summary}
                </Text>
              )}
            </View>

            {state.roster.length === 0 ? (
              <EmptyState icon="users" title="No members in this Bacenta yet" description="Add members to this group to take attendance." />
            ) : (
              state.roster.map((entry) => (
                <RosterRow
                  key={entry.person.id}
                  person={entry.person}
                  status={entry.status}
                  onChangeStatus={(status) => setStatus(entry.person.id, status)}
                />
              ))
            )}
          </ScrollView>

          <View style={{ padding: theme.spacing[4], paddingTop: theme.spacing[2], gap: theme.spacing[2] }}>
            {saveError && (
              <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                {saveError}
              </Text>
            )}
            <Button loading={saving} disabled={!hasUnsavedChanges} onPress={() => void handleSave()} testId="attendance-capture-save">
              Save attendance
            </Button>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
