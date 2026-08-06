import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { FollowUpQueueScreen } from './FollowUpQueueScreen';
import { useOpenFollowUpTasks, usePersonName } from '../ShepherdDashboard/hooks/useShepherdDashboardData';

jest.mock('../ShepherdDashboard/hooks/useShepherdDashboardData');
const mockUseOpenFollowUpTasks = useOpenFollowUpTasks as jest.Mock;
const mockUsePersonName = usePersonName as jest.Mock;

jest.mock('../../lib/session', () => ({
  useSession: () => ({
    personId: 'shepherd-1',
    branchId: 'branch-1',
    bacentaGroupId: 'bacenta-1',
    authToken: 'token-1',
  }),
}));

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) } as Response);
}

function task(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ft-1',
    branchId: 'branch-1',
    groupId: 'bacenta-1',
    personId: 'subject-1',
    assignedToPersonId: 'shepherd-1',
    status: 'OPEN',
    dueAt: new Date('2020-01-01').toISOString(),
    escalatedAt: null,
    escalatedToPersonId: null,
    createdByPersonId: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderScreen() {
  return render(
    <ThemeProvider>
      <FollowUpQueueScreen />
    </ThemeProvider>,
  );
}

describe('FollowUpQueueScreen', () => {
  beforeEach(() => {
    mockUsePersonName.mockReturnValue({ status: 'success', data: { firstName: 'Ama', lastName: 'Owusu' }, refetch: jest.fn() });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows a positive empty state when there are no open Follow-up tasks', () => {
    mockUseOpenFollowUpTasks.mockReturnValue({ status: 'success', data: [], refetch: jest.fn() });

    renderScreen();

    expect(screen.getByText('No open Follow-up tasks')).toBeTruthy();
  });

  it('shows a retryable error state when the queue fails to load', () => {
    const refetch = jest.fn();
    mockUseOpenFollowUpTasks.mockReturnValue({ status: 'error', error: new Error('network'), refetch });

    renderScreen();

    expect(screen.getByText("Couldn't load your Follow-up tasks")).toBeTruthy();
  });

  it('renders task rows with an Overdue badge and the subject name', () => {
    mockUseOpenFollowUpTasks.mockReturnValue({ status: 'success', data: [task()], refetch: jest.fn() });

    renderScreen();

    expect(screen.getByText('Ama Owusu')).toBeTruthy();
    expect(screen.getByText('Overdue')).toBeTruthy();
  });

  it('completing a task PATCHes /follow-up-tasks/:id/complete and refetches the queue', async () => {
    const refetch = jest.fn();
    mockUseOpenFollowUpTasks.mockReturnValue({ status: 'success', data: [task()], refetch });
    const fetchMock = jest.fn(() => jsonResponse(task({ status: 'COMPLETED' }))) as unknown as typeof fetch;
    global.fetch = fetchMock;

    renderScreen();
    fireEvent.press(screen.getByTestId('follow-up-complete-ft-1'));

    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    const [url, init] = (fetchMock as jest.Mock).mock.calls[0];
    expect(url).toContain('/follow-up-tasks/ft-1/complete');
    expect(init.method).toBe('PATCH');
  });

  it('escalating searches People via RecordPicker and PATCHes /follow-up-tasks/:id/escalate with the selected target', async () => {
    const refetch = jest.fn();
    mockUseOpenFollowUpTasks.mockReturnValue({ status: 'success', data: [task()], refetch });
    const fetchMock = jest.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') return jsonResponse(task({ status: 'ESCALATED', escalatedToPersonId: 'target-1' }));
      if (url.includes('/people?search=')) return jsonResponse([{ id: 'target-1', branchId: 'branch-1', firstName: 'Kojo', lastName: 'Boateng', phone: null, email: null, dateOfBirth: null, address: null, lifecycleStage: 'MEMBER', guardianPersonId: null, createdAt: '', updatedAt: '' }]);
      return jsonResponse(null);
    }) as unknown as typeof fetch;
    global.fetch = fetchMock;

    renderScreen();
    fireEvent.press(screen.getByTestId('follow-up-escalate-ft-1'));

    // `RecordPicker`'s own unselected state is a trigger button labelled
    // with `label` ("Escalate to") - pressing it opens the Modal
    // containing the actual search `TextInput`, which carries a fixed,
    // distinct "Search" label (never `label` again - see `RecordPicker`'s
    // own doc comment on why, to avoid an ambiguous duplicate a11y label
    // with this same trigger, still mounted behind the open Modal).
    fireEvent.press(screen.getByTestId('follow-up-escalate-picker-ft-1'));
    const input = await screen.findByLabelText('Search');
    fireEvent.changeText(input, 'Kojo');

    await waitFor(() => expect(screen.getByText('Kojo Boateng')).toBeTruthy());
    fireEvent.press(screen.getByText('Kojo Boateng'));

    const submitButton = await screen.findByTestId('follow-up-escalate-submit-ft-1');
    expect(submitButton.props.accessibilityState.disabled).toBe(false);
    fireEvent.press(submitButton);

    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    const patchCalls = (fetchMock as jest.Mock).mock.calls.filter(([, init]: [string, RequestInit?]) => init?.method === 'PATCH');
    expect(patchCalls).toHaveLength(1);
    expect(patchCalls[0][0]).toContain('/follow-up-tasks/ft-1/escalate');
    expect(JSON.parse(patchCalls[0][1].body)).toEqual({ escalatedToPersonId: 'target-1' });
  });

  it('Submit escalation stays disabled until a target Person is selected', () => {
    mockUseOpenFollowUpTasks.mockReturnValue({ status: 'success', data: [task()], refetch: jest.fn() });
    global.fetch = jest.fn(() => jsonResponse([])) as unknown as typeof fetch;

    renderScreen();
    fireEvent.press(screen.getByTestId('follow-up-escalate-ft-1'));

    expect(screen.getByTestId('follow-up-escalate-submit-ft-1').props.accessibilityState.disabled).toBe(true);
  });

  it('Cancel hides the escalation picker without submitting anything', () => {
    mockUseOpenFollowUpTasks.mockReturnValue({ status: 'success', data: [task()], refetch: jest.fn() });
    global.fetch = jest.fn(() => jsonResponse([])) as unknown as typeof fetch;

    renderScreen();
    fireEvent.press(screen.getByTestId('follow-up-escalate-ft-1'));
    expect(screen.getByTestId('follow-up-escalate-picker-ft-1')).toBeTruthy();

    fireEvent.press(screen.getByTestId('follow-up-escalate-cancel-ft-1'));
    expect(screen.queryByTestId('follow-up-escalate-picker-ft-1')).toBeNull();
  });
});
