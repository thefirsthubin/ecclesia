import type { ReactNode } from 'react';
import { SafeAreaView, View } from 'react-native';
import { BottomNav, useTheme } from '@ecclesia/ui-native';
import type { BottomNavItem } from '@ecclesia/ui-native';

import type { ScreenName } from './Navigator';
import { useCurrentScreen, useSwitchTab } from './Navigator';

/**
 * `[Stewardship gaps sprint]` The real persistent bottom tab bar Design
 * System §3.2 always specified for this persona (Dashboard · Attendance ·
 * Follow-ups · Offering · Profile, in that literal order) — every one of
 * these five screens already existed as a real, working screen before
 * this file did; this is purely navigation chrome around them, not new
 * screen content. `libs/ui/native`'s `BottomNav` component itself was
 * built earlier (Navigation/Data/Layout UI-library tier) but had never
 * been wired into `apps/mobile` until now.
 *
 * Wraps `RootNavigator`'s authenticated screen switch — see
 * `../App.tsx`. Only rendered once `state.status === 'authenticated'`;
 * `LoginScreen`/`SessionRestoringScreen` render outside it, each keeping
 * their own `SafeAreaView` (there is no tab bar to reserve space for
 * before sign-in).
 *
 * **Safe-area handling**: `BottomNav` itself deliberately applies no
 * safe-area inset (`react-native-safe-area-context` isn't installed in
 * this workspace — the component's own doc comment). This shell owns the
 * *one* `SafeAreaView` (React Native's own core component, not that
 * unavailable library) for the whole authenticated area, wrapping both
 * the current screen *and* the tab bar together — the same reasoning
 * that requires every individual screen this shell now wraps
 * (`ShepherdDashboardScreen`, `AttendanceCaptureScreen`,
 * `OfferingRecordingScreen`, `FollowUpQueueScreen`) to no longer wrap
 * itself in a second, nested `SafeAreaView` (removed as part of this same
 * change - a nested one would double-apply the same OS-level inset,
 * since RN core's `SafeAreaView` reads the window's safe-area insets
 * unconditionally rather than accounting for an ancestor already having
 * applied them). This still only insets for iOS - Android is a no-op for
 * RN core's `SafeAreaView`, the same disclosed platform gap this app's
 * screens have carried since the Mobile Application Shell sprint.
 */
const TABS: { key: ScreenName; label: string; icon: BottomNavItem['icon'] }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home' },
  { key: 'attendance-capture', label: 'Attendance', icon: 'users' },
  { key: 'follow-up-queue', label: 'Follow-ups', icon: 'clipboardList' },
  { key: 'offering-recording', label: 'Offering', icon: 'coins' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const { screen } = useCurrentScreen();
  const switchTab = useSwitchTab();

  const items: BottomNavItem[] = TABS.map((tab) => ({ ...tab, active: screen === tab.key }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface.default }}>
      <View style={{ flex: 1 }}>{children}</View>
      <BottomNav items={items} onPress={(key) => switchTab(key as ScreenName)} testId="shepherd-bottom-nav" />
    </SafeAreaView>
  );
}
