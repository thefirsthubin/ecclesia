import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { RouterProvider } from '../../router/router';
import { __resetPeopleListPagePersistedStateForTests, PeopleListPage } from './PeopleListPage';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actorWithRole(role: string, extra: Record<string, unknown> = {}) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'person-1', role, branchId: 'branch-1', ...extra },
    },
  };
}

function person(overrides: Record<string, unknown> = {}) {
  return {
    id: 'person-1',
    branchId: 'branch-1',
    firstName: 'Ama',
    lastName: 'Owusu',
    phone: null,
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

function renderPage() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider>
          <PeopleListPage />
        </RouterProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => __resetPeopleListPagePersistedStateForTests());
afterEach(() => jest.clearAllMocks());

describe('PeopleListPage', () => {
  it('renders the role-scoped list returned by GET /people', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [person()] });

    renderPage();

    await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeInTheDocument());
    expect(within(screen.getByTestId('people-list-table')).getByText('Member')).toBeInTheDocument();
  });

  /** `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 3 People workflow UI) - a pure client-side filter over the
   * already-fetched, already-scoped result set (`ListPeopleQuery` has no
   * `lifecycleStage` field), not a new backend query. */
  it('filters the list by lifecycle stage via the filter chips, entirely client-side', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [person({ id: 'p1', firstName: 'Ama', lastName: 'Owusu', lifecycleStage: 'MEMBER' }), person({ id: 'p2', firstName: 'Kofi', lastName: 'Mensah', lifecycleStage: 'VISITOR' })],
    });

    renderPage();
    await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeInTheDocument());
    expect(screen.getByText('Kofi Mensah')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Visitor' }));

    expect(screen.getByText('Kofi Mensah')).toBeInTheDocument();
    expect(screen.queryByText('Ama Owusu')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByText('Ama Owusu')).toBeInTheDocument();
  });

  it('sends the Bacenta Leader own-group scope as a groupId query param', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('groupId=bacenta-1');
  });

  /** `[Branch Pastor portal]` `ASSISTANT_PASTOR`'s real CLUSTER grant spans
   * every Bacenta in `clusterBacentaIds`, not just the first one
   * `resolveDefaultPeopleQuery` defaults to - `usePeopleListForGroups`
   * fetches once per Bacenta in the cluster and merges the results,
   * deduplicated by person id. Two Bacentas here, one person (`p2`)
   * returned by both (e.g. a dual Group membership) - asserts the
   * rendered table shows the full three-person union, not three plus a
   * duplicate row, and that a request went out per Bacenta in the
   * cluster. */
  it('merges People across every Bacenta in an ASSISTANT_PASTOR\'s cluster, deduplicated by id', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1', 'bacenta-2'] }));
    const fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url.includes('groupId=bacenta-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            person({ id: 'p1', firstName: 'Ama', lastName: 'Owusu' }),
            person({ id: 'p2', firstName: 'Kofi', lastName: 'Mensah' }),
          ],
        });
      }
      if (url.includes('groupId=bacenta-2')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            person({ id: 'p2', firstName: 'Kofi', lastName: 'Mensah' }),
            person({ id: 'p3', firstName: 'Zainab', lastName: 'Alhassan' }),
          ],
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeInTheDocument());
    expect(screen.getByText('Kofi Mensah')).toBeInTheDocument();
    expect(screen.getByText('Zainab Alhassan')).toBeInTheDocument();

    const table = within(screen.getByTestId('people-list-table'));
    expect(table.getAllByText('Kofi Mensah')).toHaveLength(1);
    expect(table.getAllByRole('row')).toHaveLength(4); // header + 3 distinct people

    const urls = fetchMock.mock.calls.map((call) => call[0] as string);
    expect(urls.some((url) => url.includes('groupId=bacenta-1'))).toBe(true);
    expect(urls.some((url) => url.includes('groupId=bacenta-2'))).toBe(true);
  });

  it('sends the trimmed search box value as a search query param, debounced', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    renderPage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText('Search by name'), { target: { value: '  Ama  ' } });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2), { timeout: 2000 });
    const [url] = fetchMock.mock.calls[1] as [string];
    expect(url).toContain(`search=${encodeURIComponent('Ama')}`);
  });

  /** `[Product Experience Sprint II, Phase 5]` The real bug this sprint
   * found and fixed: search previously re-fetched on *every* keystroke
   * (a plain `Input`, no debounce) - now the dedicated `Search`
   * component's built-in 300ms debounce means several fast keystrokes
   * collapse into one real request, not one per character. */
  it('collapses several fast keystrokes into a single debounced request, not one per keystroke', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    renderPage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const field = screen.getByLabelText('Search by name');
    fireEvent.change(field, { target: { value: 'A' } });
    fireEvent.change(field, { target: { value: 'Am' } });
    fireEvent.change(field, { target: { value: 'Ama' } });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2), { timeout: 2000 });
    const [url] = fetchMock.mock.calls[1] as [string];
    expect(url).toContain(`search=${encodeURIComponent('Ama')}`);
  });

  /** `[Product Experience Sprint II, Phase 5]` The concrete workflow
   * this sprint's own brief names: search -> open a record -> return ->
   * shouldn't have to search again. Module-level state (not component
   * state) is what survives the remount a real "return to People"
   * navigation causes - simulated here by unmounting and re-rendering,
   * the same lifecycle change a route change causes. */
  it('preserves the search text across an unmount/remount (the "open record, go back" workflow)', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    const first = renderPage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText('Search by name'), { target: { value: 'Ama' } });
    // Waits for the *debounced* `onSearch` to actually fire (a second real
    // fetch) - persistence only happens inside that callback, not on every
    // keystroke, so unmounting before it fires would (correctly) lose the
    // still-in-flight, not-yet-committed text, same as a real debounce.
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2), { timeout: 2000 });
    first.unmount();

    renderPage();
    expect(screen.getByLabelText('Search by name')).toHaveValue('Ama');
  });

  it('shows an empty state when no one matches the current scope', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No people found')).toBeInTheDocument());
  });

  /** `[Product Experience Sprint II, Phase 5]` The empty-state
   * description previously only ever named one active filter - fixed to
   * name both when both a search term and a stage filter are applied at
   * once, so the user is never left wondering which of the two is
   * responsible for zero results. */
  it('names both the search term and the stage filter in the empty state when both are active', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [person({ id: 'p1', firstName: 'Ama', lastName: 'Owusu', lifecycleStage: 'MEMBER' })],
    });

    renderPage();
    await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Visitor' }));
    fireEvent.change(screen.getByLabelText('Search by name'), { target: { value: 'Ama' } });

    await waitFor(() => expect(screen.getByText(`No one matches "Ama" who is currently Visitor.`)).toBeInTheDocument(), { timeout: 2000 });
  });

  /** `[Product Experience Sprint II, Phase 5]` `person.phone` was already
   * being fetched for every row and simply never rendered. */
  it('shows a Contact column using the already-fetched phone, honest about a missing one', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        person({ id: 'p1', firstName: 'Ama', lastName: 'Owusu', phone: '+233201234567' }),
        person({ id: 'p2', firstName: 'Kofi', lastName: 'Mensah', phone: null }),
      ],
    });

    renderPage();

    await waitFor(() => expect(screen.getByText('+233201234567')).toBeInTheDocument());
    const table = within(screen.getByTestId('people-list-table'));
    expect(table.getByText('Kofi Mensah')).toBeInTheDocument();
    expect(table.getAllByText('—').length).toBeGreaterThan(0);
  });

  /** `[Product Experience Sprint II, Phase 5]` Client-side sort, the same
   * kind of "find a person quickly" improvement already proven on
   * `BacentaPerformanceTable` - defaults to Name ascending. */
  it('sorts by Name, and reverses on a second click of the same header', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        person({ id: 'p1', firstName: 'Zainab', lastName: 'Alhassan' }),
        person({ id: 'p2', firstName: 'Ama', lastName: 'Owusu' }),
      ],
    });

    renderPage();
    await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeInTheDocument());

    const table = within(screen.getByTestId('people-list-table'));
    let rows = table.getAllByRole('row');
    expect(within(rows[1]).getByText('Ama Owusu')).toBeInTheDocument();

    fireEvent.click(table.getByRole('button', { name: 'Name' }));
    rows = table.getAllByRole('row');
    expect(within(rows[1]).getByText('Zainab Alhassan')).toBeInTheDocument();
  });

  it('shows a retryable error state when the request fails', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load People")).toBeInTheDocument());
  });

  it('shows "+ New Person" for ADMIN (the only role permission-matrix grants people.person.create to)', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('new-person-open')).toBeInTheDocument());
  });

  it('hides "+ New Person" for a role that can never call POST /people (e.g. BACENTA_LEADER)', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No people found')).toBeInTheDocument());
    expect(screen.queryByTestId('new-person-open')).not.toBeInTheDocument();
  });

  it('reveals the New Person form and hides the open button when clicked', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();
    await waitFor(() => expect(screen.getByTestId('new-person-open')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('new-person-open'));

    expect(screen.getByTestId('new-person-form')).toBeInTheDocument();
    expect(screen.queryByTestId('new-person-open')).not.toBeInTheDocument();
  });
});
