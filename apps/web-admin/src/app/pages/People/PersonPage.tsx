import { PageContainer } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { PeopleDirectoryWorkspace } from './PeopleDirectoryWorkspace';
import { PersonDetailPage } from './PersonDetailPage';
import { PeopleListWorkspace } from './PeopleListWorkspace';

const FLAT_LIST_ROLES = ['ASSISTANT_PASTOR', 'BACENTA_LEADER', 'BASONTA_LEADER'] as const;
const DIRECTORY_ROLES = ['ADMIN', 'RESIDENT_PASTOR', 'ACTING_RESIDENT_PASTOR'] as const;

/**
 * `[Whole Ecclesia layout rebalance, Branch Pastor People redesign,
 * Milestone D — Portal Experiences]` The `/people/:id` role dispatch -
 * mirrors `PeoplePage.tsx`'s own three-way split exactly, so `/people`
 * and `/people/:id` always resolve to the *same* workspace instance for a
 * given role (the same component reused across both routes is what makes
 * the drawer open/close a route transition rather than a remount - see
 * `PeopleListWorkspace`'s own doc comment). Every other role keeps the
 * exact standalone `PersonDetailPage` they already had, now centered via
 * `PageContainer` (presentation only).
 */
export function PersonPage() {
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;

  if ((FLAT_LIST_ROLES as readonly string[]).includes(state.actor.role)) {
    return <PeopleListWorkspace />;
  }

  if ((DIRECTORY_ROLES as readonly string[]).includes(state.actor.role)) {
    return <PeopleDirectoryWorkspace />;
  }

  return (
    <PageContainer maxWidth={800}>
      <PersonDetailPage />
    </PageContainer>
  );
}
