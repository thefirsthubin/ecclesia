import { fireEvent, render, screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { PersonDetailPage } from './PersonDetailPage';

/** `[UX Design Implementation]` Final UX Design Specification §19 (Phase 3
 * People workflow UI) - `PersonDetailPage` now shows a success toast after
 * creating a Follow-up task (`useToast()`, the same `NewPersonForm.tsx`
 * precedent), so every render needs a `ToastProvider` in its tree, the
 * same "mounted once, used by any descendant" shape `PeopleListPage.spec.tsx`
 * already established for its own `NewPersonForm` usage. */
function renderPage() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <PersonDetailPage />
      </ToastProvider>
    </ThemeProvider>,
  );
}

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// `useParams()` reads from the router's `ParamsContext`, which normally
// comes from a matched `<Route path="/people/:id">` - mocked directly here
// so this test doesn't need a full `RouterProvider`/`Routes` tree just to
// get one param value in, mirroring how `AuthContext` itself is mocked.
jest.mock('../../router/router', () => ({
  useParams: () => ({ id: 'person-1' }),
}));

/** `[UX Design Implementation]` Final UX Design Specification §15 -
 * `PersonDetailPage` now renders three tabs (Overview/Groups/Roles) with
 * only the active panel's content in the DOM (`Tabs`'s own documented
 * behavior). Every test below that needs Groups- or Roles-tab content
 * switches to it first via this helper, matching how a real user would
 * actually reach that content now - Overview is the default tab, so
 * tests that only touch profile/lifecycle-transition content need no
 * switch at all. */
function switchToTab(name: 'Overview' | 'Groups' | 'Roles' | 'Pastoral Care') {
  fireEvent.click(screen.getByRole('tab', { name }));
}

function person(overrides: Record<string, unknown> = {}) {
  return {
    id: 'person-1',
    branchId: 'branch-1',
    firstName: 'Ama',
    lastName: 'Owusu',
    phone: '+233555000111',
    email: null,
    dateOfBirth: null,
    address: null,
    lifecycleStage: 'MEMBER',
    guardianPersonId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function membership(overrides: Record<string, unknown> = {}) {
  return {
    id: 'membership-1',
    personId: 'person-1',
    groupId: 'group-1',
    groupType: 'PASTORAL_CARE',
    startedAt: new Date('2024-01-01').toISOString(),
    endedAt: null,
    reason: null,
    ...overrides,
  };
}

function roleAssignment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'role-1',
    personId: 'person-1',
    role: 'BACENTA_LEADER',
    branchId: 'branch-1',
    groupId: 'group-1',
    scopeGroupIds: [],
    effectiveFrom: new Date('2024-01-01').toISOString(),
    effectiveTo: null,
    ...overrides,
  };
}

