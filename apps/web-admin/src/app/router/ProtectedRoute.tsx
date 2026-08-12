import { useEffect, type ReactNode } from 'react';
import type { BreadcrumbItem } from '@ecclesia/ui-web';

import { useAuth } from '../auth/AuthContext';
import { SessionRestoringScreen } from '../auth/SessionRestoringScreen';
import { AppShell } from '../shell/AppShell';
import { useLocation, useNavigate } from './router';

export interface ProtectedRouteProps {
  children: ReactNode;
  breadcrumbs: BreadcrumbItem[];
}

const REDIRECT_STORAGE_KEY = 'ecclesia.postLoginRedirect';

export function rememberIntendedPath(path: string) {
  window.sessionStorage.setItem(REDIRECT_STORAGE_KEY, path);
}

export function consumeIntendedPath(): string {
  const path = window.sessionStorage.getItem(REDIRECT_STORAGE_KEY) ?? '/dashboard';
  window.sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
  return path;
}

/**
 * STEP 4's "Protected Routes" + "Session Restoration" + "preserve the
 * originally-requested path through login". Every non-login route in
 * `app.tsx` is wrapped in this.
 */
export function ProtectedRoute({ children, breadcrumbs }: ProtectedRouteProps) {
  const { state } = useAuth();
  const { path } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (state.status === 'unauthenticated') {
      // The *actual* current path (e.g. `/people/abc-123`, not just the
      // route pattern `/people/:id`) - `useLocation()` reports the real
      // URL, so a direct link to a detail page still round-trips through
      // login correctly.
      rememberIntendedPath(path);
      navigate('/login', { replace: true });
    }
  }, [state.status, path, navigate]);

  if (state.status === 'restoring') {
    return <SessionRestoringScreen />;
  }

  if (state.status !== 'authenticated') {
    // The `useEffect` above already kicked off the redirect - render
    // nothing for the one tick before it lands, rather than a flash of
    // stale protected content.
    return null;
  }

  return <AppShell breadcrumbs={breadcrumbs}>{children}</AppShell>;
}
