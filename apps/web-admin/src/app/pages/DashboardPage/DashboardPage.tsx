import { EmptyState, PageContainer } from '@ecclesia/ui-web';
import type { RoleDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { BacentaLeaderDashboard } from './BacentaLeaderDashboard';
import { BranchAdministratorDashboard } from './BranchAdministratorDashboard';
import { BranchPastorDashboard } from './BranchPastorDashboard';
import { BranchTreasurerDashboard } from './BranchTreasurerDashboard';
import { CouncilDashboard } from './CouncilDashboard';
import { MinistryLeaderDashboard } from './MinistryLeaderDashboard';
import { ResidentPastorDashboard } from './ResidentPastorDashboard';
import { SystemAdministratorDashboard } from './SystemAdministratorDashboard';

/**
 * Role-aware dashboard router (STEP 5, extended by the Remaining
 * Engineering Sprint, Milestone 11 - Objective 1, and by Milestone D -
 * Portal Experiences). Eight roles now get a fully-built dashboard:
 * `RESIDENT_PASTOR`/`ACTING_RESIDENT_PASTOR` (`ResidentPastorDashboard`,
 * built earlier), `BASONTA_LEADER` (Ministry Leader), `BACENTA_LEADER`
 * (Portal 3), `TREASURER` (Branch Treasurer), `ASSISTANT_PASTOR` (Branch
 * Pastor), `ADMIN` (Branch Administrator - see
 * `BranchAdministratorDashboard.tsx`'s own doc comment for why `ADMIN`,
 * not `COUNCIL_OVERSEER`, and for that component's own rename history),
 * and `COUNCIL_OVERSEER`/`COUNCIL_TREASURER` (Portal 7). Every other role
 * still sees an honest, role-specific stub rather than a broken or
 * fabricated screen.
 *
 * `[Milestone D — Portal Experiences, Portal 3: Bacenta Leader]`
 * `BACENTA_LEADER`'s prior "lives on mobile" stub is replaced with a real
 * Web Admin dashboard (`BacentaLeaderDashboard`) - PRD §16.2 still names
 * the *mobile* Shepherd's dashboard the product's single most important
 * screen, unaffected by this change; this is a genuinely new, additional
 * surface for the same role, not a replacement for it.
 *
 * `[Milestone D — Portal Experiences, Portal 7: Council]`
 * `COUNCIL_OVERSEER`/`COUNCIL_TREASURER`'s prior "coming soon" stub is
 * replaced with `CouncilDashboard` - real, `council=true` Council-scoped
 * trend data, no fabricated multi-Branch preview.
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
    return <BranchTreasurerDashboard />;
  }

  if (role === 'ASSISTANT_PASTOR') {
    return <BranchPastorDashboard />;
  }

  if (role === 'ADMIN') {
    return <BranchAdministratorDashboard />;
  }

  if (role === 'BACENTA_LEADER') {
    return <BacentaLeaderDashboard />;
  }

  if (role === 'COUNCIL_OVERSEER' || role === 'COUNCIL_TREASURER') {
    return <CouncilDashboard />;
  }

  if (role === 'SYSTEM_ADMINISTRATOR') {
    return <SystemAdministratorDashboard />;
  }

  return (
    <PageContainer>
      <EmptyState
        icon="clock"
        title="Dashboard — coming soon for this role"
        description="Your role's dashboard hasn't been implemented yet."
      />
    </PageContainer>
  );
}
