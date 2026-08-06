import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Badge, Card, EmptyState, ErrorState, Heading, RecordPicker, Skeleton, Text, useTheme } from '@ecclesia/ui-native';
import type { RecordOption } from '@ecclesia/ui-native';

import { useActorSession } from '../../lib/session';
import { recordAttendance, searchPeopleForAttendance, useAttendanceRecords, useTodayGathering } from '../UsherDashboard/hooks/useUsherData';

/**
 * Usher Attendance - `USHER_ROLE_PROPOSAL.md` §4/§5. Reuses `GET/POST
 * /gatherings/:id/attendance-records` (unmodified, existing endpoints -
 * `AttendanceRecordController`), but is a **new screen**, not a reuse of
 * `AttendanceCaptureScreen` - that screen's whole design (a small,
 * pre-populated Bacenta roster, `OWN_GROUP`-scoped) doesn't fit a
 * Branch-wide Gathering an Usher leads no single Group to scope to (see
 * the proposal's §4 for the full reasoning).
 *
 * Search-and-check-in, not roster-toggle-then-batch-save: `RecordPicker`
 * (`searchPeopleForAttendance`, deliberately minimal-information - see
 * that function's own doc comment) finds one person at a time; selecting
 * one immediately records `PRESENT` and clears the picker for the next
 * person, matching how people actually arrive at a door - one at a time,
 * not as a batch to review and save together the way a Shepherd reviewing
 * their own small Bacenta roster would.
 */
export function UsherAttendanceScreen() {
  const theme = useTheme();
  const session = useActorSession();
  const gatheringState = useTodayGathering();
  const gatheringId = gatheringState.status === 'success' ? (gatheringState.data?.id ?? null) : null;
  const recordsState = useAttendanceRecords(gatheringId);

  const [selected, setSelected] = useState<RecordOption | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | undefined>(undefined);
  // Session-local "who did I just check in" list - the API's own
  // `AttendanceRecordResponseDto` carries `personId` only, not a name;
  // resolving every historical record's name back to a Person would mean
  // an extra `GET /people/:id` per row. This list is built from the
  // `RecordOption.label` already in hand at the moment of selection
  // instead - real for this screen session, not a persisted "who's
  // checked in today" view across app restarts. `N recorded` (below)
  // still comes from the real `attendance-records` count, the source of
  // truth this list is only a session-local convenience alongside.
  const [sessionCheckIns, setSessionCheckIns] = useState<RecordOption[]>([]);

  const handleSelect = async (option: RecordOption | null) => {
    if (!option || !gatheringId) return;
    setSelected(option);
    setCheckingIn(true);
    setCheckInError(undefined);
    try {
      await recordAttendance(session.authToken, gatheringId, option.id);
      setSessionCheckIns((prev) => [option, ...prev]);
      recordsState.refetch();
    } catch (error) {
      setCheckInError(error instanceof Error ? error.message : 'Something went wrong recording attendance.');
    } finally {
      setCheckingIn(false);
      setSelected(null);
    }
  };

  if (gatheringState.status === 'loading') {
    return (
      <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[3] }}>
        <Skeleton height={28} width="50%" />
        <Skeleton height={64} radius="md" />
        <Skeleton height={48} radius="md" />
      </ScrollView>
    );
  }

  if (gatheringState.status === 'error') {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: theme.spacing[4], justifyContent: 'center' }}>
        <ErrorState title="Couldn't load today's Gathering" description={gatheringState.error.message} onRetry={gatheringState.refetch} testId="usher-attendance-error" />
      </ScrollView>
    );
  }

  if (!gatheringState.data) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: theme.spacing[4], justifyContent: 'center' }}>
        <EmptyState icon="calendar" title="No Gathering scheduled today" description="Attendance can be recorded once a Gathering is scheduled for today." />
      </ScrollView>
    );
  }

  const gathering = gatheringState.data;
  const recordedCount = recordsState.status === 'success' ? recordsState.data.length : undefined;

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
      <Heading level={1}>Attendance</Heading>

      <Card padding={4}>
        <View style={{ gap: theme.spacing[2] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Heading level={3}>{gathering.type}</Heading>
            {recordedCount !== undefined && <Badge status="success">{`${recordedCount} recorded`}</Badge>}
          </View>
          {gathering.venue && (
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              {gathering.venue}
            </Text>
          )}
        </View>
      </Card>

      <RecordPicker
        label="Find a person to check in"
        placeholder="Search by name…"
        value={selected}
        onChange={(value) => void handleSelect(value)}
        onSearch={(query) => searchPeopleForAttendance(session.authToken, query)}
        helperText={checkingIn ? 'Recording…' : undefined}
        error={checkInError}
        testId="usher-attendance-search"
      />

      {sessionCheckIns.length > 0 && (
        <View style={{ gap: theme.spacing[2] }} testID="usher-attendance-session-list">
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            Checked in this session
          </Text>
          {sessionCheckIns.map((person, index) => (
            <Card key={`${person.id}-${index}`} padding={3}>
              <Text variant="body">{person.label}</Text>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
