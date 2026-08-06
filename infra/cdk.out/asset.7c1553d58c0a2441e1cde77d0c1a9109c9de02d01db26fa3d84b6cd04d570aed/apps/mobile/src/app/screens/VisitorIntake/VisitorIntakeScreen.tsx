import { useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, EmptyState, Heading, Input, RecordPicker, Switch, Text, useTheme } from '@ecclesia/ui-native';
import type { RecordOption } from '@ecclesia/ui-native';

import { useSwitchTab } from '../../navigation/Navigator';
import { useBacentaGroups } from '../UsherDashboard/hooks/useUsherData';
import { useVisitorIntakeData } from './hooks/useVisitorIntakeData';

/**
 * Visitor Intake - `USHER_ROLE_PROPOSAL.md` §4/§6, US-A1/FR-GTH-04. The
 * digital replacement for the paper visitor card, submitted during or
 * immediately after a Gathering. First frontend consumer anywhere in this
 * codebase of `POST /visitor-intake` - see `useVisitorIntakeData.ts`'s
 * own doc comment for the full endpoint/limitation disclosure.
 *
 * Same "Record another / Done" confirmation shape as
 * `OfferingRecordingScreen` (a Shepherd/Usher may capture more than one
 * guest in one sitting), not Attendance Capture's single-batch-then-
 * navigate-away shape.
 *
 * Bacenta preference (US-A2) uses `RecordPicker` against `useBacentaGroups()`
 * (`GET /groups?type=PASTORAL_CARE`), filtered client-side - a Branch's
 * Bacenta count is small and bounded, unlike the unbounded Person search
 * `UsherAttendanceScreen` needs a live server-side `search` call for.
 */
export function VisitorIntakeScreen() {
  const theme = useTheme();
  const switchTab = useSwitchTab();
  const bacentasState = useBacentaGroups();
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    howTheyHeard,
    setHowTheyHeard,
    firstTimeGuest,
    setFirstTimeGuest,
    bacentaPreference,
    setBacentaPreference,
    canSubmit,
    submitting,
    submitError,
    lastSubmission,
    submit,
    reset,
  } = useVisitorIntakeData();

  const searchBacentas = useCallback(
    async (query: string): Promise<RecordOption[]> => {
      if (bacentasState.status !== 'success') return [];
      const normalized = query.trim().toLowerCase();
      return bacentasState.data
        .filter((group) => !normalized || group.name.toLowerCase().includes(normalized))
        .map((group) => ({ id: group.id, label: group.name }));
    },
    [bacentasState],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface.default }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
        <Heading level={1}>Visitor Intake</Heading>

        {lastSubmission ? (
          <View style={{ gap: theme.spacing[4] }} testID="visitor-intake-confirmation">
            <EmptyState
              icon="checkCircle"
              title="Visitor captured"
              description={
                lastSubmission.followUpTaskCreated
                  ? 'A Follow-up task was created automatically for their Shepherd.'
                  : 'No Bacenta preference was given, so no Follow-up task was auto-created - assign one manually if needed.'
              }
              tone="positive"
            />
            <Button variant="secondary" onPress={reset} testId="visitor-intake-again">
              Capture another
            </Button>
            <Button variant="primary" onPress={() => switchTab('dashboard')} testId="visitor-intake-done">
              Done
            </Button>
          </View>
        ) : (
          <View style={{ gap: theme.spacing[4] }}>
            <Input label="First name" value={firstName} onChangeText={setFirstName} testId="visitor-intake-first-name" />
            <Input label="Last name" value={lastName} onChangeText={setLastName} testId="visitor-intake-last-name" />
            <Input label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" testId="visitor-intake-phone" />
            <Input
              label="How did they hear about us? (optional)"
              value={howTheyHeard}
              onChangeText={setHowTheyHeard}
              testId="visitor-intake-how-heard"
            />
            <Switch
              label="This is their first time attending"
              checked={firstTimeGuest}
              onChange={setFirstTimeGuest}
              testId="visitor-intake-first-time-guest"
            />
            <RecordPicker
              label="Bacenta preference (optional)"
              placeholder="Search Bacentas…"
              value={bacentaPreference}
              onChange={setBacentaPreference}
              onSearch={searchBacentas}
              helperText="If a Bacenta is chosen and this is their first time, a Follow-up task is created for that Bacenta's Shepherd automatically."
              testId="visitor-intake-bacenta-preference"
            />

            {submitError && (
              <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                {submitError}
              </Text>
            )}

            <Button loading={submitting} disabled={!canSubmit} onPress={() => void submit()} testId="visitor-intake-submit">
              Capture Visitor
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
