import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { RouterProvider } from '../../router/router';
import { GroupDetailView } from './GroupDetailView';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function groupResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'group-1',
    branchId: 'branch-1',
    type: 'MINISTRY',
    name: 'Media Basonta',
    meetingSchedule: null,
    meetingLocation: null,
    category: null,
    lifecycleStatus: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderView() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider>
          <GroupDetailView groupId="group-1" />
        </RouterProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('GroupDetailView', () => {
  it('fetches the Group by id and renders BasontaRosterView for a MINISTRY Group', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.endsWith('/groups/group-1')) {
        return Promise.resolve({ ok: true, json: async () => groupResponse({ type: 'MINISTRY' }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderView();

    await waitFor(() => expect(screen.getByText('Basonta roster')).toBeInTheDocument());
  });

  it('fetches the Group by id and renders BacentaDetailView for a PASTORAL_CARE Group', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.endsWith('/groups/group-1')) {
        return Promise.resolve({ ok: true, json: async () => groupResponse({ type: 'PASTORAL_CARE', name: 'Grace Bacenta' }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderView();

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Grace Bacenta' })).toBeInTheDocument());
    expect(screen.getByTestId('bacenta-detail-card')).toBeInTheDocument();
  });

  it('shows a retryable error state when the Group itself fails to load', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    renderView();

    await waitFor(() => expect(screen.getByText("Couldn't load this Group")).toBeInTheDocument());
  });
});
