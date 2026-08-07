import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { BasontaRosterView } from './BasontaRosterView';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

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

/**
 * `[Remaining Engineering Sprint, Milestone 11]` Now also wraps
 * `ToastProvider` - the newly-embedded `StaffingTargetsPanel` calls
 * `useToast()` unconditionally, which throws outside a `ToastProvider` by
 * that hook's own design (`app.tsx` always mounts one at the real app
 * root).
 */
function renderView() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <BasontaRosterView groupId="basonta-1" />
      </ToastProvider>
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('BasontaRosterView', () => {
  it('renders roster members with an Overcommitted badge for flagged Persons', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/roster/overcommitment')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ personId: 'worker-1', concurrentCommitmentCount: 5, threshold: 4, overcommitted: true }],
        });
      }
      if (url.includes('/roster')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { personId: 'worker-1', startedAt: new Date('2024-01-01').toISOString() },
            { personId: 'worker-2', startedAt: new Date('2024-02-01').toISOString() },
          ],
        });
      }
      if (url.includes('/people/worker-1')) {
        return Promise.resolve({ ok: true, json: async () => personResponse('worker-1', 'Kojo', 'Boateng') });
      }
      if (url.includes('/people/worker-2')) {
        return Promise.resolve({ ok: true, json: async () => personResponse('worker-2', 'Efua', 'Danso') });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    renderView();

    await waitFor(() => expect(screen.getByTestId('basonta-roster-card')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Kojo Boateng')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Efua Danso')).toBeInTheDocument());
    expect(screen.getByText('Overcommitted')).toBeInTheDocument();
  });

  it('shows an empty state when no one is currently rostered', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderView();

    await waitFor(() => expect(screen.getByText('No active workers yet')).toBeInTheDocument());
  });

  it('shows a retryable error state when the roster request fails', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    renderView();

    await waitFor(() => expect(screen.getByText("Couldn't load the roster")).toBeInTheDocument());
  });
});
