import { useCallback, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, View } from 'react-native';
import { useTheme } from '@ecclesia/ui-native';

import { useNavigate } from '../../navigation/Navigator';
import { AttendanceSummaryCard } from './components/AttendanceSummaryCard';
import { ChurchPulseCard } from './components/ChurchPulseCard';
import { DashboardHeader } from './components/DashboardHeader';
import { NotificationsCard } from './components/NotificationsCard';
import { PriorityCard } from './components/PriorityCard';
import { QuickActionsRow } from './components/QuickActionsRow';
import { RecentActivityCard } from './components/RecentActivityCard';
import { TodaysMeetingCard } from './components/TodaysMeetingCard';

/**
 * The Shepherd Dashboard — PRD §16.2's "single most important screen in
 * the product." See `SHEPHERD_DASHBOARD_DESIGN_NOTES.md` for the full
 * spec this screen implements (STEPS 1-8) and its disclosed scope
 * boundaries (§0/"Known limitations") from the sprint that first built
 * it: composed entirely from `@ecclesia/ui-native`'s existing 12
 * components plus plain RN layout — no new base component.
 *
 * `[Mobile Application Shell sprint]` `onTakeAttendance` now navigates to
 * the real Attendance Capture screen (`../../navigation/Navigator`'s
 * `useNavigate`) instead of being a stub — the "no real navigation" gap
 * the comment above used to name is closed by this sprint.
 * `onRecordOffering` remains a stub: Offering recording is a separate,
 * not-yet-built screen.
 *
 * Each card fetches its own data independently (STEP 7) - a single pull-
 * to-refresh here re-triggers every card's own `refetch`, but a
 * `refreshKey` remount (rather than threading nine separate `refetch`
 * callbacks through props) is deliberately used instead: every card
 * already re-fetches on mount via its own hook's `useEffect`, so
 * remounting the whole card tree on pull is equivalent behavior with far
 * less prop plumbing, at the cost of a brief unmount/remount of each
 * card's own loading skeleton on manual refresh (acceptable - this is
 * not the initial-load path NFR-PERF-02 targets).
 */
export function ShepherdDashboardScreen() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((key) => key + 1);
    // No signal for "all cards finished" without threading state back up
    // from each card - a short, disclosed approximation of the native
    // refresh-control spinner's expected lifecycle rather than a fully
    // accurate one.
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface.default }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}
      >
        <View key={refreshKey} style={{ gap: theme.spacing[4] }}>
          <DashboardHeader />
          <ChurchPulseCard />
          <PriorityCard />
          <TodaysMeetingCard />
          <AttendanceSummaryCard />
          <QuickActionsRow
            onTakeAttendance={() => navigate('attendance-capture')}
            onRecordOffering={() => {
              // [Design Decision] stub - Offering recording is a separate,
              // not-yet-built screen; out of scope for this sprint (see
              // ATTENDANCE_CAPTURE_DESIGN_NOTES.md).
            }}
          />
          <NotificationsCard />
          <RecentActivityCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
