import { render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { MinistryRosterScreen } from './MinistryRosterScreen';

jest.mock('../../lib/session', () => ({
  useMinistrySession: () => ({
    personId: 'ministry-1',
    branchId: 'branch-1',
    basontaGroupId: 'basonta-1',
    authToken: 'token-1',
  }),
}));

jest.mock('../MinistryDashboard/hooks/useMinistryData');
import { useOvercommitmentFlags, useRoster } from '../MinistryDashboard/hooks/useMinistryData';
const mockUseRoster = useRoster as jest.Mock;
const mockUseOvercommitmentFlags = useOvercommitmentFlags as jest.Mock;

function jsonResponse(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}

function renderScreen() {
  return render(
    <ThemeProvider>
      <MinistryRosterScreen />
    </ThemeProvider>,
  );
}

describe('MinistryRosterScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows a skeleton while loading', () => {
    mockUseRoster.mockReturnValue({ status: 'loading', refetch: jest.fn() });
    mockUseOvercommitmentFlags.mockReturnValue({ status: 'loading', refetch: jest.fn() });
    renderScreen();
    expect(screen.queryByText('No roster members yet')).toBeNull();
  });

  it('shows the positive empty state when the roster has no members', () => {
    mockUseRoster.mockReturnValue({ status: 'success', data: [], refetch: jest.fn() });
    mockUseOvercommitmentFlags.mockReturnValue({ status: 'success', data: [], refetch: jest.fn() });
    renderScreen();
    expect(screen.getByText('No roster members yet')).toBeTruthy();
  });

  it('shows an error state with retry on failure', () => {
    const refetch = jest.fn();
    mockUseRoster.mockReturnValue({ status: 'error', error: new Error('network down'), refetch });
    mockUseOvercommitmentFlags.mockReturnValue({ status: 'success', data: [], refetch: jest.fn() });
    renderScreen();
    expect(screen.getByText("Couldn't load your roster")).toBeTruthy();
  });

  it('renders each member\'s resolved name and an Overcommitted badge only for flagged members', async () => {
    mockUseRoster.mockReturnValue({
      status: 'success',
      data: [
        { personId: 'p-1', startedAt: '2026-01-01T00:00:00.000Z' },
        { personId: 'p-2', startedAt: '2026-01-01T00:00:00.000Z' },
      ],
      refetch: jest.fn(),
    });
    mockUseOvercommitmentFlags.mockReturnValue({
      status: 'success',
      data: [{ personId: 'p-1', concurrentCommitmentCount: 3, threshold: 2, overcommitted: true }],
      refetch: jest.fn(),
    });
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/people/p-1')) {
        return jsonResponse({ id: 'p-1', branchId: 'branch-1', firstName: 'Ama', lastName: 'Owusu', phone: null, email: null, dateOfBirth: null, address: null, lifecycleStage: 'WORKER', guardianPersonId: null, createdAt: '', updatedAt: '' });
      }
      if (url.includes('/people/p-2')) {
        return jsonResponse({ id: 'p-2', branchId: 'branch-1', firstName: 'Yaw', lastName: 'Asante', phone: null, email: null, dateOfBirth: null, address: null, lifecycleStage: 'WORKER', guardianPersonId: null, createdAt: '', updatedAt: '' });
      }
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('Yaw Asante')).toBeTruthy());
    expect(screen.getByTestId('ministry-roster-row-p-1')).toBeTruthy();
    expect(screen.getAllByText('Overcommitted')).toHaveLength(1);
  });
});
