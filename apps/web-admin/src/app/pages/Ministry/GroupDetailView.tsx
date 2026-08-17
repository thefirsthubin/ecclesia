import { Card, ErrorState, PageContainer, Skeleton } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { useGroupName } from '../People/usePeopleData';
import { BacentaDetailView } from './BacentaDetailView';
import { BasontaRosterView } from './BasontaRosterView';

/**
 * `[UX Design Implementation]` Final UX Design Specification §19 (Phase 7
 * Ministry workflow UI) - fetches a Group by id and branches to the right
 * detail view by its real `type`, the same distinction
 * `BasontaDirectoryPage.tsx` already draws. A pure, router-agnostic
 * component (no `useParams`) so both `GroupDetailPage` (`/ministry/:groupId`,
 * reached from the directory) and `MinistryPage` (a `BACENTA_LEADER`'s own
 * `actor.bacentaId`, no route round-trip) can render it - the exact same
 * view-component/route-wrapper split `BasontaRosterView`/`GroupDetailPage`
 * already established for the Basonta side.
 */
export function GroupDetailView({ groupId }: { groupId: string }) {
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const groupState = useGroupName(accessToken, groupId);

  if (groupState.status === 'loading') {
    return (
      <PageContainer>
        <Card padding={6}>
          <Skeleton height={40} />
        </Card>
      </PageContainer>
    );
  }

  if (groupState.status === 'error') {
    return (
      <PageContainer>
        <Card padding={6}>
          <ErrorState title="Couldn't load this Group" onRetry={groupState.refetch} />
        </Card>
      </PageContainer>
    );
  }

  if (groupState.data.type === 'MINISTRY') {
    return <BasontaRosterView groupId={groupId} />;
  }

  return <BacentaDetailView group={groupState.data} />;
}
