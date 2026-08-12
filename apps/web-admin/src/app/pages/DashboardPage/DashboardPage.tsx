import { EmptyState } from '@ecclesia/ui-web';
import type { RoleDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { BranchPastorDashboard } from './BranchPastorDashboard';
import { FinanceOfficerDashboard } from './FinanceOfficerDashboard';
import { MinistryLeaderDashboard } from './MinistryLeaderDashboard';
import { ResidentPastorDashboard } from './ResidentPastorDashboard';
import { SuperAdministratorDashboard } from './SuperAdministratorDashboard';

/**
 * Role-aware dashboard router (STEP 5, extended by the Remaining
 * Engineering Sprint, Milestone 11 - Objective 1). Five roles now get a
 * fully-built dashboard: `RESIDENT_PASTOR`/`ACTING_RESIDENT_PASTOR`
 * (`ResidentPastorDashboard`, built earlier), `BASONTA_LEADER` (Ministry
 * Leader), `TREASURER` (Finance Officer), `ASSISTANT_PASTOR` (Branch
 * Pastor), and `ADMIN` (Super Administrator - see
 * `SuperAdministratorDashboard.tsx`'s own doc comment for why `ADMIN`,
 * not `COUNCIL_OVERSEER`). Every other role still sees an honest,
 * role-specific stub rather than a broken or fabricated screen.
 *
 * `[Design Decision, disclosed]` `BASONTA_LEADER` is no longer grouped
 * with `BACENTA_LEADER`'s "lives on mobile" stub - this milestone's brief
 * explicitly asks for a Ministry Leader Web Admin dashboard, and
 * `BASONTA_LEADER` holds real, working `OWN_GROUP`-scoped grants for
 * every zone `MinistryLeaderDashboard` renders. `BACENTA_LEADER` alone
 * keeps the mobile-only routing below - PRD §16.2 still names that
 * persona's mobile dashboard "the single most important screen in the
 * product," unaffected by this change.
 */
export function DashboardPage() {
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;

  const role: RoleDto = state.actor.role;

  if (role === 'RESIDENT_PASTOR' || role === 'ACTING_RESIDENT_PASTOR') {
    return <ResidentPastorDashboard />;
  }

  if (role === 'BASONTA_LEADER') {
    return <MinistryLeaderDashboard />;
  }

  if (role === 'TREASURER') {
    return <FinanceOfficerDashboard />;
  }

  if (role === 'ASSISTANT_PASTOR') {
    return <BranchPastorDashboard />;
  }

  if (role === 'ADMIN') {
    return <SuperAdministratorDashboard />;
  }

  if (role === 'BACENTA_LEADER') {
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
      description="Your role's dashboard hasn't been implemented yet."
    />
  );
}
