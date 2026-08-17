import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { GatheringsPage } from './GatheringsPage';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actorWithRole(role: string, extra: Record<string, unknown> = {}) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'person-1', role, branchId: 'branch-1', branchName: 'Headquarters', ...extra },
    },
  };
}

function renderPage() {
  return render(
    <ThemeProvider>
      <GatheringsPage />
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('GatheringsPage', () => {
  it('routes ASSISTANT_PASTOR to the grouped Branch Gatherings view', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No Gatherings in this window')).toBeInTheDocument());
  });

  /** Every other role keeps the exact shared `GatheringsListPage` -
   * Upcoming/Past tables, not the grouped view - unaffected by this
   * sprint's own dispatch addition. */
  it('routes every other role to the unchanged shared GatheringsListPage', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('Upcoming Gatherings')).toBeInTheDocument());
    expect(screen.getByText('Past Gatherings')).toBeInTheDocument();
  });
});
