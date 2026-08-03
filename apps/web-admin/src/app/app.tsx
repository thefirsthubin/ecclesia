import { useEffect } from 'react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { AuthProvider, useAuth } from './auth/AuthContext';
import { SessionRestoringScreen } from './auth/SessionRestoringScreen';
import { Route, RouterProvider, Routes, useNavigate } from './router/router';
import { ProtectedRoute } from './router/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage/DashboardPage';
import { ConfigurationPage } from './pages/ConfigurationPage';
import { PeopleListPage } from './pages/People/PeopleListPage';
import { PersonDetailPage } from './pages/People/PersonDetailPage';
import { FollowUpTaskQueuePage } from './pages/PastoralCare/FollowUpTaskQueuePage';
import { MinistryPage } from './pages/Ministry/MinistryPage';
import { BasontaRosterPage } from './pages/Ministry/BasontaRosterPage';
import { GatheringsListPage } from './pages/Gatherings/GatheringsListPage';
import { StewardshipPage } from './pages/Stewardship/StewardshipPage';
import { InsightsPage } from './pages/Insights/InsightsPage';

/**
 * The Application Shell sprint's entry point (STEP 2). Replaces the UI
 * Foundation showcase (`FoundationShowcase`, git history) with the real
 * route tree: `/`, `/login`, `/dashboard`, and one stub per remaining
 * Design System §3.1 nav item. See `APPLICATION_SHELL_DESIGN_NOTES.md`
 * for the full reasoning behind every choice below.
 */
export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider>
          <AppRoutes />
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootRedirect() {
  const { state } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (state.status === 'authenticated') {
      navigate('/dashboard', { replace: true });
    } else if (state.status === 'unauthenticated') {
      navigate('/login', { replace: true });
    }
    // `restoring` intentionally does nothing yet - wait for it to resolve
    // one way or the other before picking a destination.
  }, [state.status, navigate]);

  // A visitor can land on `/` while the session-restoration check
  // (STEP 4) is still in flight - show the same restoring UI
  // `ProtectedRoute` uses rather than a blank page for that window.
  if (state.status === 'restoring') {
    return <SessionRestoringScreen />;
  }

  return null;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute breadcrumbs={[{ label: 'Dashboard' }]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/people"
        element={
          <ProtectedRoute breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'People' }]}>
            <PeopleListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/people/:id"
        element={
          <ProtectedRoute
            breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'People', href: '/people' }, { label: 'Person' }]}
          >
            <PersonDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pastoral-care"
        element={
          <ProtectedRoute breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pastoral Care' }]}>
            <FollowUpTaskQueuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry"
        element={
          <ProtectedRoute breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Ministry' }]}>
            <MinistryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/:groupId"
        element={
          <ProtectedRoute
            breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Ministry', href: '/ministry' }, { label: 'Basonta' }]}
          >
            <BasontaRosterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gatherings"
        element={
          <ProtectedRoute breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Gatherings' }]}>
            <GatheringsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stewardship"
        element={
          <ProtectedRoute breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Stewardship' }]}>
            <StewardshipPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <ProtectedRoute breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Insights' }]}>
            <InsightsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuration"
        element={
          <ProtectedRoute breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Configuration' }]}>
            <ConfigurationPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
