import { useParams } from '../../router/router';
import { GroupDetailView } from './GroupDetailView';

/**
 * `[UX Design Implementation]` Final UX Design Specification §19 (Phase 7
 * Ministry workflow UI) - `/ministry/:groupId`'s route wrapper, replacing
 * the old Basonta-only `BasontaRosterPage`. `:groupId` was always a
 * generic Group id, not literally scoped to a Basonta - this generalizes
 * the wrapper to match. All the actual fetch-and-branch-by-type logic
 * lives in `GroupDetailView`, which this thin wrapper renders with the
 * route's own `:groupId` param - the exact same route-wrapper/view split
 * `BasontaRosterPage` used before it.
 */
export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  return <GroupDetailView groupId={groupId} />;
}
