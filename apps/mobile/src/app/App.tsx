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
 */
import { ThemeProvider } from '@ecclesia/ui-native';

import { AuthProvider, useAuth } from './auth/AuthContext';
import { AppShell } from './navigation/AppShell';
import { NavigationProvider, useCurrentScreen } from './navigation/Navigator';
import { LoginScreen } from './screens/Login/LoginScreen';
import { SessionRestoringScreen } from './screens/Login/SessionRestoringScreen';
import { ShepherdDashboardScreen } from './screens/ShepherdDashboard';
import { AttendanceCaptureScreen } from './screens/AttendanceCapture';
import { OfferingRecordingScreen } from './screens/OfferingRecording';
import { FollowUpQueueScreen } from './screens/FollowUpQueue';
import { ProfileScreen } from './screens/Profile';

function CurrentScreen() {
  const { screen } = useCurrentScreen();

  switch (screen) {
    case 'attendance-capture':
      return <AttendanceCaptureScreen />;
    case 'offering-recording':
      return <OfferingRecordingScreen />;
    case 'follow-up-queue':
      return <FollowUpQueueScreen />;
    case 'profile':
      return <ProfileScreen />;
    case 'dashboard':
    default:
      return <ShepherdDashboardScreen />;
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
    <AppShell>
      <CurrentScreen />
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
