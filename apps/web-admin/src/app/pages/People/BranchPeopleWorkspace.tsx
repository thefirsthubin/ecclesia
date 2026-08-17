import { Drawer, PageContainer } from '@ecclesia/ui-web';

import { useNavigate, useParams } from '../../router/router';
import { PeopleListPage } from './PeopleListPage';
import { PersonDetailPage } from './PersonDetailPage';

/**
 * `[Whole Ecclesia layout rebalance, Branch Pastor People redesign]`
 * "When the Branch Pastor clicks a person's name, do not navigate to a
 * new page - open the member profile as a side panel from the right,
 * preserving the People list underneath." Registered for both `/people`
 * and `/people/:id` (see `app.tsx`) so this is the exact same component
 * instance across that navigation - `PeopleListPage`'s own search/filter/
 * sort `useState` never remounts, and never loses its value, when a row
 * is opened or the drawer is closed. `id` comes from the real matched
 * route's params (`useParams`, this router's own dynamic-segment
 * mechanism) - a real URL, not client-only UI state, so a direct link to
 * a Person still round-trips through login and still deep-links
 * correctly, and the browser back/forward buttons open and close the
 * drawer for free via the router's existing `popstate` handling.
 *
 * Reuses `PeopleListPage`/`PersonDetailPage` completely unmodified in
 * their own data-fetching, RBAC, and business logic - every role other
 * than Branch Pastor still reaches those exact two components as
 * standalone full pages (`PeoplePage.tsx`/`PersonPage.tsx`'s own
 * non-`ASSISTANT_PASTOR` branch), unaffected by this component's
 * existence. This is presentation/navigation only.
 */
export function BranchPeopleWorkspace() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  return (
    <>
      <PageContainer maxWidth={1120}>
        <PeopleListPage />
      </PageContainer>
      <Drawer
        isOpen={Boolean(id)}
        onClose={() => navigate('/people')}
        title="Member Profile"
        side="right"
        width={560}
        testId="member-profile-drawer"
      >
        {id && <PersonDetailPage />}
      </Drawer>
    </>
  );
}
