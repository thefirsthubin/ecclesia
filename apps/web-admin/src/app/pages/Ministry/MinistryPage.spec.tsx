import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { RouterProvider } from '../../router/router';
import { MinistryPage } from './MinistryPage';

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

function renderPage() {
  return render(
    <ThemeProvider>
      <RouterProvider>
        <MinistryPage />
      </RouterProvider>
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('MinistryPage', () => {
  it('routes a Basonta Leader straight to their own roster, no directory fetch', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BASONTA_LEADER', { basontaId: 'basonta-1' }));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByText('Basonta roster')).toBeInTheDocument());
    const calledUrls = fetchMock.mock.calls.map((call) => call[0] as string);
    expect(calledUrls.some((url) => url.includes('/ministry/groups/basonta-1/roster'))).toBe(true);
    expect(calledUrls.some((url) => url.includes('/groups?type=MINISTRY'))).toBe(false);
  });

  it('shows the Basonta directory for a Resident Pastor', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('Ministry')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('No Basontas yet')).toBeInTheDocument());
  });
});
