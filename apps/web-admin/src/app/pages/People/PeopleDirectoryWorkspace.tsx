import { Drawer, PageContainer } from '@ecclesia/ui-web';

import { useNavigate, useParams } from '../../router/router';
import { PeopleDirectoryPage } from './PeopleDirectoryPage';
import { PersonDetailPage } from './PersonDetailPage';

/**
 * `[Milestone D — Portal Experiences]` The Bacenta-directory counterpart
 * to `PeopleListWorkspace` - identical `Drawer`+`PersonDetailPage`
 * wiring (see that file's own doc comment for the full reasoning: route-
 * driven open/close state, deep-linkable, `PersonDetailPage` reused
 * completely unmodified), just wrapping `PeopleDirectoryPage` instead of
 * `PeopleListPage` as the list-side content. Registered for both
 * `/people` and `/people/:id` for `ADMIN`/`RESIDENT_PASTOR`/
 * `ACTING_RESIDENT_PASTOR` (`PeoplePage.tsx`/`PersonPage.tsx`).
 */
export function PeopleDirectoryWorkspace() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  return (
    <>
      <PageContainer maxWidth={1120}>
        <PeopleDirectoryPage />
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
