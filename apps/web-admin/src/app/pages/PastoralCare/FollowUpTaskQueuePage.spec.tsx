import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

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

function renderPage() {
  return render(
    <ThemeProvider>
      <RouterProvider>
        <FollowUpTaskQueuePage />
      </RouterProvider>
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

  it('the Submit escalation action is disabled until a target Person is selected', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/pastoral-care/follow-up-tasks')) {
        return Promise.resolve({ ok: true, json: async () => [task()] });
      }
      return Promise.resolve({ ok: true, json: async () => personResponse('subject-1', 'Ama', 'Owusu') });
    });

    renderPage();

    await waitFor(() => expect(screen.getByRole('button', { name: /Escalate Follow-up task/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Escalate Follow-up task/i }));

    const submitButton = await screen.findByRole('button', { name: 'Submit escalation' });
    expect(submitButton).toBeDisabled();
  });
});
