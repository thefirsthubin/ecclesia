import { View } from 'react-native';
import { Button, Heading, useTheme } from '@ecclesia/ui-native';

export interface QuickActionsRowProps {
  onTakeAttendance: () => void;
  onRecordOffering: () => void;
}

/**
 * Design System §4.3's Quick action zone for this persona — the two
 * NFR-PERF-01/§3.3-named critical actions. `onPress` handlers are stubs
 * supplied by `ShepherdDashboardScreen` (see this screen's own
 * `SHEPHERD_DASHBOARD_DESIGN_NOTES.md` §0 — the Attendance/Offering
 * screens themselves are out of scope this sprint, and no navigator is
 * installed yet to route to them).
 */
export function QuickActionsRow({ onTakeAttendance, onRecordOffering }: QuickActionsRowProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing[3] }}>
      <Heading level={3}>Quick actions</Heading>
      <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
        <View style={{ flex: 1 }}>
          <Button variant="primary" iconLeft="users" onPress={onTakeAttendance} testId="quick-action-take-attendance">
            Take Attendance
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button variant="secondary" iconLeft="plus" onPress={onRecordOffering} testId="quick-action-record-offering">
            Record Offering
          </Button>
        </View>
      </View>
    </View>
  );
}
