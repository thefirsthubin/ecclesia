import { ScrollView, View } from 'react-native';
import { Button, EmptyState, Heading, Input, RadioGroup, Text, useTheme } from '@ecclesia/ui-native';
import type { FinancialTransactionChannelDto, FinancialTransactionTypeDto } from '@ecclesia/contracts';

import { useSwitchTab } from '../../navigation/Navigator';
import { CHANNEL_OPTIONS, OFFERING_TYPE_OPTIONS, useOfferingRecordingData } from './hooks/useOfferingRecordingData';

/** `amountMinor` -> a "GHS 50.00"-shaped display string, the inverse of
 * `parseAmountToMinorUnits` - same string-manipulation-not-`number`
 * reasoning as that function's own doc comment. */
function formatAmountLabel(amountMinor: string, currency: string): string {
  const padded = amountMinor.padStart(3, '0');
  const whole = padded.slice(0, -2);
  const fraction = padded.slice(-2);
  return `${currency} ${whole}.${fraction}`;
}

/**
 * Record Offering — PRD §16.5's "Offering recording screen," one of the
 * two NFR-PERF-01-named critical Shepherd actions (`QuickActionsRow`'s
 * "Record Offering" button, a stub until this screen existed - see
 * `ShepherdDashboardScreen.tsx`'s own doc comment history). See
 * `OFFERING_RECORDING_DESIGN_NOTES.md` for the full spec this screen
 * implements and its disclosed scope boundaries.
 *
 * Unlike Attendance Capture's single-batch-then-navigate-away shape, a
 * Shepherd may record more than one entry in one sitting (e.g. a Bacenta
 * Meeting's cash offering *and* a separate Mobile Money tithe) - a
 * successful submission shows a confirmation with both **Record another**
 * (resets the form, stays on this screen) and **Done** (returns to the
 * Dashboard, `switchTab('dashboard')`) rather than auto-navigating away
 * the way Attendance Capture's one-shot save does.
 *
 * `[Stewardship gaps sprint]` No more "Back" button — now that
 * `AppShell`'s real bottom tab bar exists, this screen is a top-level tab
 * destination in its own right (Design System §3.2), not a pushed
 * sub-screen. No longer wraps itself in its own `SafeAreaView` either —
 * `AppShell` now owns the one safe-area container for the whole
 * authenticated tab area.
 */
export function OfferingRecordingScreen() {
  const theme = useTheme();
  const switchTab = useSwitchTab();
  const { type, setType, channel, setChannel, amountText, setAmountText, amountError, submitting, submitError, lastRecorded, submit, reset } =
    useOfferingRecordingData();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface.default }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
        <Heading level={1}>Record Offering</Heading>

        {lastRecorded ? (
          <View style={{ gap: theme.spacing[4] }} testID="offering-recording-confirmation">
            <EmptyState
              icon="checkCircle"
              title="Offering recorded"
              description={`${formatAmountLabel(lastRecorded.amountMinor, lastRecorded.currency)} recorded for your Bacenta.`}
              tone="positive"
            />
            <Button variant="secondary" onPress={reset} testId="offering-recording-again">
              Record another
            </Button>
            <Button variant="primary" onPress={() => switchTab('dashboard')} testId="offering-recording-done">
              Done
            </Button>
          </View>
        ) : (
          <View style={{ gap: theme.spacing[4] }}>
            <RadioGroup
              label="Type"
              options={OFFERING_TYPE_OPTIONS}
              value={type}
              onChange={(value) => setType(value as FinancialTransactionTypeDto)}
              testId="offering-recording-type"
            />
            <RadioGroup
              label="Channel"
              options={CHANNEL_OPTIONS}
              value={channel}
              onChange={(value) => setChannel(value as FinancialTransactionChannelDto)}
              direction="row"
              testId="offering-recording-channel"
            />
            <Input
              label="Amount (GHS)"
              value={amountText}
              onChangeText={setAmountText}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={amountError}
              testId="offering-recording-amount"
            />
            {submitError && (
              <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                {submitError}
              </Text>
            )}
            <Button
              loading={submitting}
              disabled={amountText.length === 0 || Boolean(amountError)}
              onPress={() => void submit()}
              testId="offering-recording-submit"
            >
              Record Offering
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
