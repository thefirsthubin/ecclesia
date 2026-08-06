import { useAuth } from '../../auth/AuthContext';
import { BasontaDirectoryPage } from './BasontaDirectoryPage';
import { BasontaRosterView } from './BasontaRosterView';

/**
 * Role router for `/ministry`, the same pattern `DashboardPage` already
 * established for role-branching at a single route. A `BASONTA_LEADER`
 * already knows their own single Basonta (`actor.basontaId`) and has no
 * use for a directory - `GroupListResourceContextGuard` would deny them
 * one anyway (§3, `MINISTRY_PAGE_DESIGN_NOTES.md`) - so they go straight
 * to their own roster. Every other role sees the Basonta directory.
 */
export function MinistryPage() {
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;

  if (state.actor.role === 'BASONTA_LEADER' && state.actor.basontaId) {
    return <BasontaRosterView groupId={state.actor.basontaId} />;
  }

  return <BasontaDirectoryPage />;
}
