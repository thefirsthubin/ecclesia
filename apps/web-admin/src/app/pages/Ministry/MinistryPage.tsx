import { useAuth } from '../../auth/AuthContext';
import { BasontaDirectoryPage } from './BasontaDirectoryPage';
import { BasontaRosterView } from './BasontaRosterView';
import { GroupDetailView } from './GroupDetailView';

/**
 * Role router for `/ministry`, the same pattern `DashboardPage` already
 * established for role-branching at a single route. A `BASONTA_LEADER`
 * already knows their own single Basonta (`actor.basontaId`) and has no
 * use for a directory - `GroupListResourceContextGuard` would deny them
 * one anyway (§3, `MINISTRY_PAGE_DESIGN_NOTES.md`) - so they go straight
 * to their own roster.
 *
 * `[UX Design Implementation]` Final UX Design Specification §19 (Phase 7
 * Ministry workflow UI) - `BACENTA_LEADER` now gets the exact same direct
 * bypass, to their own Bacenta detail (`GroupDetailView`, `actor.bacentaId`)
 * instead of a directory neither of these OWN_GROUP-scoped roles can
 * successfully call - `GroupListResourceContextGuard`'s own doc comment
 * (`apps/api/.../group-resource-context.guard.ts`) names this as the
 * deliberate reason a `BACENTA_LEADER`/`BASONTA_LEADER` "already knows
 * their own single Group id ... and has no need to list." Not a new rule
 * invented here - the same disclosed design the Basonta side already
 * applied, now closed for the Bacenta side too (previously unreachable
 * from Web Admin for this role at all).
 *
 * Every other role sees the Group directory.
 */
export function MinistryPage() {
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;

  if (state.actor.role === 'BASONTA_LEADER' && state.actor.basontaId) {
    return <BasontaRosterView groupId={state.actor.basontaId} />;
  }

  if (state.actor.role === 'BACENTA_LEADER' && state.actor.bacentaId) {
    return <GroupDetailView groupId={state.actor.bacentaId} />;
  }

  return <BasontaDirectoryPage />;
}
