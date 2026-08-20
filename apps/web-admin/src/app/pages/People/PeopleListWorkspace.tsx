import { Drawer, PageContainer, useTheme } from '@ecclesia/ui-web';

import { useNavigate, useParams } from '../../router/router';
import { PeopleListPage } from './PeopleListPage';
import { PersonDetailPage } from './PersonDetailPage';
import { PotentialsSection } from './PotentialsSection';

/**
 * `[Whole Ecclesia layout rebalance, Branch Pastor People redesign,
 * Milestone D — Portal Experiences]` "People list -> click person -> side
 * panel opens, not a new page/tab" - the global side-profile requirement
 * every portal now shares, not just Branch Pastor's. Originally built
 * (and named) for `ASSISTANT_PASTOR` alone; renamed to this role-agnostic
 * name once `PeoplePage.tsx`/`PersonPage.tsx` started routing every
 * flat-list role (`ASSISTANT_PASTOR`, `BACENTA_LEADER`, `BASONTA_LEADER`)
 * through the same instance - the component itself has never had any
 * role-specific logic, only its dispatch call sites did. Registered for
 * both `/people` and `/people/:id` (see `app.tsx`) so this is the exact
 * same component instance across that navigation - `PeopleListPage`'s own
 * search/filter/sort `useState` never remounts, and never loses its
 * value, when a row is opened or the drawer is closed. `id` comes from
 * the real matched route's params (`useParams`, this router's own
 * dynamic-segment mechanism) - a real URL, not client-only UI state, so a
 * direct link to a Person still round-trips through login and still
 * deep-links correctly, and the browser back/forward buttons open and
 * close the drawer for free via the router's existing `popstate` handling.
 *
 * Reuses `PeopleListPage`/`PersonDetailPage` completely unmodified in
 * their own data-fetching, RBAC, and business logic - `PeopleDirectoryPage`
 * (Bacenta-organized directory, ADMIN/RESIDENT_PASTOR) is the other
 * People-workspace shape; it reuses this same `Drawer`+`PersonDetailPage`
 * pairing rather than a third implementation. This component itself is
 * presentation/navigation only.
 *
 * `[Post-Milestone D — Portal Experiences follow-up]` `PotentialsSection`
 * added below the list - all three roles routed here hold a real
 * `people.potential.*` grant (traced against `permission-matrix.ts`), a
 * gap found during Milestone D's own D11 audit.
 */
export function PeopleListWorkspace() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  return (
    <>
      <PageContainer maxWidth={1120}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
          <PeopleListPage />
          <PotentialsSection />
        </div>
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
