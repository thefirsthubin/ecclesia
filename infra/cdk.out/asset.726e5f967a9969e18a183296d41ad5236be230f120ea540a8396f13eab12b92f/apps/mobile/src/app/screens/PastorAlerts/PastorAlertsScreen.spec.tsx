import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { PastorAlertsScreen } from './PastorAlertsScreen';

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

const ALERT = {
  id: 'a-1',
  branchId: 'branch-1',
  scopeType: 'GROUP',
  scopeId: 'bacenta-1',
  alertType: 'SILENT_DRIFT',
  message: 'Three consecutive Sundays missed',
  status: 'OPEN',
  resolvedByPersonId: null,
  resolvedAt: null,
  triggeredAt: '2026-08-01T00:00:00.000Z',
};

function renderScreen() {
  return render(
    <ThemeProvider>
      <PastorAlertsScreen />
    </ThemeProvider>,
  );
}

describe('PastorAlertsScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows the positive empty state when there are no OPEN alerts', async () => {
    global.fetch = jest.fn(() => jsonResponse({ branchId: 'branch-1', pulseScore: { id: 'ps-1', branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1', score: 80, computedAt: '' }, alerts: [] })) as unknown as typeof fetch;
    renderScreen();
    await waitFor(() => expect(screen.getByText('No open alerts')).toBeTruthy());
  });

  it('lists an OPEN alert with its message', async () => {
    global.fetch = jest.fn(() =>
      jsonResponse({ branchId: 'branch-1', pulseScore: { id: 'ps-1', branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1', score: 60, computedAt: '' }, alerts: [ALERT] }),
    ) as unknown as typeof fetch;
    renderScreen();
    await waitFor(() => expect(screen.getByText('SILENT_DRIFT')).toBeTruthy());
    expect(screen.getByText('Three consecutive Sundays missed')).toBeTruthy();
  });

  it('excludes already-resolved alerts from the list', async () => {
    global.fetch = jest.fn(() =>
      jsonResponse({
        branchId: 'branch-1',
        pulseScore: { id: 'ps-1', branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1', score: 60, computedAt: '' },
        alerts: [{ ...ALERT, status: 'ACTED', resolvedByPersonId: 'pastor-1', resolvedAt: '2026-08-02T00:00:00.000Z' }],
      }),
    ) as unknown as typeof fetch;
    renderScreen();
    await waitFor(() => expect(screen.getByText('No open alerts')).toBeTruthy());
  });

  it('Mark Acted calls PATCH /insights/alerts/:id/resolve with status ACTED and refetches', async () => {
    let resolved = false;
    global.fetch = jest.fn((url: string, init?: RequestInit) => {
      if (url.includes('/resolve')) {
        resolved = true;
        expect(init?.method).toBe('PATCH');
        expect(JSON.parse(init?.body as string)).toEqual({ status: 'ACTED' });
        return jsonResponse({ ...ALERT, status: 'ACTED' });
      }
      return jsonResponse({
        branchId: 'branch-1',
        pulseScore: { id: 'ps-1', branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1', score: 60, computedAt: '' },
        alerts: resolved ? [] : [ALERT],
      });
    }) as unknown as typeof fetch;

    renderScreen();
    await waitFor(() => expect(screen.getByTestId('pastor-alert-acted-a-1')).toBeTruthy());
    fireEvent.press(screen.getByTestId('pastor-alert-acted-a-1'));

    await waitFor(() => expect(screen.getByText('No open alerts')).toBeTruthy());
  });
});
