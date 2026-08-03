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
 */
import { ThemeProvider } from '@ecclesia/ui-native';

import { AuthProvider, useAuth } from './auth/AuthContext';
import { NavigationProvider, useCurrentScreen } from './navigation/Navigator';
import { LoginScreen } from './screens/Login/LoginScreen';
import { SessionRestoringScreen } from './screens/Login/SessionRestoringScreen';
import { ShepherdDashboardScreen } from './screens/ShepherdDashboard';
import { AttendanceCaptureScreen } from './screens/AttendanceCapture';

function RootNavigator() {
  const { state } = useAuth();
  const { screen } = useCurrentScreen();

  if (state.status === 'restoring') {
    return <SessionRestoringScreen />;
  }
  if (state.status !== 'authenticated') {
    // Covers both 'unauthenticated' and 'unsupported' - LoginScreen
    // itself branches on the latter (see its own top comment).
    return <LoginScreen />;
  }

  switch (screen) {
    case 'attendance-capture':
      return <AttendanceCaptureScreen />;
    case 'dashboard':
    default:
      return <ShepherdDashboardScreen />;
  }
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
