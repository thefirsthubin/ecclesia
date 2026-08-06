import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { PastorClusterBranchScreen } from './PastorClusterBranchScreen';

jest.mock('../../lib/session', () => ({
  useActorSession: () => ({
    personId: 'pastor-1',
    branchId: 'branch-1',
    role: 'RESIDENT_PASTOR',
    authToken: 'token-1',
  }),
}));

function jsonResponse(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}

const BACENTA = {
  id: 'bacenta-1',
  branchId: 'branch-1',
  type: 'PASTORAL_CARE',
  name: 'Bacenta 12',
  meetingSchedule: 'Wednesdays, 6pm',
  meetingLocation: null,
  category: null,
  lifecycleStatus: 'ACTIVE',
  createdAt: '',
  updatedAt: '',
};

function renderScreen() {
  return render(
    <ThemeProvider>
      <PastorClusterBranchScreen />
    </ThemeProvider>,
  );
}

describe('PastorClusterBranchScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows the Branch Pulse header and the list of Bacentas', async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/insights/branch-dashboard')) {
        return jsonResponse({ branchId: 'branch-1', pulseScore: { id: 'ps-1', branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1', score: 70, computedAt: '' }, alerts: [] });
      }
      if (url.includes('/groups?type=PASTORAL_CARE')) {
        return jsonResponse([BACENTA]);
      }
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByText('Branch Pulse: 70')).toBeTruthy());
    expect(screen.getByText('Bacenta 12')).toBeTruthy();
    expect(screen.getByText('Wednesdays, 6pm')).toBeTruthy();
  });

  it('shows the empty state when the Branch has no Bacentas', async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/insights/branch-dashboard')) {
        return jsonResponse({ branchId: 'branch-1', pulseScore: { id: 'ps-1', branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1', score: 70, computedAt: '' }, alerts: [] });
      }
      return jsonResponse([]);
    }) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByText('No Bacentas in this Branch yet')).toBeTruthy());
  });

  it('expanding a row lazily fetches and shows that Bacenta\'s own Pulse score', async () => {
    let bacentaDashboardFetched = false;
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/insights/branch-dashboard')) {
        return jsonResponse({ branchId: 'branch-1', pulseScore: { id: 'ps-1', branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1', score: 70, computedAt: '' }, alerts: [] });
      }
      if (url.includes('/groups?type=PASTORAL_CARE')) {
        return jsonResponse([BACENTA]);
      }
      if (url.includes('/insights/bacenta-dashboard/bacenta-1')) {
        bacentaDashboardFetched = true;
        return jsonResponse({ branchId: 'branch-1', groupId: 'bacenta-1', pulseScore: { id: 'ps-2', branchId: 'branch-1', scopeType: 'GROUP', scopeId: 'bacenta-1', score: 42, computedAt: '' }, alerts: [] });
      }
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByTestId('pastor-cluster-toggle-bacenta-1')).toBeTruthy());
    expect(bacentaDashboardFetched).toBe(false);

    fireEvent.press(screen.getByTestId('pastor-cluster-toggle-bacenta-1'));

    await waitFor(() => expect(screen.getByText('Pulse: 42')).toBeTruthy());
    expect(bacentaDashboardFetched).toBe(true);
  });
});
