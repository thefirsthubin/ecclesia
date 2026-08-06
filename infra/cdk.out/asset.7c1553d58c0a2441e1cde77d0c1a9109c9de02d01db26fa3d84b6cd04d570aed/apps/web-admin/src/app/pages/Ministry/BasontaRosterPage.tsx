import { useParams } from '../../router/router';
import { BasontaRosterView } from './BasontaRosterView';

/**
 * Route wrapper for `/ministry/:groupId` - reads the dynamic segment via
 * the router's `useParams()` and hands it to the router-agnostic
 * `BasontaRosterView`. `[Design Decision]` Unlike `/people/:id`
 * (`PersonDetailPage`, which reads `useParams()` directly), this page
 * needed its own thin wrapper because `BasontaRosterView` is also
 * rendered directly by `MinistryPage` for a Basonta Leader's own
 * `groupId` with no route param involved at all - splitting the
 * view from the route-param lookup avoids `BasontaRosterView` depending
 * on the router for a value it can just as easily receive as a prop.
 */
export function BasontaRosterPage() {
  const { groupId } = useParams<{ groupId: string }>();
  return <BasontaRosterView groupId={groupId} />;
}
