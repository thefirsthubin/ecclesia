/**
 * App root — Mobile Application Shell sprint.
 *
 * Replaces the single hardcoded screen the Shepherd Dashboard sprint left
 * in place (`ShepherdDashboardScreen` rendered directly, no auth gate, no
 * navigator - see that sprint's own `SHEPHERD_DASHBOARD_DESIGN_NOTES.md`
 * §0/STEP 11 for the explicit prediction this sprint acts on) with a real
 * three-layer root: `AuthProvider` (Dev-Auth-only sign-in,
 * `auth/AuthContext.tsx`) gates which screen can render at all,
 * `NavigationProvider` (`navigation/Navigator.tsx`) tracks which screen
 * is current within the authenticated app, and `RootNavigator` below is
 * the one place that reads both and decides what to show.
 *
 * `[Stewardship gaps sprint]` The authenticated screen switch is now
 * wrapped in `AppShell` — the real persistent bottom tab bar Design
 * System §3.2 always specified (`navigation/AppShell.tsx`'s own doc
 * comment has the full reasoning). `LoginScreen`/`SessionRestoringScreen`
 * stay outside it — there is no tab bar to show before a Shepherd is
 * signed in.
 *
 * `[Mobile Personas sprint]` `CurrentScreen` is now role-aware for the
 * `'dashboard'` tab specifically (`DashboardForRole` below) — every
 * persona's tab bar has a Dashboard tab at the same `ScreenName`
 * (`'dashboard'`, see `Navigator.tsx`'s own doc comment for why that key
 * is shared rather than duplicated per persona), but each persona's
 * Dashboard is a different screen/component/data source. Every other
 * `CurrentScreen` case is persona-*exclusive* (e.g. `'ministry-roster'`
 * only ever renders for a Ministry Leader, enforced structurally by
 * `AppShell`'s own role-scoped `TABS_BY_ROLE` never surfacing that tab to
 * any other role — there is nothing to branch on for those cases).
 * `AppShell` itself now receives `role={state.actor.role}` explicitly
 * (see that file's own doc comment for why it takes a prop instead of
 * reading `useAuth()` directly).
 *
 * `[Usher role milestone]` `USHER` added as a fifth `DashboardForRole`
 * case (`UsherDashboardScreen`) plus two more persona-exclusive
 * `CurrentScreen` cases (`usher-attendance`/`visitor-intake`) - see
 * `USHER_ROLE_PROPOSAL.md` (repo root).
 */
import { ThemeProvider } from '@ecclesia/ui-native';
import type { RoleDto } from '@ecclesia/contracts';

import { AuthProvider, useAuth } from './auth/AuthContext';
import { AppShell } from './navigation/AppShell';
import { NavigationProvider, useCurrentScreen } from './navigation/Navigator';
import { LoginScreen } from './screens/Login/LoginScreen';
import { SessionRestoringScreen } from './screens/Login/SessionRestoringScreen';
import { ShepherdDashboardScreen } from './screens/ShepherdDashboard';
import { AttendanceCaptureScreen } from './screens/AttendanceCapture';
import { OfferingRecordingScreen } from './screens/OfferingRecording';
import { FollowUpQueueScreen } from './screens/FollowUpQueue';
import { MinistryDashboardScreen } from './screens/MinistryDashboard';
import { MinistryRosterScreen } from './screens/MinistryRoster';
import { MinistryEventsScreen } from './screens/MinistryEvents';
import { FinanceDashboardScreen } from './screens/FinanceDashboard';
import { FinanceVerifyScreen } from './screens/FinanceVerify';
import { FinanceReconcileScreen } from './screens/FinanceReconcile';
import { PastorDashboardScreen } from './screens/PastorDashboard';
import { PastorAlertsScreen } from './screens/PastorAlerts';
import { PastorClusterBranchScreen } from './screens/PastorClusterBranch';
import { UsherDashboardScreen } from './screens/UsherDashboard';
import { UsherAttendanceScreen } from './screens/UsherAttendance';
import { VisitorIntakeScreen } from './screens/VisitorIntake';
import { ProfileScreen } from './screens/Profile';
import { UnsupportedDashboardScreen } from './screens/UnsupportedDashboard';

/** Which Dashboard component the `'dashboard'` tab renders, by role — see
 * this file's own top comment. Every role not listed here falls through
 * to `UnsupportedDashboardScreen` — no dashboard was ever built for
 * `ASSISTANT_PASTOR`/`ADMIN`/`WORKER`/`MEMBER`/`COUNCIL_OVERSEER`/
 * `VISITOR` on mobile (out of scope for this milestone's four named
 * personas), and that screen says so plainly rather than defaulting to
 * another persona's dashboard. */
function DashboardForRole({ role }: { role: RoleDto }) {
  switch (role) {
    case 'BACENTA_LEADER':
      return <ShepherdDashboardScreen />;
    case 'BASONTA_LEADER':
      return <MinistryDashboardScreen />;
    case 'TREASURER':
      return <FinanceDashboardScreen />;
    case 'RESIDENT_PASTOR':
    case 'ACTING_RESIDENT_PASTOR':
      return <PastorDashboardScreen />;
    case 'USHER':
      return <UsherDashboardScreen />;
    default:
      return <UnsupportedDashboardScreen role={role} />;
  }
}

function CurrentScreen({ role }: { role: RoleDto }) {
  const { screen } = useCurrentScreen();

  switch (screen) {
    case 'attendance-capture':
      return <AttendanceCaptureScreen />;
    case 'offering-recording':
      return <OfferingRecordingScreen />;
    case 'follow-up-queue':
      return <FollowUpQueueScreen />;
    case 'ministry-roster':
      return <MinistryRosterScreen />;
    case 'ministry-events':
      return <MinistryEventsScreen />;
    case 'finance-verify':
      return <FinanceVerifyScreen />;
    case 'finance-reconcile':
      return <FinanceReconcileScreen />;
    case 'pastor-alerts':
      return <PastorAlertsScreen />;
    case 'pastor-cluster':
      return <PastorClusterBranchScreen />;
    case 'usher-attendance':
      return <UsherAttendanceScreen />;
    case 'visitor-intake':
      return <VisitorIntakeScreen />;
    case 'profile':
      return <ProfileScreen />;
    case 'dashboard':
    default:
      return <DashboardForRole role={role} />;
  }
}

function RootNavigator() {
  const { state } = useAuth();

  if (state.status === 'restoring') {
    return <SessionRestoringScreen />;
  }
  if (state.status !== 'authenticated') {
    // Covers both 'unauthenticated' and 'unsupported' - LoginScreen
    // itself branches on the latter (see its own top comment).
    return <LoginScreen />;
  }

  return (
    <AppShell role={state.actor.role}>
      <CurrentScreen role={state.actor.role} />
    </AppShell>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationProvider>
          <RootNavigator />
        </NavigationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
