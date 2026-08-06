import type { ReactNode } from 'react';
import { SafeAreaView, View } from 'react-native';
import { BottomNav, useTheme } from '@ecclesia/ui-native';
import type { BottomNavItem } from '@ecclesia/ui-native';
import type { RoleDto } from '@ecclesia/contracts';

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
 *
 * `[Mobile Personas sprint]` `TABS` is now role-aware (`TABS_BY_ROLE`)
 * instead of the one fixed Shepherd array — three new personas each have
 * their own four-tab bar per the milestone brief (Dashboard · [two
 * persona-specific tabs] · Profile), and none of them are the Shepherd's
 * own five-tab Bacenta/Attendance/Follow-ups/Offering set. The active
 * role is passed in as a `role` prop rather than read from `useAuth()`
 * here directly — `AppShell` is only ever mounted once already-known-
 * authenticated in `App.tsx`'s `RootNavigator`, which already has
 * `state.actor.role` in hand, and keeping `AppShell` itself decoupled
 * from `AuthContext` means `AppShell.spec.tsx`'s existing tests (which
 * render this component standalone, with no `AuthProvider` ancestor)
 * needed no new provider wiring to keep passing. `role` defaults to
 * `'BACENTA_LEADER'` for exactly that reason — every pre-existing test
 * (and this file's own default export) keeps the original five-tab
 * Shepherd behaviour with zero call-site changes required.
 *
 * `BACENTA_LEADER`'s own tab array below is copied verbatim from the one
 * fixed array this replaces — same five keys, same labels, same icons,
 * same order, same `testId` — so nothing about the Shepherd experience
 * changes ("Do NOT redesign the Shepherd experience"). Every other role
 * this app can authenticate as (`ASSISTANT_PASTOR`, `ADMIN`, `WORKER`,
 * `MEMBER`, `COUNCIL_OVERSEER`, `VISITOR`) has no dashboard screen built
 * for it at all — out of scope for this and the Mobile Personas
 * milestone's four named personas — so `DEFAULT_TABS` is a minimal,
 * honest two-tab fallback (Dashboard, which shows an explicit "not
 * available yet" state — see `App.tsx`'s `CurrentScreen` — and Profile,
 * which works for every role) rather than silently reusing another
 * persona's tab set.
 *
 * `[Usher role milestone]` `USHER_TABS` added the same way - Dashboard ·
 * Attendance · Visitor Intake · Profile, per `USHER_ROLE_PROPOSAL.md` §4.
 */
type TabDefinition = { key: ScreenName; label: string; icon: BottomNavItem['icon'] };

const SHEPHERD_TABS: TabDefinition[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home' },
  { key: 'attendance-capture', label: 'Attendance', icon: 'users' },
  { key: 'follow-up-queue', label: 'Follow-ups', icon: 'clipboardList' },
  { key: 'offering-recording', label: 'Offering', icon: 'coins' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

const MINISTRY_LEADER_TABS: TabDefinition[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home' },
  { key: 'ministry-roster', label: 'Roster', icon: 'users' },
  { key: 'ministry-events', label: 'Events', icon: 'calendar' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

const FINANCE_OFFICER_TABS: TabDefinition[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home' },
  { key: 'finance-verify', label: 'Verify', icon: 'checkCircle' },
  { key: 'finance-reconcile', label: 'Reconcile', icon: 'landmark' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

const RESIDENT_PASTOR_TABS: TabDefinition[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home' },
  { key: 'pastor-alerts', label: 'Alerts', icon: 'bell' },
  { key: 'pastor-cluster', label: 'Branch', icon: 'building' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

const USHER_TABS: TabDefinition[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home' },
  { key: 'usher-attendance', label: 'Attendance', icon: 'users' },
  { key: 'visitor-intake', label: 'Visitor Intake', icon: 'userPlus' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

const DEFAULT_TABS: TabDefinition[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

const TABS_BY_ROLE: Partial<Record<RoleDto, TabDefinition[]>> = {
  BACENTA_LEADER: SHEPHERD_TABS,
  BASONTA_LEADER: MINISTRY_LEADER_TABS,
  TREASURER: FINANCE_OFFICER_TABS,
  RESIDENT_PASTOR: RESIDENT_PASTOR_TABS,
  ACTING_RESIDENT_PASTOR: RESIDENT_PASTOR_TABS,
  USHER: USHER_TABS,
};

export interface AppShellProps {
  children: ReactNode;
  /** The authenticated actor's role - picks which persona's tab set
   * `TABS_BY_ROLE` renders. Defaults to `'BACENTA_LEADER'` (the Shepherd,
   * this app's original and only persona before this sprint) so every
   * existing call site/test keeps working unchanged. */
  role?: RoleDto;
}

export function AppShell({ children, role = 'BACENTA_LEADER' }: AppShellProps) {
  const theme = useTheme();
  const { screen } = useCurrentScreen();
  const switchTab = useSwitchTab();

  const tabs = TABS_BY_ROLE[role] ?? DEFAULT_TABS;
  const items: BottomNavItem[] = tabs.map((tab) => ({ ...tab, active: screen === tab.key }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface.default }}>
      <View style={{ flex: 1 }}>{children}</View>
      <BottomNav items={items} onPress={(key) => switchTab(key as ScreenName)} testId="shepherd-bottom-nav" />
    </SafeAreaView>
  );
}
