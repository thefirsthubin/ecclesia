import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

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

/** `[Remaining Engineering Sprint, Milestone 11]` Now also wraps
 * `ToastProvider` - a Basonta Leader's roster view now embeds
 * `StaffingTargetsPanel`, which calls `useToast()` unconditionally. */
function renderPage() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider>
          <MinistryPage />
        </RouterProvider>
      </ToastProvider>
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
    await waitFor(() => expect(screen.getByText('No Groups yet')).toBeInTheDocument());
  });

  /**
   * `[UX Design Implementation]` Final UX Design Specification §19 (Phase
   * 7 Ministry workflow UI) - the same direct-bypass precedent
   * `BASONTA_LEADER` already had, closed for `BACENTA_LEADER` too
   * (`GroupListResourceContextGuard`'s own doc comment: this role "already
   * knows their own single Group id ... and has no need to list").
   */
  it('routes a Bacenta Leader straight to their own Bacenta detail, no directory fetch', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    const fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url.endsWith('/groups/bacenta-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'bacenta-1',
            branchId: 'branch-1',
            type: 'PASTORAL_CARE',
            name: 'Grace Bacenta',
            meetingSchedule: null,
            meetingLocation: null,
            category: null,
            lifecycleStatus: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Grace Bacenta' })).toBeInTheDocument());
    const calledUrls = fetchMock.mock.calls.map((call) => call[0] as string);
    expect(calledUrls.some((url) => url.endsWith('/groups'))).toBe(false);
  });
});
