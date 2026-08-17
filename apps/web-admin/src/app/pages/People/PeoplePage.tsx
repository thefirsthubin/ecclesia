import { PageContainer } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { BranchPeopleWorkspace } from './BranchPeopleWorkspace';
import { PeopleListPage } from './PeopleListPage';

/**
 * `[Whole Ecclesia layout rebalance, Branch Pastor People redesign]` The
 * `/people` role dispatch - same pattern `GatheringsPage.tsx`/
 * `InsightsPage.tsx` already established for their own per-role splits.
 * `ASSISTANT_PASTOR` gets the list+side-drawer workspace
 * (`BranchPeopleWorkspace`); every other role keeps the exact
 * `PeopleListPage` they already had, just now centered via the shared
 * `PageContainer` (presentation only - same component, same data, same
 * RBAC).
 */
export function PeoplePage() {
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;

  if (state.actor.role === 'ASSISTANT_PASTOR') {
    return <BranchPeopleWorkspace />;
  }

  return (
    <PageContainer maxWidth={1120}>
      <PeopleListPage />
    </PageContainer>
  );
}
