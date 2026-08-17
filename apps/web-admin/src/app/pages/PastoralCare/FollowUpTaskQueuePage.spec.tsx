import { render, screen, waitFor, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { RouterProvider } from '../../router/router';
import { FollowUpTaskQueuePage } from './FollowUpTaskQueuePage';

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

function task(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ft-1',
    branchId: 'branch-1',
    groupId: null,
    personId: 'subject-1',
    assignedToPersonId: 'assignee-1',
    status: 'OPEN',
    dueAt: new Date('2020-01-01').toISOString(),
    escalatedAt: null,
    escalatedToPersonId: null,
    createdByPersonId: 'admin-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function personResponse(id: string, firstName: string, lastName: string) {
  return {
    id,
    branchId: 'branch-1',
    firstName,
    lastName,
    phone: null,
    email: null,
    dateOfBirth: null,
    address: null,
    lifecycleStage: 'MEMBER',
    guardianPersonId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** `[UX Design Implementation]` Final UX Design Specification §19 (Phase
 * 4 Pastoral Care workflow UI) - Complete now shows a success/error toast
 * (`useToast()`, the same `PersonDetailPage.tsx`/`NewPersonForm.tsx`
 * precedent), so every render needs a `ToastProvider` in its tree. */
function renderPage() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider>
          <FollowUpTaskQueuePage />
        </RouterProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('FollowUpTaskQueuePage', () => {
  it('renders the role-scoped queue with subject/assignee names and an Overdue badge for a past-due task', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/pastoral-care/follow-up-tasks')) {
        return Promise.resolve({ ok: true, json: async () => [task()] });
      }
      if (url.includes('/people/subject-1')) {
        return Promise.resolve({ ok: true, json: async () => personResponse('subject-1', 'Ama', 'Owusu') });
      }
      if (url.includes('/people/assignee-1')) {
        return Promise.resolve({ ok: true, json: async () => personResponse('assignee-1', 'Kwame', 'Asante') });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('follow-up-task-queue-card')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeInTheDocument());
    expect(screen.getByText('Overdue')).toBeInTheDocument();
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

  it('shows an empty state when the queue is empty', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No open Follow-up tasks')).toBeInTheDocument());
  });

  /** `[Branch Pastor portal]` `ASSISTANT_PASTOR`'s real
   * `pastoral_care.followup_task.read` grant is CLUSTER, spanning every
   * Bacenta in `clusterBacentaIds` - not just the first one
   * `resolveDefaultFollowUpTaskQuery` defaults to. Two Bacentas here, one
   * task (`ft-2`) returned by both queries (e.g. re-assigned mid-week);
   * asserts the rendered queue shows the deduplicated two-task union and
   * that a request went out per Bacenta in the cluster. */
  it('merges the Follow-up task queue across every Bacenta in an ASSISTANT_PASTOR\'s cluster, deduplicated by id', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1', 'bacenta-2'] }));
    const fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/pastoral-care/follow-up-tasks') && url.includes('groupId=bacenta-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => [task({ id: 'ft-1', personId: 'subject-1', assignedToPersonId: 'assignee-1' }), task({ id: 'ft-2', personId: 'subject-2', assignedToPersonId: 'assignee-1' })],
        });
      }
      if (url.includes('/pastoral-care/follow-up-tasks') && url.includes('groupId=bacenta-2')) {
        return Promise.resolve({
          ok: true,
          json: async () => [task({ id: 'ft-2', personId: 'subject-2', assignedToPersonId: 'assignee-1' }), task({ id: 'ft-3', personId: 'subject-3', assignedToPersonId: 'assignee-1' })],
        });
      }
      if (url.includes('/pastoral-care/silent-drift-flags')) return Promise.resolve({ ok: true, json: async () => [] });
      if (url.includes('/people/subject-1')) return Promise.resolve({ ok: true, json: async () => personResponse('subject-1', 'Ama', 'Owusu') });
      if (url.includes('/people/subject-2')) return Promise.resolve({ ok: true, json: async () => personResponse('subject-2', 'Kofi', 'Mensah') });
      if (url.includes('/people/subject-3')) return Promise.resolve({ ok: true, json: async () => personResponse('subject-3', 'Zainab', 'Alhassan') });
      if (url.includes('/people/assignee-1')) return Promise.resolve({ ok: true, json: async () => personResponse('assignee-1', 'Kwame', 'Asante') });
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeInTheDocument());
    expect(screen.getByText('Kofi Mensah')).toBeInTheDocument();
    expect(screen.getByText('Zainab Alhassan')).toBeInTheDocument();
    expect(screen.getAllByText('Kofi Mensah')).toHaveLength(1);

    const urls = fetchMock.mock.calls.map((call) => call[0] as string);
    expect(urls.some((url) => url.includes('groupId=bacenta-1'))).toBe(true);
    expect(urls.some((url) => url.includes('groupId=bacenta-2'))).toBe(true);
  });

  it('shows a retryable error state when the queue request fails', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load the Follow-up task queue")).toBeInTheDocument());
  });

  it('completing a task PATCHes /follow-up-tasks/:id/complete and refetches the queue', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    let listCallCount = 0;
    const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH' && url.includes('/follow-up-tasks/ft-1/complete')) {
        return Promise.resolve({ ok: true, json: async () => task({ status: 'COMPLETED' }) });
      }
      if (url.includes('/pastoral-care/follow-up-tasks')) {
        listCallCount += 1;
        return Promise.resolve({ ok: true, json: async () => (listCallCount === 1 ? [task()] : []) });
      }
      if (url.includes('/people/')) {
        return Promise.resolve({ ok: true, json: async () => personResponse('subject-1', 'Ama', 'Owusu') });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByRole('button', { name: /Mark Follow-up task complete/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Mark Follow-up task complete/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/follow-up-tasks/ft-1/complete'),
        expect.objectContaining({ method: 'PATCH' }),
      ),
    );
    await waitFor(() => expect(screen.getByText('No open Follow-up tasks')).toBeInTheDocument());
  });

  it('escalating a task searches People via RecordPicker and PATCHes /follow-up-tasks/:id/escalate with the selected target', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH' && url.includes('/follow-up-tasks/ft-1/escalate')) {
        return Promise.resolve({ ok: true, json: async () => task({ status: 'ESCALATED', escalatedToPersonId: 'target-1' }) });
      }
      if (url.includes('/pastoral-care/follow-up-tasks')) {
        return Promise.resolve({ ok: true, json: async () => [task()] });
      }
      if (url.includes('/people?search=')) {
        return Promise.resolve({ ok: true, json: async () => [personResponse('target-1', 'Kojo', 'Boateng')] });
      }
      if (url.includes('/people/')) {
        return Promise.resolve({ ok: true, json: async () => personResponse('subject-1', 'Ama', 'Owusu') });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByRole('button', { name: /Escalate Follow-up task/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Escalate Follow-up task/i }));

    const input = await screen.findByLabelText('Escalate to');
    fireEvent.change(input, { target: { value: 'Kojo' } });

    await waitFor(() => expect(screen.getByText('Kojo Boateng')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Kojo Boateng'));

    const submitButton = await screen.findByRole('button', { name: 'Submit escalation' });
    expect(submitButton).toBeEnabled();
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/follow-up-tasks/ft-1/escalate'),
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ escalatedToPersonId: 'target-1' }) }),
      ),
    );
  });

  /** `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 4 Pastoral Care workflow UI) - Complete previously had no
   * `catch` at all, so a failed completion (e.g. an RBAC denial) left
   * the button simply no longer loading, with no success or error
   * signal either way. Pins both outcomes via toast, the same pattern
   * `PersonDetailPage.tsx`'s own Follow-up Task creation established. */
  it('shows a success toast after completing a task', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    let listCallCount = 0;
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH' && url.includes('/follow-up-tasks/ft-1/complete')) {
        return Promise.resolve({ ok: true, json: async () => task({ status: 'COMPLETED' }) });
      }
      if (url.includes('/pastoral-care/follow-up-tasks')) {
        listCallCount += 1;
        return Promise.resolve({ ok: true, json: async () => (listCallCount === 1 ? [task()] : []) });
      }
      if (url.includes('/people/')) {
        return Promise.resolve({ ok: true, json: async () => personResponse('subject-1', 'Ama', 'Owusu') });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Mark Follow-up task complete/i }));

    expect(await screen.findByText('Follow-up task marked complete.')).toBeInTheDocument();
  });

  it('shows an error toast when completing a task fails, instead of failing silently', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH' && url.includes('/follow-up-tasks/ft-1/complete')) {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: async () => ({ message: "No Role Assignment grants 'pastoral_care.followup_task.update' to role 'ADMIN'" }),
        });
      }
      if (url.includes('/pastoral-care/follow-up-tasks')) {
        return Promise.resolve({ ok: true, json: async () => [task()] });
      }
      if (url.includes('/people/')) {
        return Promise.resolve({ ok: true, json: async () => personResponse('subject-1', 'Ama', 'Owusu') });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Mark Follow-up task complete/i }));

    expect(await screen.findByText("No Role Assignment grants 'pastoral_care.followup_task.update' to role 'ADMIN'")).toBeInTheDocument();
    // The task itself is untouched by a failed request - still in the queue.
    expect(screen.getByRole('button', { name: /Mark Follow-up task complete/i })).toBeInTheDocument();
  });

  /** `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 4 Pastoral Care workflow UI) - Escalate previously had no
   * `catch` either, leaving the form open with no indication anything
   * went wrong. Matches `submitCreate`'s own inline-error pattern. */
  it('shows the server-provided error inline and keeps the form open when escalation fails', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH' && url.includes('/follow-up-tasks/ft-1/escalate')) {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({ message: 'This Follow-up task has already been escalated.' }),
        });
      }
      if (url.includes('/pastoral-care/follow-up-tasks')) {
        return Promise.resolve({ ok: true, json: async () => [task()] });
      }
      if (url.includes('/people?search=')) {
        return Promise.resolve({ ok: true, json: async () => [personResponse('target-1', 'Kojo', 'Boateng')] });
      }
      if (url.includes('/people/')) {
        return Promise.resolve({ ok: true, json: async () => personResponse('subject-1', 'Ama', 'Owusu') });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Escalate Follow-up task/i }));

    const input = await screen.findByLabelText('Escalate to');
    fireEvent.change(input, { target: { value: 'Kojo' } });
    await waitFor(() => expect(screen.getByText('Kojo Boateng')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Kojo Boateng'));

    fireEvent.click(await screen.findByRole('button', { name: 'Submit escalation' }));

    await waitFor(() => expect(screen.getByText('This Follow-up task has already been escalated.')).toBeInTheDocument());
    expect(screen.getByTestId('escalate-form')).toBeInTheDocument();
  });

  it('the Submit escalation action is disabled until a target Person is selected', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/pastoral-care/follow-up-tasks')) {
        return Promise.resolve({ ok: true, json: async () => [task()] });
      }
      if (url.includes('/pastoral-care/silent-drift-flags')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.resolve({ ok: true, json: async () => personResponse('subject-1', 'Ama', 'Owusu') });
    });

    renderPage();

    await waitFor(() => expect(screen.getByRole('button', { name: /Escalate Follow-up task/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Escalate Follow-up task/i }));

    const submitButton = await screen.findByRole('button', { name: 'Submit escalation' });
    expect(submitButton).toBeDisabled();
  });

  /**
   * `[Follow-up Task Creation milestone]` No `state.actor` role check is
   * asserted here - `createFollowUpTask` has no client-side authorization
   * gate of its own (same reasoning as every other action this session),
   * so these tests exercise the real request/refetch wiring, not a role
   * gate.
   */
  describe('Create Follow-up task', () => {
    it('POSTs the selected Person/Assignee, then refetches and shows the newly created task in the queue', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1'] }));
      let listCallCount = 0;
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/people/subject-1/follow-up-tasks') && init?.method === 'POST') {
          return Promise.resolve({ ok: true, json: async () => task({ id: 'ft-new', personId: 'subject-1', assignedToPersonId: 'assignee-1' }) });
        }
        if (url.includes('/people?search=Ama')) {
          return Promise.resolve({ ok: true, json: async () => [personResponse('subject-1', 'Ama', 'Owusu')] });
        }
        if (url.includes('/people?search=Kwame')) {
          return Promise.resolve({ ok: true, json: async () => [personResponse('assignee-1', 'Kwame', 'Asante')] });
        }
        if (url.includes('/pastoral-care/follow-up-tasks')) {
          listCallCount += 1;
          return Promise.resolve({
            ok: true,
            json: async () => (listCallCount === 1 ? [] : [task({ id: 'ft-new', personId: 'subject-1', assignedToPersonId: 'assignee-1' })]),
          });
        }
        if (url.includes('/people/subject-1')) {
          return Promise.resolve({ ok: true, json: async () => personResponse('subject-1', 'Ama', 'Owusu') });
        }
        if (url.includes('/people/assignee-1')) {
          return Promise.resolve({ ok: true, json: async () => personResponse('assignee-1', 'Kwame', 'Asante') });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();
      await waitFor(() => expect(screen.getByText('No open Follow-up tasks')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Create Follow-up task' }));

      const confirmButton = screen.getByRole('button', { name: 'Confirm create' });
      expect(confirmButton).toBeDisabled();

      fireEvent.change(screen.getByLabelText('Person'), { target: { value: 'Ama' } });
      await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Ama Owusu'));

      fireEvent.change(screen.getByLabelText('Assign to'), { target: { value: 'Kwame' } });
      await waitFor(() => expect(screen.getByText('Kwame Asante')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Kwame Asante'));

      expect(confirmButton).toBeEnabled();
      fireEvent.click(confirmButton);

      await waitForElementToBeRemoved(() => screen.queryByTestId('follow-up-task-create-form'));

      const postCall = fetchMock.mock.calls.find(
        ([url, init]) => (url as string).includes('/people/subject-1/follow-up-tasks') && (init as RequestInit)?.method === 'POST',
      );
      expect(postCall).toBeDefined();
      expect(JSON.parse((postCall as [string, RequestInit])[1].body as string)).toEqual({
        assignedToPersonId: 'assignee-1',
        trigger: 'MANUAL',
        groupId: undefined,
        dueAtOverride: undefined,
      });

      await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeInTheDocument());
    });

    it('shows the server-provided denial reason inline and keeps the form open on a 403', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/follow-up-tasks') && init?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: async () => ({ message: "No Role Assignment grants 'pastoral_care.followup_task.create' to role 'ADMIN'" }),
          });
        }
        if (url.includes('/people?search=')) {
          return Promise.resolve({ ok: true, json: async () => [personResponse('subject-1', 'Ama', 'Owusu')] });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });
      global.fetch = fetchMock;

      renderPage();
      await waitFor(() => expect(screen.getByText('No open Follow-up tasks')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Create Follow-up task' }));

      fireEvent.change(screen.getByLabelText('Person'), { target: { value: 'Ama' } });
      await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Ama Owusu'));

      fireEvent.change(screen.getByLabelText('Assign to'), { target: { value: 'Ama' } });
      await waitFor(() => expect(screen.getAllByText('Ama Owusu').length).toBeGreaterThan(1));
      fireEvent.click(screen.getAllByText('Ama Owusu')[1]);

      fireEvent.click(screen.getByRole('button', { name: 'Confirm create' }));

      await waitFor(() =>
        expect(screen.getByText("No Role Assignment grants 'pastoral_care.followup_task.create' to role 'ADMIN'")).toBeInTheDocument(),
      );
      expect(screen.getByTestId('follow-up-task-create-form')).toBeInTheDocument();
    });

    it('cancels the form without sending a request', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

      renderPage();
      await waitFor(() => expect(screen.getByText('No open Follow-up tasks')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Create Follow-up task' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByTestId('follow-up-task-create-form')).not.toBeInTheDocument();
    });
  });

  /** `[Silent-Drift Detection Branch-wide milestone]` */
  describe('Silent-Drift flags', () => {
    function silentDriftFlag(overrides: Record<string, unknown> = {}) {
      return {
        id: 'sdf-1',
        branchId: 'branch-1',
        groupId: 'bacenta-1',
        personId: 'subject-1',
        attendanceMissedCount: 0,
        attendanceThreshold: 3,
        bacentaMissedCount: 3,
        bacentaThreshold: 3,
        status: 'FLAGGED',
        assignedShepherdPersonId: null,
        resolvedAt: null,
        escalatedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
        ...overrides,
      };
    }

    it('fetches the Branch-wide list (no groupId) for a Resident Pastor and renders each flag', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
      const fetchMock = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/pastoral-care/silent-drift-flags')) {
          return Promise.resolve({ ok: true, json: async () => [silentDriftFlag()] });
        }
        if (url.includes('/pastoral-care/follow-up-tasks')) {
          return Promise.resolve({ ok: true, json: async () => [] });
        }
        if (url.includes('/people/subject-1')) {
          return Promise.resolve({ ok: true, json: async () => personResponse('subject-1', 'Ama', 'Owusu') });
        }
        if (url.includes('/groups/bacenta-1')) {
          return Promise.resolve({ ok: true, json: async () => ({ id: 'bacenta-1', name: 'Grace Bacenta', type: 'PASTORAL_CARE' }) });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/pastoral-care\/silent-drift-flags$/), expect.anything()),
      );
      await waitFor(() => expect(screen.getByTestId('silent-drift-flags-card')).toBeInTheDocument());
      await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeInTheDocument());
      expect(screen.getByText('FLAGGED')).toBeInTheDocument();
      expect(screen.getByText(/Attended 3 of last 3 Gatherings/)).toBeInTheDocument();
      expect(screen.getByText(/0 of last 3 Bacenta Meetings/)).toBeInTheDocument();
    });

    it('sends the Bacenta Leader own-group scope as a groupId query param', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
      const fetchMock = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/pastoral-care/silent-drift-flags')) {
          return Promise.resolve({ ok: true, json: async () => [] });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });
      global.fetch = fetchMock;

      renderPage();

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/pastoral-care/silent-drift-flags?groupId=bacenta-1'), expect.anything()),
      );
    });

    /** `[Branch Pastor portal]` Same cluster-merge fix as Follow-up Tasks
     * above, applied to Silent-Drift flags - `pastoral_care.silent_drift_flag.read`
     * is CLUSTER for `ASSISTANT_PASTOR` too. */
    it('merges Silent-Drift flags across every Bacenta in an ASSISTANT_PASTOR\'s cluster, deduplicated by id', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1', 'bacenta-2'] }));
      const fetchMock = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/pastoral-care/follow-up-tasks')) {
          return Promise.resolve({ ok: true, json: async () => [] });
        }
        if (url.includes('/pastoral-care/silent-drift-flags') && url.includes('groupId=bacenta-1')) {
          return Promise.resolve({
            ok: true,
            json: async () => [silentDriftFlag({ id: 'sdf-1', groupId: 'bacenta-1', personId: 'subject-1' }), silentDriftFlag({ id: 'sdf-2', groupId: 'bacenta-2', personId: 'subject-2' })],
          });
        }
        if (url.includes('/pastoral-care/silent-drift-flags') && url.includes('groupId=bacenta-2')) {
          return Promise.resolve({
            ok: true,
            json: async () => [silentDriftFlag({ id: 'sdf-2', groupId: 'bacenta-2', personId: 'subject-2' }), silentDriftFlag({ id: 'sdf-3', groupId: 'bacenta-2', personId: 'subject-3' })],
          });
        }
        if (url.includes('/people/subject-1')) return Promise.resolve({ ok: true, json: async () => personResponse('subject-1', 'Ama', 'Owusu') });
        if (url.includes('/people/subject-2')) return Promise.resolve({ ok: true, json: async () => personResponse('subject-2', 'Kofi', 'Mensah') });
        if (url.includes('/people/subject-3')) return Promise.resolve({ ok: true, json: async () => personResponse('subject-3', 'Zainab', 'Alhassan') });
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();

      await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeInTheDocument());
      expect(screen.getByText('Kofi Mensah')).toBeInTheDocument();
      expect(screen.getByText('Zainab Alhassan')).toBeInTheDocument();
      expect(screen.getAllByText('Kofi Mensah')).toHaveLength(1);

      const urls = fetchMock.mock.calls.map((call) => call[0] as string);
      expect(urls.some((url) => url.includes('/pastoral-care/silent-drift-flags?groupId=bacenta-1'))).toBe(true);
      expect(urls.some((url) => url.includes('/pastoral-care/silent-drift-flags?groupId=bacenta-2'))).toBe(true);
    });

    it('shows an empty state when no Persons are flagged', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

      renderPage();

      await waitFor(() => expect(screen.getByText('No Silent-Drift flags')).toBeInTheDocument());
    });

    it('shows a retryable error state when the request fails', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/pastoral-care/silent-drift-flags')) {
          return Promise.reject(new Error('network unavailable in test'));
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });

      renderPage();

      await waitFor(() => expect(screen.getByText("Couldn't load Silent-Drift flags")).toBeInTheDocument());
    });

    it('offers no resolve/escalate action - the backend exposes no mutation route for this data', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/pastoral-care/silent-drift-flags')) {
          return Promise.resolve({ ok: true, json: async () => [silentDriftFlag()] });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });

      renderPage();

      await waitFor(() => expect(screen.getByTestId('silent-drift-flags-card')).toBeInTheDocument());
      expect(screen.queryByRole('button', { name: /resolve/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /escalate.*flag/i })).not.toBeInTheDocument();
    });
  });
});
