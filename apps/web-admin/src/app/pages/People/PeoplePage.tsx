import { PageContainer } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { PeopleDirectoryWorkspace } from './PeopleDirectoryWorkspace';
import { PeopleListPage } from './PeopleListPage';
import { PeopleListWorkspace } from './PeopleListWorkspace';

/** `[Milestone D — Portal Experiences]` Roles whose real `people.person.read`
 * grant is a single Group (OWN_GROUP) or a small enumerable cluster
 * (CLUSTER) - the flat `PeopleListPage` (one table, no drill-down) is
 * already the right shape for them; only the profile needs to move into
 * a side drawer instead of a new page (`PeopleListWorkspace`). */
const FLAT_LIST_ROLES = ['ASSISTANT_PASTOR', 'BACENTA_LEADER', 'BASONTA_LEADER'] as const;

/** `[Milestone D]` Roles whose real grant is BRANCH-wide - the flat table
 * would otherwise dump every Person in the Branch into one list with no
 * organizing structure. These get the Bacenta-organized directory
 * instead (`PeopleDirectoryWorkspace`) - Portal 2/5's explicit "People
 * should be organized primarily by Bacenta" requirement. */
const DIRECTORY_ROLES = ['ADMIN', 'RESIDENT_PASTOR', 'ACTING_RESIDENT_PASTOR'] as const;

/**
 * `[Whole Ecclesia layout rebalance, Branch Pastor People redesign,
 * Milestone D — Portal Experiences]` The `/people` role dispatch - same
 * pattern `GatheringsPage.tsx`/`InsightsPage.tsx` already established for
 * their own per-role splits. Every role gets its Person profile in a side
 * drawer, never a new page (`PeopleListWorkspace`/`PeopleDirectoryWorkspace`
 * both wrap `PersonDetailPage` in the same `Drawer`) - only the *list*
 * shape differs by scope width. Any role with neither a flat-list nor a
 * directory grant (Treasurer, Council, System Administrator - none of
 * whom hold `people.person.read` at all, and have no People nav item to
 * begin with) falls back to the plain `PeopleListPage`, unchanged from
 * before this milestone, so a direct `/people` visit still resolves to
 * something rather than a blank dispatch.
 */
export function PeoplePage() {
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;

  if ((FLAT_LIST_ROLES as readonly string[]).includes(state.actor.role)) {
    return <PeopleListWorkspace />;
  }

  if ((DIRECTORY_ROLES as readonly string[]).includes(state.actor.role)) {
    return <PeopleDirectoryWorkspace />;
  }

  return (
    <PageContainer maxWidth={1120}>
      <PeopleListPage />
    </PageContainer>
  );
}
