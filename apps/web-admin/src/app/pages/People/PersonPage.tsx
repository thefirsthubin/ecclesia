import { PageContainer } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { BranchPeopleWorkspace } from './BranchPeopleWorkspace';
import { PersonDetailPage } from './PersonDetailPage';

/**
 * `[Whole Ecclesia layout rebalance, Branch Pastor People redesign]` The
 * `/people/:id` role dispatch. `ASSISTANT_PASTOR` gets the exact same
 * `BranchPeopleWorkspace` the `/people` route renders - the list stays
 * mounted with the profile drawer open to this `id`, not a separate
 * full-page navigation. Every other role keeps the exact standalone
 * `PersonDetailPage` they already had, now centered via `PageContainer`
 * (presentation only).
 */
export function PersonPage() {
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;

  if (state.actor.role === 'ASSISTANT_PASTOR') {
    return <BranchPeopleWorkspace />;
  }

  return (
    <PageContainer maxWidth={800}>
      <PersonDetailPage />
    </PageContainer>
  );
}
