import { EmptyState } from '@ecclesia/ui-web';
import type { RoleDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { ResidentPastorDashboard } from './ResidentPastorDashboard';

/**
 * Role-aware dashboard router (STEP 5). Only `RESIDENT_PASTOR`/
 * `ACTING_RESIDENT_PASTOR` get a fully-built dashboard this sprint — see
 * `APPLICATION_SHELL_DESIGN_NOTES.md` §1/§5 for why (matches web-admin's
 * real primary auth method and an already-existing endpoint exactly).
 * Every other role sees an honest, role-specific stub rather than a
 * broken or fabricated screen — nothing here invents dashboard content
 * the source documents don't specify for that role on this platform.
 */
export function DashboardPage() {
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;

  const role: RoleDto = state.actor.role;

  if (role === 'RESIDENT_PASTOR' || role === 'ACTING_RESIDENT_PASTOR') {
    return <ResidentPastorDashboard />;
  }

  if (role === 'BACENTA_LEADER' || role === 'BASONTA_LEADER') {
    return (
      <EmptyState
        icon="home"
        title="Your Bacenta dashboard lives on mobile"
        description="Design System §3.2 places the Shepherd's dashboard on the mobile app, not Web Admin. Open the Ecclesia mobile app to see it."
      />
    );
  }

  return (
    <EmptyState
      icon="clock"
      title="Dashboard — coming soon for this role"
      description="This sprint fully builds only the Resident Pastor's Branch dashboard. Your role's dashboard hasn't been implemented yet."
    />
  );
}
