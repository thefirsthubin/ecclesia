import { useAuth } from '../../auth/AuthContext';
import { BranchGatheringsView } from './BranchGatheringsView';
import { GatheringsListPage } from './GatheringsListPage';

/**
 * `[Branch Pastor portal, Gatherings sprint]` The `/gatherings` role
 * dispatch - same pattern `InsightsPage.tsx` already established for its
 * own per-role split. `ASSISTANT_PASTOR` gets the Bacenta-meeting/Sunday-
 * Service/other-service grouped view (`BranchGatheringsView`); every
 * other role keeps the exact `GatheringsListPage` they already had,
 * completely unchanged - this file changes what `ASSISTANT_PASTOR` sees
 * and nothing else.
 */
export function GatheringsPage() {
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;

  if (state.actor.role === 'ASSISTANT_PASTOR') {
    return <BranchGatheringsView />;
  }

  return <GatheringsListPage />;
}
