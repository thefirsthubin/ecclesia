import { render, screen, waitFor, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { GatheringsListPage } from './GatheringsListPage';

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

function gathering(overrides: Record<string, unknown> = {}) {
  return {
    id: 'g-1',
    branchId: 'branch-1',
    ownerGroupId: null,
    seriesId: null,
    type: 'SUNDAY_SERVICE',
    scheduledStart: new Date('2020-01-01T09:00:00.000Z').toISOString(),
    scheduledEnd: new Date('2020-01-01T11:00:00.000Z').toISOString(),
    venue: 'Main Auditorium',
    status: 'COMPLETED',
    config: null,
    createdByPersonId: 'admin-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <ThemeProvider>
      <GatheringsListPage />
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('GatheringsListPage', () => {
  /** `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 6 Gatherings workflow UI) - the default `gathering()` fixture
   * is dated in 2020 (past), so it now renders in the Past Gatherings
   * table, whose explicit column set (date/type/group/attendance/status)
   * deliberately omits Venue - the phase brief's own priority list for
   * historical rows. Status now shows the friendly label ("Completed"),
   * the same `STATUS_LABEL` map the Edit form's own Status picker
   * already used, not the raw wire value. */
  it('renders the role-scoped list with type, status, and a completeness badge for a past Gathering', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/attendance-records/completeness')) {
        return Promise.resolve({ ok: true, json: async () => ({ incomplete: false, reason: 'already recorded' }) });
      }
      if (url.includes('/gatherings')) {
        return Promise.resolve({ ok: true, json: async () => [gathering()] });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('past-gatherings-card')).toBeInTheDocument());
    expect(screen.getByText('SUNDAY_SERVICE')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Attendance recorded')).toBeInTheDocument());
  });

  /** `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 6 Gatherings workflow UI) - the Upcoming table's own explicit
   * column set (date/time, venue, owner group, status, action) - venue
   * and "Branch-wide" (the real absence-of-`ownerGroupId` case) are both
   * columns here even though neither is on the Historical table. */
  it('shows Venue and "Branch-wide" as their own columns for an upcoming Gathering', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [gathering({ id: 'g-2', scheduledStart: future, scheduledEnd: null, status: 'SCHEDULED', ownerGroupId: null, venue: 'Main Auditorium' })],
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('gatherings-list-card')).toBeInTheDocument());
    expect(screen.getByText('Main Auditorium')).toBeInTheDocument();
    expect(screen.getByText('Branch-wide')).toBeInTheDocument();
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });

  /** `[Milestone D — Portal Experiences, Portal 2: Branch Administrator]`
   * "Gathering cards should expose... preacher, message." Both real
   * `GatheringResponseDto` fields (`preacherPersonId`/`message`).
   * Preacher is a column on both tables; Message is Historical-only
   * (the same "different priority columns per table" precedent Venue/
   * Attendance already establish) - Preacher resolves via the same real
   * `GET /people/:id` lookup `PersonNameText` already established
   * elsewhere in this app. */
  it('shows the real Preacher name on an upcoming Gathering that has one', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/people/preacher-1')) {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'preacher-1', firstName: 'Kofi', lastName: 'Owusu' }) });
      }
      if (url.includes('/gatherings')) {
        return Promise.resolve({
          ok: true,
          json: async () => [gathering({ id: 'g-3', scheduledStart: future, scheduledEnd: null, status: 'SCHEDULED', preacherPersonId: 'preacher-1' })],
        });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('gatherings-list-card')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Kofi Owusu')).toBeInTheDocument());
  });

  it('shows the real Preacher name and Message on a past Gathering that has both', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/attendance-records/completeness')) {
        return Promise.resolve({ ok: true, json: async () => ({ incomplete: false, reason: 'already recorded' }) });
      }
      if (url.includes('/people/preacher-1')) {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'preacher-1', firstName: 'Kofi', lastName: 'Owusu' }) });
      }
      if (url.includes('/gatherings')) {
        return Promise.resolve({ ok: true, json: async () => [gathering({ preacherPersonId: 'preacher-1', message: 'Walking in Faith' })] });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('past-gatherings-card')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Kofi Owusu')).toBeInTheDocument());
    expect(screen.getByText('Walking in Faith')).toBeInTheDocument();
  });

  it('shows an em-dash, never a fabricated name, when a past Gathering has no Preacher or Message recorded', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/attendance-records/completeness')) {
        return Promise.resolve({ ok: true, json: async () => ({ incomplete: false, reason: 'already recorded' }) });
      }
      if (url.includes('/gatherings')) {
        return Promise.resolve({ ok: true, json: async () => [gathering({ preacherPersonId: null, message: null })] });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('past-gatherings-card')).toBeInTheDocument());
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('does not show a completeness badge for an upcoming Gathering', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [gathering({ id: 'g-2', scheduledStart: future, scheduledEnd: null, status: 'SCHEDULED' })],
    });

    renderPage();

    await waitFor(() => expect(screen.getByText('SUNDAY_SERVICE')).toBeInTheDocument());
    expect(screen.queryByText(/Attendance/)).not.toBeInTheDocument();
  });

  it('sends the Bacenta Leader own-group scope as an ownerGroupId query param', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('ownerGroupId=bacenta-1');
  });

  /** `[Bug fix, Basonta Leader Gatherings Access]` `BASONTA_LEADER`
   * already held a real `gatherings.gathering.read` OWN_GROUP grant, but
   * previously always sent `{}` (no `ownerGroupId`), which the backend
   * correctly 403'd since a Branch-shaped resource has no `basontaId` to
   * match against. Now sends its own Basonta, the same shape
   * `resolveDefaultPeopleQuery` already established for this role. */
  it('sends the Basonta Leader own-group scope as an ownerGroupId query param', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BASONTA_LEADER', { basontaId: 'basonta-1' }));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('ownerGroupId=basonta-1');
  });

  /** `[Branch Pastor portal]` `ASSISTANT_PASTOR` ("Branch Pastor" in Web
   * Admin's `BranchPastorDashboard`) previously sent its first cluster
   * Bacenta as `ownerGroupId`, narrowing the whole page to one Bacenta's
   * meetings - stale even at the time, since `gatherings.gathering.read`
   * had already been widened to BRANCH scope in the Branch Pastor
   * Dashboard sprint. Now sends an unfiltered query, exactly like
   * RESIDENT_PASTOR/ADMIN, and correctly renders every Gathering the
   * (real, Branch-scoped) backend grant returns - including one owned by
   * a Bacenta this actor's `clusterBacentaIds` doesn't even list, proving
   * this is genuinely Branch-wide, not merely "every cluster Bacenta". */
  it('[Branch Pastor portal] sends an unfiltered (Branch-wide) query for Assistant Pastor and renders whatever the backend returns', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-9', 'bacenta-10'] }));
    const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        gathering({ id: 'g-branch-wide-1', ownerGroupId: null, type: 'SUNDAY_SERVICE', scheduledStart: future, scheduledEnd: null, status: 'SCHEDULED' }),
      ],
    });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).not.toContain('ownerGroupId');
    await waitFor(() => expect(screen.getByTestId('gatherings-list-card')).toBeInTheDocument());
    expect(screen.getByText('SUNDAY_SERVICE')).toBeInTheDocument();
  });

  it('leaves an Assistant Pastor with no clusterBacentaIds sending the same unfiltered query - clusterBacentaIds is irrelevant to this action now', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: undefined }));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).not.toContain('ownerGroupId');
  });

  it('sends the trimmed type filter as a query param', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    renderPage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText('Filter by type'), { target: { value: '  SUNDAY_SERVICE  ' } });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [url] = fetchMock.mock.calls[1] as [string];
    expect(url).toContain(`type=${encodeURIComponent('SUNDAY_SERVICE')}`);
  });

  it('shows an empty state when no Gatherings are in scope', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No upcoming Gatherings')).toBeInTheDocument());
  });

  it('shows a retryable error state when the request fails', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load Gatherings")).toBeInTheDocument());
  });

  /** `[Bug fix, Branch Pastor Gatherings Access]` The list/empty/error
   * rendering branches are role-agnostic (only the outgoing query
   * differs, covered above) - these three confirm an Assistant Pastor
   * specifically goes through the same loading/empty/error states every
   * other role already had covered, rather than assuming that generic
   * coverage transfers. */
  it('shows the loading state for an Assistant Pastor before the response resolves', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-9'] }));
    global.fetch = jest.fn().mockReturnValue(new Promise(() => undefined));

    renderPage();

    expect(screen.queryByTestId('gatherings-list-card')).not.toBeInTheDocument();
    expect(screen.queryByText("Couldn't load Gatherings")).not.toBeInTheDocument();
  });

  it('shows an empty state for an Assistant Pastor when their cluster Bacenta has no Gatherings', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-9'] }));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No upcoming Gatherings')).toBeInTheDocument());
  });

  it('shows a retryable error state for an Assistant Pastor when the request fails', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-9'] }));
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load Gatherings")).toBeInTheDocument());
  });

  /**
   * `[Gathering Create/Update milestone]` No `state.actor` role check is
   * asserted here - `createGathering` has no client-side authorization
   * gate of its own (same reasoning as every other action this session),
   * so these tests exercise the real request/refetch wiring, not a role
   * gate.
   */
  describe('Create Gathering', () => {
    it('POSTs the entered fields, then refetches and shows the newly created Gathering on a fresh read', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
      let listCallCount = 0;
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/attendance-records/completeness')) {
          return Promise.resolve({ ok: true, json: async () => ({ incomplete: false, reason: 'not yet past' }) });
        }
        if (url.endsWith('/gatherings') && init?.method === 'POST') {
          return Promise.resolve({ ok: true, json: async () => gathering({ id: 'g-new', type: 'PRAYER_MEETING' }) });
        }
        if (url.includes('/gatherings')) {
          listCallCount += 1;
          return Promise.resolve({
            ok: true,
            json: async () => (listCallCount === 1 ? [] : [gathering({ id: 'g-new', type: 'PRAYER_MEETING' })]),
          });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();
      await waitFor(() => expect(screen.getByText('No upcoming Gatherings')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Create Gathering' }));

      const confirmButton = screen.getByRole('button', { name: 'Confirm create' });
      expect(confirmButton).toBeDisabled();

      fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'PRAYER_MEETING' } });
      fireEvent.change(screen.getByLabelText('Scheduled start'), { target: { value: '2026-01-04T09:00' } });
      fireEvent.change(screen.getByLabelText('Venue (optional)'), { target: { value: 'Main Auditorium' } });

      expect(confirmButton).toBeEnabled();
      fireEvent.click(confirmButton);

      await waitForElementToBeRemoved(() => screen.queryByTestId('gathering-create-form'));

      const postCall = fetchMock.mock.calls.find(([url, init]) => (url as string).endsWith('/gatherings') && (init as RequestInit)?.method === 'POST');
      expect(postCall).toBeDefined();
      expect(JSON.parse((postCall as [string, RequestInit])[1].body as string)).toEqual({
        type: 'PRAYER_MEETING',
        ownerGroupId: undefined,
        scheduledStart: new Date('2026-01-04T09:00').toISOString(),
        scheduledEnd: undefined,
        venue: 'Main Auditorium',
      });

      await waitFor(() => expect(screen.getByText('PRAYER_MEETING')).toBeInTheDocument());
    });

    it('shows the server-provided denial reason inline and keeps the form open on a 403', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.endsWith('/gatherings') && init?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: async () => ({ message: "No Role Assignment grants 'gatherings.gathering.create' to role 'RESIDENT_PASTOR'" }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });
      global.fetch = fetchMock;

      renderPage();
      await waitFor(() => expect(screen.getByText('No upcoming Gatherings')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Create Gathering' }));
      fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'PRAYER_MEETING' } });
      fireEvent.change(screen.getByLabelText('Scheduled start'), { target: { value: '2026-01-04T09:00' } });
      fireEvent.click(screen.getByRole('button', { name: 'Confirm create' }));

      await waitFor(() =>
        expect(screen.getByText("No Role Assignment grants 'gatherings.gathering.create' to role 'RESIDENT_PASTOR'")).toBeInTheDocument(),
      );
      expect(screen.getByTestId('gathering-create-form')).toBeInTheDocument();
    });

    it('cancels the form without sending a request', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

      renderPage();
      await waitFor(() => expect(screen.getByText('No upcoming Gatherings')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Create Gathering' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByTestId('gathering-create-form')).not.toBeInTheDocument();
    });
  });

  /**
   * `[Gathering Create/Update milestone]` "open it, edit it, save it" -
   * inline per-row, pre-filled from the real `GatheringResponseDto` already
   * in hand.
   */
  describe('Edit Gathering', () => {
    it('pre-fills the edit form from the existing Gathering, PATCHes the edits, then refetches and shows the updated values on a fresh read', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
      const original = gathering({ status: 'SCHEDULED' });
      const updated = gathering({ venue: 'Fellowship Hall', status: 'CANCELLED' });
      let listCallCount = 0;
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/attendance-records/completeness')) {
          return Promise.resolve({ ok: true, json: async () => ({ incomplete: false, reason: 'already recorded' }) });
        }
        if (url.includes('/gatherings/g-1') && init?.method === 'PATCH') {
          return Promise.resolve({ ok: true, json: async () => updated });
        }
        if (url.includes('/gatherings')) {
          listCallCount += 1;
          return Promise.resolve({ ok: true, json: async () => [listCallCount === 1 ? original : updated] });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();
      // `[UX Design Implementation]` Final UX Design Specification §19
      // (Phase 6 Gatherings workflow UI) - `original`'s 2020 dates put it
      // in the Past Gatherings table, whose columns don't include Venue
      // - the edit form itself (opened below) still pre-fills Venue from
      // the real `GatheringResponseDto` regardless of what's shown in
      // the table.
      await waitFor(() => expect(screen.getByText('SUNDAY_SERVICE')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Edit Gathering: SUNDAY_SERVICE' }));

      const venueInput = await screen.findByDisplayValue('Main Auditorium');
      fireEvent.change(venueInput, { target: { value: 'Fellowship Hall' } });
      fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'CANCELLED' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitForElementToBeRemoved(() => screen.queryByTestId('gathering-edit-form'));

      const patchCall = fetchMock.mock.calls.find(([url, init]) => (url as string).includes('/gatherings/g-1') && (init as RequestInit)?.method === 'PATCH');
      expect(patchCall).toBeDefined();
      expect(JSON.parse((patchCall as [string, RequestInit])[1].body as string)).toMatchObject({ venue: 'Fellowship Hall', status: 'CANCELLED' });

      // Venue isn't a Past Gatherings column (asserted via the real PATCH
      // body above instead); Status is, and now shows the friendly label.
      await waitFor(() => expect(screen.getByText('Cancelled')).toBeInTheDocument());
    });

    it('shows the server-provided conflict reason inline and keeps the form open on an invalid status transition', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/attendance-records/completeness')) {
          return Promise.resolve({ ok: true, json: async () => ({ incomplete: false, reason: 'already recorded' }) });
        }
        if (url.includes('/gatherings/g-1') && init?.method === 'PATCH') {
          return Promise.resolve({ ok: false, status: 409, json: async () => ({ message: 'Cannot transition Gathering from COMPLETED to SCHEDULED' }) });
        }
        if (url.includes('/gatherings')) {
          return Promise.resolve({ ok: true, json: async () => [gathering()] });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();
      await waitFor(() => expect(screen.getByText('SUNDAY_SERVICE')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Edit Gathering: SUNDAY_SERVICE' }));
      await screen.findByTestId('gathering-edit-form');
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(screen.getByText('Cannot transition Gathering from COMPLETED to SCHEDULED')).toBeInTheDocument());
      expect(screen.getByTestId('gathering-edit-form')).toBeInTheDocument();
    });

    it('cancels the edit form without sending a request', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/attendance-records/completeness')) {
          return Promise.resolve({ ok: true, json: async () => ({ incomplete: false, reason: 'already recorded' }) });
        }
        return Promise.resolve({ ok: true, json: async () => [gathering()] });
      });

      renderPage();
      await waitFor(() => expect(screen.getByText('SUNDAY_SERVICE')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Edit Gathering: SUNDAY_SERVICE' }));
      await screen.findByTestId('gathering-edit-form');
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByTestId('gathering-edit-form')).not.toBeInTheDocument();
    });
  });

  /**
   * `[UX Design Implementation]` Final UX Design Specification §19 (Phase
   * 6 Gatherings workflow UI) - "Attendance review": the real, per-
   * Gathering `GET .../attendance-records` list (`AttendanceReviewPanel`),
   * reachable only from a past Gathering's own row, so which Gathering
   * the attendance belongs to is never ambiguous. No `state.actor` role
   * check is asserted here - `useAttendanceRecords` has no client-side
   * authorization gate of its own, same reasoning as every other action
   * in this file.
   */
  describe('Attendance review', () => {
    function attendanceRecord(overrides: Record<string, unknown> = {}) {
      return {
        id: 'ar-1',
        gatheringId: 'g-1',
        personId: 'person-2',
        branchId: 'branch-1',
        status: 'PRESENT',
        recordedByPersonId: 'person-3',
        recordedAt: new Date('2020-01-01T10:00:00.000Z').toISOString(),
        ...overrides,
      };
    }

    it('expands a past Gathering row into its real attendance records on "View attendance"', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/attendance-records/completeness')) {
          return Promise.resolve({ ok: true, json: async () => ({ incomplete: false, reason: 'already recorded' }) });
        }
        if (url.endsWith('/gatherings/g-1/attendance-records')) {
          return Promise.resolve({ ok: true, json: async () => [attendanceRecord()] });
        }
        if (url.includes('/gatherings')) {
          return Promise.resolve({ ok: true, json: async () => [gathering()] });
        }
        if (url.includes('/people/person-2')) {
          return Promise.resolve({ ok: true, json: async () => ({ id: 'person-2', firstName: 'Ama', lastName: 'Owusu' }) });
        }
        if (url.includes('/people/person-3')) {
          return Promise.resolve({ ok: true, json: async () => ({ id: 'person-3', firstName: 'Kwame', lastName: 'Asante' }) });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });

      renderPage();
      await waitFor(() => expect(screen.getByText('SUNDAY_SERVICE')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'View attendance for Gathering: SUNDAY_SERVICE' }));

      await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeInTheDocument());
      expect(screen.getByText('PRESENT')).toBeInTheDocument();
      expect(screen.getByText('Kwame Asante')).toBeInTheDocument();
    });

    it('shows an empty state when no attendance has been recorded yet', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/attendance-records/completeness')) {
          return Promise.resolve({ ok: true, json: async () => ({ incomplete: true, reason: 'no records yet' }) });
        }
        if (url.endsWith('/gatherings/g-1/attendance-records')) {
          return Promise.resolve({ ok: true, json: async () => [] });
        }
        if (url.includes('/gatherings')) {
          return Promise.resolve({ ok: true, json: async () => [gathering()] });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });

      renderPage();
      fireEvent.click(await screen.findByRole('button', { name: 'View attendance for Gathering: SUNDAY_SERVICE' }));

      await waitFor(() => expect(screen.getByText('No attendance recorded yet')).toBeInTheDocument());
    });

    it('shows a retryable error state when the attendance-records request fails', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/attendance-records/completeness')) {
          return Promise.resolve({ ok: true, json: async () => ({ incomplete: false, reason: 'already recorded' }) });
        }
        if (url.endsWith('/gatherings/g-1/attendance-records')) {
          return Promise.reject(new Error('network unavailable in test'));
        }
        if (url.includes('/gatherings')) {
          return Promise.resolve({ ok: true, json: async () => [gathering()] });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });

      renderPage();
      fireEvent.click(await screen.findByRole('button', { name: 'View attendance for Gathering: SUNDAY_SERVICE' }));

      await waitFor(() => expect(screen.getByText("Couldn't load attendance")).toBeInTheDocument());
    });

    it('toggles closed on "Hide attendance", and closes Edit if it was open on another row', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/attendance-records/completeness')) {
          return Promise.resolve({ ok: true, json: async () => ({ incomplete: false, reason: 'already recorded' }) });
        }
        if (url.endsWith('/attendance-records')) {
          return Promise.resolve({ ok: true, json: async () => [attendanceRecord()] });
        }
        if (url.includes('/gatherings')) {
          return Promise.resolve({ ok: true, json: async () => [gathering()] });
        }
        return Promise.resolve({ ok: true, json: async () => ({ id: 'person-2', firstName: 'Ama', lastName: 'Owusu' }) });
      });

      renderPage();
      await waitFor(() => expect(screen.getByText('SUNDAY_SERVICE')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'View attendance for Gathering: SUNDAY_SERVICE' }));
      await screen.findByTestId('attendance-review-table-g-1');

      fireEvent.click(screen.getByRole('button', { name: 'Hide attendance for Gathering: SUNDAY_SERVICE' }));
      expect(screen.queryByTestId('attendance-review-table-g-1')).not.toBeInTheDocument();

      // Opening Edit after closing Attendance still works normally - the
      // shared `expandedRow` state doesn't get stuck.
      fireEvent.click(screen.getByRole('button', { name: 'Edit Gathering: SUNDAY_SERVICE' }));
      expect(screen.getByTestId('gathering-edit-form')).toBeInTheDocument();
    });
  });
});
