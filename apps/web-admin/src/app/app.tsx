import { useEffect } from 'react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { AuthProvider, useAuth } from './auth/AuthContext';
import { SessionRestoringScreen } from './auth/SessionRestoringScreen';
import { Route, RouterProvider, Routes, useNavigate } from './router/router';
import { ProtectedRoute } from './router/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage/DashboardPage';
import { ConfigurationPage } from './pages/ConfigurationPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { PeopleListPage } from './pages/People/PeopleListPage';
import { PersonDetailPage } from './pages/People/PersonDetailPage';
import { FollowUpTaskQueuePage } from './pages/PastoralCare/FollowUpTaskQueuePage';
import { MinistryPage } from './pages/Ministry/MinistryPage';
import { GroupDetailPage } from './pages/Ministry/GroupDetailPage';
import { GatheringsListPage } from './pages/Gatherings/GatheringsListPage';
import { StewardshipPage } from './pages/Stewardship/StewardshipPage';
import { BranchFinanceOverviewPage } from './pages/Finance/BranchFinanceOverviewPage';
import { InsightsPage } from './pages/Insights/InsightsPage';

/**
 * The Application Shell sprint's entry point (STEP 2). Replaces the UI
 * Foundation showcase (`FoundationShowcase`, git history) with the real
 * route tree: `/`, `/login`, `/dashboard`, and one stub per remaining
 * Design System §3.1 nav item. See `APPLICATION_SHELL_DESIGN_NOTES.md`
 * for the full reasoning behind every choice below.
 *
 * `[People Intake milestone]` `ToastProvider` mounts here for the first
 * time - `libs/ui/web`'s own doc comment on it says to mount it once near
 * the app root "(same expectation as `ThemeProvider`)"; nested directly
 * inside `ThemeProvider` since every toast reads theme tokens. No earlier
 * sprint needed it (every prior page's success/error feedback was inline
 * form state), so this was previously built but unused.
 */
export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider>
            <AppRoutes />
          </RouterProvider>
        </AuthProvider>
      </ToastProvider>
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
            breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Ministry', href: '/ministry' }, { label: 'Group' }]}
          >
            <GroupDetailPage />
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
        path="/finance"
        element={
          <ProtectedRoute breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Finance' }]}>
            <BranchFinanceOverviewPage />
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
      <Route
        path="/audit-log"
        element={
          <ProtectedRoute breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Audit Log' }]}>
            <AuditLogPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