function group(overrides: Record<string, unknown> = {}) {
  return {
    id: 'group-1',
    branchId: 'branch-1',
    type: 'PASTORAL_CARE',
    name: 'Faith Bacenta',
    meetingSchedule: null,
    meetingLocation: null,
    category: null,
    lifecycleStatus: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/** `[Milestone D — Portal Experiences]` Matches a route only at a real
 * path boundary (`url` ends with `path`, or `path` is immediately
 * followed by `?`) - plain `url.includes(path)` is a raw substring
 * check, which silently matches a short route (e.g. `/people/person-1`)
 * against any longer nested path that happens to start with it (e.g.
 * `/people/person-1/pastoral-notes`), handing that call the bare Person
 * object instead of a notes array. A real bug this exact fix uncovered
 * (`pastoralNotesState.data.map is not a function`) and now prevents for
 * any future route pair with the same shape. Falls back to the longest
 * boundary-matching route as a tiebreaker for genuine ambiguity. */
function mockFetchByPath(routes: Record<string, unknown>) {
  return jest.fn().mockImplementation((url: string) => {
    const matches = Object.entries(routes).filter(([path]) => url.endsWith(path) || url.includes(`${path}?`));
    if (matches.length === 0) {
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    }
    const [, body] = matches.reduce((longest, current) => (current[0].length > longest[0].length ? current : longest));
    return Promise.resolve({ ok: true, json: async () => body });
  });
}

afterEach(() => jest.clearAllMocks());

describe('PersonDetailPage', () => {
  it('renders the profile on the default Overview tab, and group/role history on their own tabs (FR-PPL-07)', async () => {
    mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
    global.fetch = mockFetchByPath({
      '/people/person-1/group-memberships': [membership()],
      '/people/person-1/role-assignments': [roleAssignment()],
      '/groups/group-1': group(),
      '/people/person-1': person(),
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Ama Owusu' })).toBeInTheDocument();
    expect(screen.getByText('+233555000111')).toBeInTheDocument();

    switchToTab('Groups');
    await waitFor(() => expect(screen.getByText('Faith Bacenta')).toBeInTheDocument());

    switchToTab('Roles');
    expect(screen.getByText('BACENTA LEADER')).toBeInTheDocument();
  });

  /** `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 3 People workflow UI) - the Overview tab's lifecycle badge
   * previously hardcoded `status="success"` regardless of the Person's
   * real stage, so e.g. a Lapsed Person's own profile showed a green
   * "on track" badge. Pins the fix (the same `LIFECYCLE_BADGE_STATUS`
   * mapping `PeopleListPage.tsx` already used) against a stage that was
   * never "success" green - `LAPSED` maps to `danger` (a Person who
   * stopped attending, not good news). */
  it('shows the lifecycle badge in a color that matches the actual stage, not always green', async () => {
    mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
    global.fetch = mockFetchByPath({
      '/people/person-1/group-memberships': [],
      '/people/person-1/role-assignments': [],
      '/people/person-1': person({ lifecycleStage: 'LAPSED' }),
    });

    renderPage();

    await waitFor(() => expect(screen.getByText('Lapsed')).toBeInTheDocument());
    // `status.danger.background` (light mode) - not the `status.success`
    // green the old hardcoded badge would have shown here.
    expect(screen.getByText('Lapsed')).toHaveStyle({ backgroundColor: '#FBEAEA' });
  });

  it('shows an empty state on the Groups tab and the Roles tab when a Person has no history yet', async () => {
    mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
    global.fetch = mockFetchByPath({
      '/people/person-1/group-memberships': [],
      '/people/person-1/role-assignments': [],
      '/people/person-1': person(),
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());

    switchToTab('Groups');
    await waitFor(() => expect(screen.getByText('No group history yet')).toBeInTheDocument());

    switchToTab('Roles');
    await waitFor(() => expect(screen.getByText('No roles held yet')).toBeInTheDocument());
  });

  it('shows a retryable error state when the Person record itself fails to load', async () => {
    mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load this Person")).toBeInTheDocument());
  });

  /**
   * `[UX Design Implementation]` Final UX Design Specification §19 (Phase
   * 3 People workflow UI) - the new Follow-up Task creation entry point
   * on the Overview tab. Reuses `usePastoralCareData.ts`'s real
   * `createFollowUpTask`/`searchPeopleForEscalation` (the exact functions
   * `FollowUpTaskQueuePage.tsx`'s own "Create Follow-up task" form
   * already calls) with the subject Person fixed to this page's own
   * Person - no new endpoint, no client-side role check, matching every
   * other action on this page.
   */
  describe('Follow-up Task creation', () => {
    it('offers the action unconditionally on the Overview tab', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      global.fetch = mockFetchByPath({
        '/people/person-1/group-memberships': [],
        '/people/person-1/role-assignments': [],
        '/people/person-1': person({ lifecycleStage: 'MEMBER' }),
      });

      renderPage();

      await screen.findByRole('button', { name: 'Create Follow-up task for this Person' });
    });

    it('searches People via RecordPicker and POSTs /people/:id/follow-up-tasks, then shows a success toast and closes the form', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/people/person-1/follow-up-tasks') && init?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: 'ft-1', branchId: 'branch-1', groupId: null, personId: 'person-1', assignedToPersonId: 'assignee-1', status: 'OPEN', dueAt: null, escalatedAt: null, escalatedToPersonId: null, createdByPersonId: 'admin-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
          });
        }
        if (url.includes('/people?search=')) {
          return Promise.resolve({ ok: true, json: async () => [person({ id: 'assignee-1', firstName: 'Kwame', lastName: 'Asante' })] });
        }
        if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person({ lifecycleStage: 'MEMBER' }) });
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();

      fireEvent.click(await screen.findByRole('button', { name: 'Create Follow-up task for this Person' }));

      const input = await screen.findByLabelText('Assign to');
      fireEvent.change(input, { target: { value: 'Kwame' } });
      await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Kwame Asante'));

      const submitButton = await screen.findByRole('button', { name: 'Confirm create' });
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);

      await waitForElementToBeRemoved(() => screen.queryByTestId('person-follow-up-form'));

      const postCall = fetchMock.mock.calls.find(
        ([url, requestInit]) => (url as string).includes('/people/person-1/follow-up-tasks') && (requestInit as RequestInit)?.method === 'POST',
      );
      expect(postCall).toBeDefined();
      expect(JSON.parse((postCall as [string, RequestInit])[1].body as string)).toEqual({
        assignedToPersonId: 'assignee-1',
        trigger: 'MANUAL',
        groupId: undefined,
        dueAtOverride: undefined,
      });
      expect(await screen.findByText('Follow-up task created for Ama Owusu.')).toBeInTheDocument();
    });

    it('shows the server-provided error inline and keeps the form open on failure', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/people/person-1/follow-up-tasks') && init?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: async () => ({ message: "No Role Assignment grants 'pastoral_care.followup_task.create' to role 'ADMIN'" }),
          });
        }
        if (url.includes('/people?search=')) {
          return Promise.resolve({ ok: true, json: async () => [person({ id: 'assignee-1', firstName: 'Kwame', lastName: 'Asante' })] });
        }
        if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person({ lifecycleStage: 'MEMBER' }) });
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });

      renderPage();

      fireEvent.click(await screen.findByRole('button', { name: 'Create Follow-up task for this Person' }));

      const input = await screen.findByLabelText('Assign to');
      fireEvent.change(input, { target: { value: 'Kwame' } });
      await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Kwame Asante'));

      fireEvent.click(await screen.findByRole('button', { name: 'Confirm create' }));

      await waitFor(() =>
        expect(screen.getByText("No Role Assignment grants 'pastoral_care.followup_task.create' to role 'ADMIN'")).toBeInTheDocument(),
      );
      expect(screen.getByTestId('person-follow-up-form')).toBeInTheDocument();
    });
  });

  /**
   * `[Lifecycle Stage Transition milestone]` FR-PPL-03's Web Admin
   * surface, on the default Overview tab - no tab switch needed. No
   * `state.actor` is mocked in any of these (matching every other test
   * in this file) - the action deliberately has no client-side role
   * check of its own, per `usePeopleData.ts`'s own doc comment on
   * `transitionLifecycleStage`.
   */
  describe('lifecycle stage transition', () => {
    it('offers the transition action for a Person at a non-terminal stage, scoped to the modeled next stage(s)', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      global.fetch = mockFetchByPath({
        '/people/person-1/group-memberships': [],
        '/people/person-1/role-assignments': [],
        '/people/person-1': person({ lifecycleStage: 'FOLLOW_UP' }),
      });

      renderPage();

      const button = await screen.findByRole('button', { name: 'Transition lifecycle stage' });
      fireEvent.click(button);

      const select = await screen.findByLabelText('New stage');
      // FOLLOW_UP -> ASSIGNED_TO_BACENTA is excluded (Group Membership
      // endpoint's job) - only LAPSED should be offered.
      const optionLabels = Array.from(select.querySelectorAll('option')).map((option) => option.textContent);
      expect(optionLabels).toEqual(['Select a stage…', 'Lapsed']);
    });

    it('does not offer the transition action for a Person already at the terminal MEMBER stage', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      global.fetch = mockFetchByPath({
        '/people/person-1/group-memberships': [],
        '/people/person-1/role-assignments': [],
        '/people/person-1': person({ lifecycleStage: 'MEMBER' }),
      });

      renderPage();

      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
      expect(screen.queryByRole('button', { name: 'Transition lifecycle stage' })).not.toBeInTheDocument();
    });

    it('submits the chosen stage and reason, then re-fetches so the new stage renders', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      let personCallCount = 0;
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/people/person-1/lifecycle-transitions') && init?.method === 'POST') {
          return Promise.resolve({ ok: true, json: async () => person({ lifecycleStage: 'LAPSED' }) });
        }
        if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1')) {
          personCallCount += 1;
          return Promise.resolve({ ok: true, json: async () => person({ lifecycleStage: personCallCount === 1 ? 'FOLLOW_UP' : 'LAPSED' }) });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();

      fireEvent.click(await screen.findByRole('button', { name: 'Transition lifecycle stage' }));
      fireEvent.change(await screen.findByLabelText('New stage'), { target: { value: 'LAPSED' } });
      fireEvent.change(screen.getByLabelText('Reason (optional)'), { target: { value: 'No response after 3 attempts' } });
      fireEvent.click(screen.getByRole('button', { name: 'Confirm transition' }));

      // Not a plain `waitFor(() => textContent has 'Lapsed')` - the
      // still-open picker's own `<option>Lapsed</option>` would satisfy
      // that immediately, before the submit even resolves.
      // `waitForElementToBeRemoved` correctly waits for the form (and the
      // `refetch()` loading/success round-trip behind it) to actually
      // finish.
      await waitForElementToBeRemoved(() => screen.queryByTestId('lifecycle-transition-form'));
      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toHaveTextContent('Lapsed'));

      const postCall = fetchMock.mock.calls.find(([url, init]) => (url as string).includes('/lifecycle-transitions') && (init as RequestInit)?.method === 'POST');
      expect(postCall).toBeDefined();
      const [postUrl, postInit] = postCall as [string, RequestInit];
      expect(postUrl).toContain('/people/person-1/lifecycle-transitions');
      expect(JSON.parse(postInit.body as string)).toEqual({ toStage: 'LAPSED', reason: 'No response after 3 attempts' });
    });

    it('shows the server-provided reason inline and keeps the form open when the transition is denied', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/lifecycle-transitions') && init?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: async () => ({ message: "No Role Assignment grants 'people.person.lifecycle_stage.update' to role 'RESIDENT_PASTOR'" }),
          });
        }
        if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person({ lifecycleStage: 'FOLLOW_UP' }) });
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();

      fireEvent.click(await screen.findByRole('button', { name: 'Transition lifecycle stage' }));
      fireEvent.change(await screen.findByLabelText('New stage'), { target: { value: 'LAPSED' } });
      fireEvent.click(screen.getByRole('button', { name: 'Confirm transition' }));

      await waitFor(() =>
        expect(screen.getByText("No Role Assignment grants 'people.person.lifecycle_stage.update' to role 'RESIDENT_PASTOR'")).toBeInTheDocument(),
      );
      expect(screen.getByTestId('lifecycle-transition-form')).toBeInTheDocument();
    });
  });

  /**
   * `[Group Membership Assignment milestone]` PRD §17.3's "Bacenta/Basonta:
   * reassign member" row, on the Groups tab - every test switches there
   * first. No `state.actor` mocked here either, matching every other test
   * in this file - `assignGroupMembership` has no client-side role check
   * of its own, same reasoning as `transitionLifecycleStage`.
   */
  describe('Bacenta/Basonta assignment', () => {
    it('offers the action unconditionally - unlike lifecycle transition, there is no terminal state that removes it', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      global.fetch = mockFetchByPath({
        '/people/person-1/group-memberships': [],
        '/people/person-1/role-assignments': [],
        '/people/person-1': person({ lifecycleStage: 'MEMBER' }),
      });

      renderPage();

      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
      switchToTab('Groups');

      await screen.findByRole('button', { name: 'Assign to Bacenta or Basonta' });
    });

    it('searches Groups via RecordPicker and POSTs the selection, then refetches membership history and the Person', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      let personCallCount = 0;
      let membershipCallCount = 0;
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/people/person-1/group-memberships') && init?.method === 'POST') {
          return Promise.resolve({ ok: true, json: async () => membership({ groupId: 'bacenta-9' }) });
        }
        if (url.includes('/groups') && url.includes('search')) {
          // searchGroupsForAssignment never sends a `search` query param
          // (GET /groups has none) - this branch should never match; its
          // presence here would fail the test by falling through to 404.
          return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
        }
        if (url.endsWith('/groups')) {
          return Promise.resolve({ ok: true, json: async () => [group({ id: 'bacenta-9', name: 'Grace Bacenta' })] });
        }
        if (url.includes('/people/person-1/group-memberships')) {
          membershipCallCount += 1;
          return Promise.resolve({ ok: true, json: async () => (membershipCallCount === 1 ? [] : [membership({ groupId: 'bacenta-9' })]) });
        }
        if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1')) {
          personCallCount += 1;
          // Proves the PRD §19.1 step 6 side effect is reflected: the
          // Person is re-fetched after a successful assignment, and this
          // second fetch returns the server's real post-assignment stage.
          return Promise.resolve({ ok: true, json: async () => person({ lifecycleStage: personCallCount === 1 ? 'FOLLOW_UP' : 'ASSIGNED_TO_BACENTA' }) });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();

      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
      switchToTab('Groups');

      fireEvent.click(await screen.findByRole('button', { name: 'Assign to Bacenta or Basonta' }));

      const input = await screen.findByLabelText('Bacenta or Basonta');
      fireEvent.change(input, { target: { value: 'Grace' } });

      await waitFor(() => expect(screen.getByText('Grace Bacenta')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Grace Bacenta'));

      const submitButton = await screen.findByRole('button', { name: 'Confirm assignment' });
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);

      await waitForElementToBeRemoved(() => screen.queryByTestId('group-assignment-form'));

      const postCall = fetchMock.mock.calls.find(
        ([url, init]) => (url as string).includes('/people/person-1/group-memberships') && (init as RequestInit)?.method === 'POST',
      );
      expect(postCall).toBeDefined();
      expect(JSON.parse((postCall as [string, RequestInit])[1].body as string)).toEqual({ groupId: 'bacenta-9' });

      // Both dependent reads refetched - membership history (still on
      // this tab) now shows the new row...
      await waitFor(() => expect(screen.getByTestId('group-membership-history-card')).not.toHaveTextContent('No group history yet'));

      // ...and the Person's Badge, on the Overview tab, reflects the
      // server-side lifecycle-stage side effect (FOLLOW_UP -> ASSIGNED_TO_BACENTA)
      // - switching tabs to see it is the honest reflection of the real
      // tabbed interaction model (Final UX Design Specification §15),
      // not a workaround.
      switchToTab('Overview');
      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toHaveTextContent('Assigned to Bacenta'));
    });

    it('shows the server-provided reason-required message inline and keeps the form open on a 400', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/people/person-1/group-memberships') && init?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: async () => ({ message: 'A reason is required when this assignment closes an existing active Bacenta membership (PRD §16.1 reassignment surface)' }),
          });
        }
        if (url.endsWith('/groups')) return Promise.resolve({ ok: true, json: async () => [group({ id: 'bacenta-9', name: 'Grace Bacenta' })] });
        if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [membership()] });
        if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person({ lifecycleStage: 'MEMBER' }) });
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();

      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
      switchToTab('Groups');

      fireEvent.click(await screen.findByRole('button', { name: 'Assign to Bacenta or Basonta' }));
      fireEvent.change(await screen.findByLabelText('Bacenta or Basonta'), { target: { value: 'Grace' } });
      await waitFor(() => expect(screen.getByText('Grace Bacenta')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Grace Bacenta'));
      fireEvent.click(screen.getByRole('button', { name: 'Confirm assignment' }));

      await waitFor(() => expect(screen.getByText(/A reason is required/)).toBeInTheDocument());
      expect(screen.getByTestId('group-assignment-form')).toBeInTheDocument();
    });

    it('shows the server-provided conflict message inline on a 409 (e.g. already active in the target Group)', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/people/person-1/group-memberships') && init?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 409,
            json: async () => ({ message: "Person already holds an active PASTORAL_CARE membership in group 'bacenta-9' - not a valid reassignment or duplicate join" }),
          });
        }
        if (url.endsWith('/groups')) return Promise.resolve({ ok: true, json: async () => [group({ id: 'bacenta-9', name: 'Grace Bacenta' })] });
        if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [membership({ groupId: 'bacenta-9' })] });
        if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person({ lifecycleStage: 'MEMBER' }) });
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();

      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
      switchToTab('Groups');

      fireEvent.click(await screen.findByRole('button', { name: 'Assign to Bacenta or Basonta' }));
      fireEvent.change(await screen.findByLabelText('Bacenta or Basonta'), { target: { value: 'Grace' } });
      await waitFor(() => expect(screen.getByText('Grace Bacenta')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Grace Bacenta'));
      fireEvent.click(screen.getByRole('button', { name: 'Confirm assignment' }));

      await waitFor(() => expect(screen.getByText(/not a valid reassignment or duplicate join/)).toBeInTheDocument());
      expect(screen.getByTestId('group-assignment-form')).toBeInTheDocument();
    });
  });

  /**
   * `[Role Assignment Management milestone]` PRD §17.3's "Role
   * Assignment: grant Shepherd/Worker/etc." row, on the Roles tab - every
   * test switches there first. No `state.actor` mocked here either -
   * `grantRoleAssignment` has no client-side role check of its own.
   */
  describe('role grant', () => {
    it('offers the Grant role action unconditionally', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      global.fetch = mockFetchByPath({
        '/people/person-1/group-memberships': [],
        '/people/person-1/role-assignments': [],
        '/people/person-1': person(),
      });

      renderPage();

      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
      switchToTab('Roles');

      await screen.findByRole('button', { name: 'Grant role' });
    });

    it('grants a plain role (no Group required) and refetches role history', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      let roleCallCount = 0;
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/people/person-1/role-assignments') && init?.method === 'POST') {
          return Promise.resolve({ ok: true, json: async () => roleAssignment({ role: 'WORKER', groupId: null }) });
        }
        if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1/role-assignments')) {
          roleCallCount += 1;
          return Promise.resolve({ ok: true, json: async () => (roleCallCount === 1 ? [] : [roleAssignment({ role: 'WORKER', groupId: null })]) });
        }
        if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();

      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
      switchToTab('Roles');

      fireEvent.click(await screen.findByRole('button', { name: 'Grant role' }));
      // No Group picker for a non-Group-scoped role - Confirm should be
      // reachable and enabled from just the Role select.
      fireEvent.change(await screen.findByLabelText('Role'), { target: { value: 'WORKER' } });
      expect(screen.queryByLabelText('Bacenta or Basonta')).not.toBeInTheDocument();

      const submitButton = screen.getByRole('button', { name: 'Confirm grant' });
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);

      await waitFor(() => expect(screen.getByTestId('role-assignment-history-card')).toHaveTextContent('WORKER'));
      expect(screen.queryByTestId('role-grant-form')).not.toBeInTheDocument();

      const postCall = fetchMock.mock.calls.find(([url, init]) => (url as string).includes('/role-assignments') && (init as RequestInit)?.method === 'POST');
      expect(postCall).toBeDefined();
      expect(JSON.parse((postCall as [string, RequestInit])[1].body as string)).toEqual({ role: 'WORKER', groupId: undefined, scopeGroupIds: [] });
    });

    it('requires a Group for a Group-scoped role (BACENTA_LEADER) before Confirm is enabled, and sends groupId', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/people/person-1/role-assignments') && init?.method === 'POST') {
          return Promise.resolve({ ok: true, json: async () => roleAssignment({ role: 'BACENTA_LEADER', groupId: 'bacenta-9' }) });
        }
        if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.endsWith('/groups')) return Promise.resolve({ ok: true, json: async () => [group({ id: 'bacenta-9', name: 'Grace Bacenta' })] });
        if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();

      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
      switchToTab('Roles');

      fireEvent.click(await screen.findByRole('button', { name: 'Grant role' }));
      fireEvent.change(await screen.findByLabelText('Role'), { target: { value: 'BACENTA_LEADER' } });

      const groupPicker = await screen.findByLabelText('Bacenta or Basonta');
      expect(screen.getByRole('button', { name: 'Confirm grant' })).toBeDisabled();

      fireEvent.change(groupPicker, { target: { value: 'Grace' } });
      await waitFor(() => expect(screen.getByText('Grace Bacenta')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Grace Bacenta'));

      const submitButton = screen.getByRole('button', { name: 'Confirm grant' });
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);

      await waitFor(() => expect(screen.queryByTestId('role-grant-form')).not.toBeInTheDocument());
      const postCall = fetchMock.mock.calls.find(([url, init]) => (url as string).includes('/role-assignments') && (init as RequestInit)?.method === 'POST');
      expect(JSON.parse((postCall as [string, RequestInit])[1].body as string)).toEqual({ role: 'BACENTA_LEADER', groupId: 'bacenta-9', scopeGroupIds: [] });
    });

    it('shows the server-provided RBAC denial message inline and keeps the form open (e.g. ADMIN has no grant authority)', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/people/person-1/role-assignments') && init?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: async () => ({ message: "No Role Assignment grants 'people.role_assignment.grant' to role 'ADMIN'" }),
          });
        }
        if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();

      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
      switchToTab('Roles');

      fireEvent.click(await screen.findByRole('button', { name: 'Grant role' }));
      fireEvent.change(await screen.findByLabelText('Role'), { target: { value: 'WORKER' } });
      fireEvent.click(screen.getByRole('button', { name: 'Confirm grant' }));

      await waitFor(() => expect(screen.getByText("No Role Assignment grants 'people.role_assignment.grant' to role 'ADMIN'")).toBeInTheDocument());
      expect(screen.getByTestId('role-grant-form')).toBeInTheDocument();
    });

    it('shows the server-provided BR-PPL-04 eligibility conflict inline on a 409', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/people/person-1/role-assignments') && init?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 409,
            json: async () => ({ message: "BR-PPL-04/FR-PPL-06: 'WORKER' requires the Person's lifecycle_stage to be MEMBER (currently 'FOLLOW_UP')" }),
          });
        }
        if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person({ lifecycleStage: 'FOLLOW_UP' }) });
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();

      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
      switchToTab('Roles');

      fireEvent.click(await screen.findByRole('button', { name: 'Grant role' }));
      fireEvent.change(await screen.findByLabelText('Role'), { target: { value: 'WORKER' } });
      fireEvent.click(screen.getByRole('button', { name: 'Confirm grant' }));

      await waitFor(() => expect(screen.getByText(/requires the Person's lifecycle_stage to be MEMBER/)).toBeInTheDocument());
      expect(screen.getByTestId('role-grant-form')).toBeInTheDocument();
    });
  });

  /**
   * `[Role Assignment Revoke milestone]` On the Roles tab - every test
   * switches there first. No `state.actor` role check is asserted here -
   * `revokeRoleAssignment` has no client-side authorization gate of its
   * own (same reasoning as `grantRoleAssignment` and every other action
   * this session).
   */
  describe('role revoke', () => {
    it('offers Revoke on an active role but not on a past one', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      global.fetch = mockFetchByPath({
        '/people/person-1/group-memberships': [],
        '/people/person-1/role-assignments': [
          roleAssignment({ id: 'role-1', role: 'BACENTA_LEADER' }),
          roleAssignment({ id: 'role-2', role: 'WORKER', effectiveTo: new Date('2025-01-01').toISOString() }),
        ],
        '/people/person-1': person(),
      });

      renderPage();

      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
      switchToTab('Roles');

      await waitFor(() => expect(screen.getByTestId('role-assignment-history-card')).toHaveTextContent('BACENTA LEADER'));
      expect(screen.getByRole('button', { name: 'Revoke role: BACENTA_LEADER' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Revoke role: WORKER' })).not.toBeInTheDocument();
    });

    it('reveals a confirm step before submitting, and cancel sends no request', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      const fetchMock = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [roleAssignment()] });
        if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();

      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
      switchToTab('Roles');

      fireEvent.click(await screen.findByRole('button', { name: 'Revoke role: BACENTA_LEADER' }));
      await screen.findByTestId('role-revoke-confirm');
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByTestId('role-revoke-confirm')).not.toBeInTheDocument();
      expect(fetchMock.mock.calls.some(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toBe(false);
    });

    it('revokes the role on confirm, refetches history, and the row now shows as Past', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      let roleCallCount = 0;
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/role-assignments/role-1/revoke') && init?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => roleAssignment({ effectiveTo: new Date('2026-08-11').toISOString() }),
          });
        }
        if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1/role-assignments')) {
          roleCallCount += 1;
          return Promise.resolve({
            ok: true,
            json: async () => [roleAssignment(roleCallCount === 1 ? {} : { effectiveTo: new Date('2026-08-11').toISOString() })],
          });
        }
        if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();

      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
      switchToTab('Roles');

      fireEvent.click(await screen.findByRole('button', { name: 'Revoke role: BACENTA_LEADER' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Confirm revoke' }));

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/people/person-1/role-assignments/role-1/revoke'),
          expect.objectContaining({ method: 'POST', body: JSON.stringify({}) }),
        ),
      );
      await waitFor(() => expect(screen.queryByTestId('role-revoke-confirm')).not.toBeInTheDocument());
      await waitFor(() => expect(screen.getByText('Past')).toBeInTheDocument());
      // Historical record remains visible, not removed from the list.
      expect(screen.getByTestId('role-assignment-history-card')).toHaveTextContent('BACENTA LEADER');
      expect(screen.queryByRole('button', { name: 'Revoke role: BACENTA_LEADER' })).not.toBeInTheDocument();
    });

    it('shows the server-provided error inline and keeps the confirm step open on failure', async () => {
      mockUseAuth.mockReturnValue({
      state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
    });
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/revoke') && init?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: async () => ({ message: "No Role Assignment grants 'people.role_assignment.update' to role 'ADMIN'" }),
          });
        }
        if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [roleAssignment()] });
        if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();

      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
      switchToTab('Roles');

      fireEvent.click(await screen.findByRole('button', { name: 'Revoke role: BACENTA_LEADER' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Confirm revoke' }));

      await waitFor(() =>
        expect(screen.getByText("No Role Assignment grants 'people.role_assignment.update' to role 'ADMIN'")).toBeInTheDocument(),
      );
      expect(screen.getByTestId('role-revoke-confirm')).toBeInTheDocument();
    });
  });

  /**
   * `[Branch Pastor portal, Pastoral Care sprint]` The "People -> Member
   * -> Pastoral Care" direction (approved Pastoral Care brief §5) -
   * Branch-Pastor-only, per this page's own doc comment on why the tab is
   * conditionally included. Every other role's absence of this tab is
   * already locked in by the 24 tests above (all `ADMIN`), which keep
   * passing unchanged.
   */
  describe('Pastoral Care tab (Branch Pastor only)', () => {
    function followUpTask(overrides: Record<string, unknown> = {}) {
      return {
        id: 'ft-1',
        branchId: 'branch-1',
        groupId: null,
        personId: 'person-1',
        assignedToPersonId: 'assignee-1',
        status: 'OPEN',
        dueAt: new Date('2026-01-15').toISOString(),
        escalatedAt: null,
        escalatedToPersonId: null,
        createdByPersonId: 'ap-1',
        createdAt: new Date('2026-01-01').toISOString(),
        updatedAt: new Date('2026-01-01').toISOString(),
        ...overrides,
      };
    }

    it('shows a Pastoral Care tab only for ASSISTANT_PASTOR, not for other roles', async () => {
      mockUseAuth.mockReturnValue({
        state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' } },
      });
      global.fetch = mockFetchByPath({
        '/people/person-1/group-memberships': [],
        '/people/person-1/role-assignments': [],
        '/people/person-1/follow-up-tasks': [followUpTask()],
        '/people/assignee-1': person({ id: 'assignee-1', firstName: 'Kwame', lastName: 'Asante' }),
        '/people/person-1': person(),
      });

      renderPage();

      await waitFor(() => expect(screen.getByRole('tab', { name: 'Pastoral Care' })).toBeInTheDocument());
    });

    it('does not show a Pastoral Care tab for ADMIN or any other non-Branch-Pastor role', async () => {
      mockUseAuth.mockReturnValue({
        state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
      });
      global.fetch = mockFetchByPath({
        '/people/person-1/group-memberships': [],
        '/people/person-1/role-assignments': [],
        '/people/person-1': person(),
      });

      renderPage();

      await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
      expect(screen.queryByRole('tab', { name: 'Pastoral Care' })).not.toBeInTheDocument();
    });

    it('renders the Person\'s full Follow-up history (every status, not just open ones) on the Pastoral Care tab', async () => {
      mockUseAuth.mockReturnValue({
        state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' } },
      });
      const fetchMock = mockFetchByPath({
        '/people/person-1/group-memberships': [],
        '/people/person-1/role-assignments': [],
        '/people/person-1/follow-up-tasks': [followUpTask({ id: 'ft-1', status: 'COMPLETED' }), followUpTask({ id: 'ft-2', status: 'ESCALATED' })],
        '/people/assignee-1': person({ id: 'assignee-1', firstName: 'Kwame', lastName: 'Asante' }),
        '/people/person-1': person(),
      });
      global.fetch = fetchMock;

      renderPage();
      await waitFor(() => expect(screen.getByRole('tab', { name: 'Pastoral Care' })).toBeInTheDocument());
      switchToTab('Pastoral Care');

      await waitFor(() => expect(screen.getByTestId('person-follow-up-history-table')).toBeInTheDocument());
      const table = within(screen.getByTestId('person-follow-up-history-table'));
      await waitFor(() => expect(table.getAllByText('Kwame Asante')).toHaveLength(2));
      expect(table.getByText('Completed')).toBeInTheDocument();
      expect(table.getByText('Escalated')).toBeInTheDocument();

      // The full-history endpoint, not the queue's own open-only one.
      expect(fetchMock.mock.calls.some(([url]) => (url as string).includes('/people/person-1/follow-up-tasks'))).toBe(true);
    });

    it('shows an empty state when the Person has no Follow-ups yet', async () => {
      mockUseAuth.mockReturnValue({
        state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' } },
      });
      global.fetch = mockFetchByPath({
        '/people/person-1/group-memberships': [],
        '/people/person-1/role-assignments': [],
        '/people/person-1/follow-up-tasks': [],
        '/people/person-1': person(),
      });

      renderPage();
      await waitFor(() => expect(screen.getByRole('tab', { name: 'Pastoral Care' })).toBeInTheDocument());
      switchToTab('Pastoral Care');

      await waitFor(() => expect(screen.getByText('No Follow-ups yet')).toBeInTheDocument());
    });

    it('shows a retryable error state when the Follow-up history request fails', async () => {
      mockUseAuth.mockReturnValue({
        state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' } },
      });
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/people/person-1/follow-up-tasks')) return Promise.reject(new Error('network unavailable in test'));
        if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1/pastoral-notes')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1/prayer-notes')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1/counselling-sessions')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1/interactions')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });

      renderPage();
      await waitFor(() => expect(screen.getByRole('tab', { name: 'Pastoral Care' })).toBeInTheDocument());
      switchToTab('Pastoral Care');

      await waitFor(() => expect(screen.getByText("Couldn't load Follow-up history")).toBeInTheDocument());
    });

    /** `[Milestone D — Portal Experiences, Portal 3: Bacenta Leader]`
     * `BACENTA_LEADER` holds real `pastoral_care.followup_task.read`/
     * `pastoral_care.notes.read` grants at OWN_GROUP (traced against
     * `permission-matrix.ts`, not assumed) - the same tab Branch Pastor
     * already had, now also reachable for this role. */
    it('also shows the Pastoral Care tab for BACENTA_LEADER (Portal 3)', async () => {
      mockUseAuth.mockReturnValue({
        state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' } },
      });
      global.fetch = mockFetchByPath({
        '/people/person-1/group-memberships': [],
        '/people/person-1/role-assignments': [],
        '/people/person-1/follow-up-tasks': [],
        '/people/person-1/pastoral-notes': [],
        '/people/person-1': person(),
      });

      renderPage();

      await waitFor(() => expect(screen.getByRole('tab', { name: 'Pastoral Care' })).toBeInTheDocument());
    });

    describe('Pastoral Notes', () => {
      function pastoralNote(overrides: Record<string, unknown> = {}) {
        return {
          id: 'note-1',
          branchId: 'branch-1',
          personId: 'person-1',
          authorPersonId: 'ap-1',
          content: 'Checked in after service, doing well.',
          createdAt: new Date('2026-01-10').toISOString(),
          ...overrides,
        };
      }

      it('renders the real list of Notes on the Pastoral Care tab', async () => {
        mockUseAuth.mockReturnValue({
          state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' } },
        });
        global.fetch = mockFetchByPath({
          '/people/person-1/group-memberships': [],
          '/people/person-1/role-assignments': [],
          '/people/person-1/follow-up-tasks': [],
          '/people/person-1/pastoral-notes': [pastoralNote()],
          '/people/person-1': person(),
        });

        renderPage();
        await waitFor(() => expect(screen.getByRole('tab', { name: 'Pastoral Care' })).toBeInTheDocument());
        switchToTab('Pastoral Care');

        await waitFor(() => expect(screen.getByTestId('pastoral-notes-list')).toBeInTheDocument());
        expect(screen.getByText('Checked in after service, doing well.')).toBeInTheDocument();
      });

      it('shows an honest empty state, not a fabricated note, when the Person has no Notes yet', async () => {
        mockUseAuth.mockReturnValue({
          state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' } },
        });
        global.fetch = mockFetchByPath({
          '/people/person-1/group-memberships': [],
          '/people/person-1/role-assignments': [],
          '/people/person-1/follow-up-tasks': [],
          '/people/person-1/pastoral-notes': [],
          '/people/person-1': person(),
        });

        renderPage();
        await waitFor(() => expect(screen.getByRole('tab', { name: 'Pastoral Care' })).toBeInTheDocument());
        switchToTab('Pastoral Care');

        await waitFor(() => expect(screen.getByText('No notes yet.')).toBeInTheDocument());
        expect(screen.queryByTestId('pastoral-notes-list')).not.toBeInTheDocument();
      });

      it('creates a Note via the reveal form, then refetches and shows it in the list', async () => {
        mockUseAuth.mockReturnValue({
          state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' } },
        });
        let notes: unknown[] = [];
        const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
          if (url.includes('/people/person-1/pastoral-notes') && init?.method === 'POST') {
            const body = JSON.parse(init.body as string) as { content: string };
            notes = [pastoralNote({ id: 'note-2', content: body.content })];
            return Promise.resolve({ ok: true, json: async () => notes[0] });
          }
          if (url.endsWith('/people/person-1/pastoral-notes')) return Promise.resolve({ ok: true, json: async () => notes });
          if (url.endsWith('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.endsWith('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.endsWith('/people/person-1/follow-up-tasks')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.endsWith('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
          return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
        });
        global.fetch = fetchMock;

        renderPage();
        await waitFor(() => expect(screen.getByRole('tab', { name: 'Pastoral Care' })).toBeInTheDocument());
        switchToTab('Pastoral Care');
        await waitFor(() => expect(screen.getByText('No notes yet.')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Add a note for this Person' }));
        fireEvent.change(screen.getByLabelText('Note'), {
          target: { value: 'Called to check on the family.' },
        });
        fireEvent.click(screen.getByTestId('pastoral-note-submit'));

        await waitFor(() => expect(screen.getByText('Called to check on the family.')).toBeInTheDocument());
        expect(screen.queryByTestId('pastoral-note-form')).not.toBeInTheDocument();
      });

      it('shows the server-provided error inline and keeps the form open when creating a Note fails', async () => {
        mockUseAuth.mockReturnValue({
          state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' } },
        });
        global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
          if (url.includes('/people/person-1/pastoral-notes') && init?.method === 'POST') {
            return Promise.resolve({
              ok: false,
              status: 403,
              json: async () => ({ message: "No Role Assignment grants 'pastoral_care.notes.create' to role 'ASSISTANT_PASTOR'" }),
            });
          }
          if (url.endsWith('/people/person-1/pastoral-notes')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.endsWith('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.endsWith('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.endsWith('/people/person-1/follow-up-tasks')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.endsWith('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
          return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
        });

        renderPage();
        await waitFor(() => expect(screen.getByRole('tab', { name: 'Pastoral Care' })).toBeInTheDocument());
        switchToTab('Pastoral Care');
        await waitFor(() => expect(screen.getByText('No notes yet.')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Add a note for this Person' }));
        fireEvent.change(screen.getByLabelText('Note'), {
          target: { value: 'x' },
        });
        fireEvent.click(screen.getByTestId('pastoral-note-submit'));

        await waitFor(() => expect(screen.getByText(/pastoral_care.notes.create/)).toBeInTheDocument());
        expect(screen.getByTestId('pastoral-note-form')).toBeInTheDocument();
      });

      it('shows a retryable error state when the Notes request fails', async () => {
        mockUseAuth.mockReturnValue({
          state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' } },
        });
        global.fetch = jest.fn().mockImplementation((url: string) => {
          if (url.includes('/people/person-1/pastoral-notes')) return Promise.reject(new Error('network unavailable in test'));
          if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/follow-up-tasks')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/prayer-notes')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/counselling-sessions')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/interactions')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
          return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
        });

        renderPage();
        await waitFor(() => expect(screen.getByRole('tab', { name: 'Pastoral Care' })).toBeInTheDocument());
        switchToTab('Pastoral Care');

        await waitFor(() => expect(screen.getByText("Couldn't load Notes")).toBeInTheDocument());
      });
    });

    /** `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]`
     * Prayer Notes/Counselling/Interactions - the private pastoral domain.
     * Traced against `permission-matrix.ts`: only `RESIDENT_PASTOR`/
     * `ACTING_RESIDENT_PASTOR` (BRANCH) and `ASSISTANT_PASTOR` (CLUSTER)
     * hold `pastoral_care.prayer_note.*`/`.counselling.*`/`.interaction.*`
     * at any scope. The Milestone D brief's own rule 4 is explicit:
     * "No... Bacenta Leader, Basonta Leader... may see Prayer Note
     * content" - the negative test below is the single highest-priority
     * assertion in this whole file for that reason. */
    describe('Private pastoral tools (Resident Pastor / Assistant Pastor only)', () => {
      function prayerNote(overrides: Record<string, unknown> = {}) {
        return {
          id: 'pn-1',
          branchId: 'branch-1',
          personId: 'person-1',
          authorPersonId: 'rp-1',
          content: 'Praying for healing and strength.',
          followUpDate: null,
          status: 'OPEN',
          createdAt: new Date('2026-08-01').toISOString(),
          ...overrides,
        };
      }

      function counsellingSession(overrides: Record<string, unknown> = {}) {
        return {
          id: 'cs-1',
          branchId: 'branch-1',
          personId: 'person-1',
          counsellorPersonId: 'rp-1',
          scheduledAt: new Date('2026-09-01T10:00:00.000Z').toISOString(),
          status: 'SCHEDULED',
          briefNote: 'Pre-marital counselling',
          createdAt: new Date('2026-08-01').toISOString(),
          updatedAt: new Date('2026-08-01').toISOString(),
          ...overrides,
        };
      }

      function memberInteraction(overrides: Record<string, unknown> = {}) {
        return {
          id: 'mi-1',
          branchId: 'branch-1',
          personId: 'person-1',
          pastorPersonId: 'rp-1',
          type: 'VISIT',
          occurredAt: new Date('2026-08-10').toISOString(),
          scheduledAt: null,
          briefNote: 'Home visit',
          createdAt: new Date('2026-08-10').toISOString(),
          ...overrides,
        };
      }

      function residentPastorActor() {
        return { status: 'authenticated', accessToken: 'token', actor: { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' } };
      }

      it('shows real Prayer Notes/Counselling/Interactions for RESIDENT_PASTOR, including a Pastoral Care tab that role previously never had', async () => {
        mockUseAuth.mockReturnValue({ state: residentPastorActor() });
        global.fetch = mockFetchByPath({
          '/people/person-1/group-memberships': [],
          '/people/person-1/role-assignments': [],
          '/people/person-1/follow-up-tasks': [],
          '/people/person-1/pastoral-notes': [],
          '/people/person-1/prayer-notes': [prayerNote()],
          '/people/person-1/counselling-sessions': [counsellingSession()],
          '/people/person-1/interactions': [memberInteraction()],
          '/people/person-1': person(),
        });

        renderPage();
        await waitFor(() => expect(screen.getByRole('tab', { name: 'Pastoral Care' })).toBeInTheDocument());
        switchToTab('Pastoral Care');

        await waitFor(() => expect(screen.getByTestId('prayer-notes-list')).toBeInTheDocument());
        expect(screen.getByText('Praying for healing and strength.')).toBeInTheDocument();
        expect(screen.getByTestId('counselling-sessions-list')).toBeInTheDocument();
        expect(screen.getByText('Pre-marital counselling', { exact: false })).toBeInTheDocument();
        expect(screen.getByTestId('interactions-list')).toBeInTheDocument();
        expect(screen.getByText('Home visit')).toBeInTheDocument();
      });

      /** The privacy-critical negative test: rule 4 of the Milestone D
       * brief, verified directly against the rendered UI, not just RBAC
       * config. `BACENTA_LEADER` already sees Follow-ups/Notes on this
       * same tab (Portal 3) - this asserts the three private sections
       * specifically never render for that role, even if the backend
       * were somehow misconfigured to return data for them. */
      it('never shows Prayer Notes, Counselling, or Interactions for BACENTA_LEADER', async () => {
        mockUseAuth.mockReturnValue({
          state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' } },
        });
        global.fetch = mockFetchByPath({
          '/people/person-1/group-memberships': [],
          '/people/person-1/role-assignments': [],
          '/people/person-1/follow-up-tasks': [],
          '/people/person-1/pastoral-notes': [],
          '/people/person-1/prayer-notes': [prayerNote()],
          '/people/person-1/counselling-sessions': [counsellingSession()],
          '/people/person-1/interactions': [memberInteraction()],
          '/people/person-1': person(),
        });

        renderPage();
        await waitFor(() => expect(screen.getByRole('tab', { name: 'Pastoral Care' })).toBeInTheDocument());
        switchToTab('Pastoral Care');

        await waitFor(() => expect(screen.getByText('No notes yet.')).toBeInTheDocument());
        expect(screen.queryByTestId('person-prayer-notes-card')).not.toBeInTheDocument();
        expect(screen.queryByTestId('person-counselling-card')).not.toBeInTheDocument();
        expect(screen.queryByTestId('person-interactions-card')).not.toBeInTheDocument();
        expect(screen.queryByText('Praying for healing and strength.')).not.toBeInTheDocument();
        // The hooks themselves must never even be called for this role -
        // not merely hidden by CSS (Milestone D rule 2).
        expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/prayer-notes'), expect.anything());
      });

      it('creates a Prayer Note via the reveal form, then refetches and shows it', async () => {
        mockUseAuth.mockReturnValue({ state: residentPastorActor() });
        let notes: unknown[] = [];
        const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
          if (url.includes('/people/person-1/prayer-notes') && init?.method === 'POST') {
            const body = JSON.parse(init.body as string) as Record<string, unknown>;
            notes = [prayerNote({ content: body.content })];
            return Promise.resolve({ ok: true, json: async () => notes[0] });
          }
          if (url.includes('/people/person-1/prayer-notes')) return Promise.resolve({ ok: true, json: async () => notes });
          if (url.includes('/people/person-1/counselling-sessions')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/interactions')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/pastoral-notes')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/follow-up-tasks')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
          return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
        });
        global.fetch = fetchMock;

        renderPage();
        await waitFor(() => expect(screen.getByRole('tab', { name: 'Pastoral Care' })).toBeInTheDocument());
        switchToTab('Pastoral Care');
        await waitFor(() => expect(screen.getByText('No Prayer notes yet.')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Add a Prayer note for this Person' }));
        fireEvent.change(screen.getByLabelText('Prayer note'), { target: { value: 'Praying for a swift recovery.' } });
        fireEvent.click(screen.getByTestId('prayer-note-submit'));

        await waitFor(() => expect(screen.getByText('Praying for a swift recovery.')).toBeInTheDocument());
        expect(screen.queryByTestId('prayer-note-form')).not.toBeInTheDocument();
      });

      it('marks a Prayer Note resolved and refetches', async () => {
        mockUseAuth.mockReturnValue({ state: residentPastorActor() });
        let status = 'OPEN';
        const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
          if (url.includes('/prayer-notes/pn-1/status') && init?.method === 'PATCH') {
            status = 'RESOLVED';
            return Promise.resolve({ ok: true, json: async () => prayerNote({ status }) });
          }
          if (url.includes('/people/person-1/prayer-notes')) return Promise.resolve({ ok: true, json: async () => [prayerNote({ status })] });
          if (url.includes('/people/person-1/counselling-sessions')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/interactions')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/pastoral-notes')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/follow-up-tasks')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
          return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
        });
        global.fetch = fetchMock;

        renderPage();
        await waitFor(() => expect(screen.getByRole('tab', { name: 'Pastoral Care' })).toBeInTheDocument());
        switchToTab('Pastoral Care');
        await waitFor(() => expect(screen.getByRole('button', { name: 'Mark resolved' })).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Mark resolved' }));

        await waitFor(() => expect(screen.getByText('Resolved')).toBeInTheDocument());
        expect(fetchMock.mock.calls.some(([url, init]) => (url as string).includes('/prayer-notes/pn-1/status') && (init as RequestInit | undefined)?.method === 'PATCH')).toBe(true);
      });

      it('schedules a Counselling session via the reveal form, then refetches and shows it', async () => {
        mockUseAuth.mockReturnValue({ state: residentPastorActor() });
        let sessions: unknown[] = [];
        const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
          if (url.includes('/people/person-1/counselling-sessions') && init?.method === 'POST') {
            const body = JSON.parse(init.body as string) as Record<string, unknown>;
            sessions = [counsellingSession({ id: 'cs-new', briefNote: body.briefNote })];
            return Promise.resolve({ ok: true, json: async () => sessions[0] });
          }
          if (url.includes('/people/person-1/counselling-sessions')) return Promise.resolve({ ok: true, json: async () => sessions });
          if (url.includes('/people/person-1/prayer-notes')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/interactions')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/pastoral-notes')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/follow-up-tasks')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
          return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
        });
        global.fetch = fetchMock;

        renderPage();
        await waitFor(() => expect(screen.getByRole('tab', { name: 'Pastoral Care' })).toBeInTheDocument());
        switchToTab('Pastoral Care');
        await waitFor(() => expect(screen.getByText('No Counselling sessions yet.')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Schedule a Counselling session for this Person' }));
        fireEvent.change(screen.getByTestId('counselling-scheduled-at'), { target: { value: '2026-09-01T10:00' } });
        fireEvent.change(screen.getByLabelText('Brief note (optional)'), { target: { value: 'Marriage counselling' } });
        fireEvent.click(screen.getByTestId('counselling-submit'));

        await waitFor(() => expect(screen.getByText('Marriage counselling', { exact: false })).toBeInTheDocument());
        expect(screen.queryByTestId('counselling-form')).not.toBeInTheDocument();
      });

      it('logs a Member Interaction via the reveal form, then refetches and shows it', async () => {
        mockUseAuth.mockReturnValue({ state: residentPastorActor() });
        let interactions: unknown[] = [];
        const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
          if (url.includes('/people/person-1/interactions') && init?.method === 'POST') {
            const body = JSON.parse(init.body as string) as Record<string, unknown>;
            interactions = [memberInteraction({ id: 'mi-new', type: body.type, briefNote: body.briefNote })];
            return Promise.resolve({ ok: true, json: async () => interactions[0] });
          }
          if (url.includes('/people/person-1/interactions')) return Promise.resolve({ ok: true, json: async () => interactions });
          if (url.includes('/people/person-1/prayer-notes')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/counselling-sessions')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/pastoral-notes')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/follow-up-tasks')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/group-memberships')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1/role-assignments')) return Promise.resolve({ ok: true, json: async () => [] });
          if (url.includes('/people/person-1')) return Promise.resolve({ ok: true, json: async () => person() });
          return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
        });
        global.fetch = fetchMock;

        renderPage();
        await waitFor(() => expect(screen.getByRole('tab', { name: 'Pastoral Care' })).toBeInTheDocument());
        switchToTab('Pastoral Care');
        await waitFor(() => expect(screen.getByText('No Interactions logged yet.')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Log an Interaction for this Person' }));
        fireEvent.change(screen.getByTestId('interaction-type'), { target: { value: 'CALL' } });
        fireEvent.change(screen.getByTestId('interaction-occurred-at'), { target: { value: '2026-08-15T09:00' } });
        fireEvent.change(screen.getByLabelText('Brief note (optional)'), { target: { value: 'Checked in by phone' } });
        fireEvent.click(screen.getByTestId('interaction-submit'));

        await waitFor(() => expect(screen.getByText('Checked in by phone')).toBeInTheDocument());
        expect(screen.queryByTestId('interaction-form')).not.toBeInTheDocument();
      });
    });
  });
});
