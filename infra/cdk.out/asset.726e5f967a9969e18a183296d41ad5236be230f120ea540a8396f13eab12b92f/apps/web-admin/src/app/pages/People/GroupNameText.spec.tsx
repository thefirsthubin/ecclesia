import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { GroupNameText } from './GroupNameText';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('GroupNameText', () => {
  it('resolves a groupId into its display name via GET /groups/:id', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'group-1',
        branchId: 'branch-1',
        type: 'PASTORAL_CARE',
        name: 'Faith Bacenta',
        meetingSchedule: null,
        meetingLocation: null,
        category: null,
        lifecycleStatus: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });

    renderWithTheme(<GroupNameText groupId="group-1" />);

    await waitFor(() => expect(screen.getByText('Faith Bacenta')).toBeInTheDocument());
  });

  it('shows an "Unknown group" fallback when the lookup fails', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    renderWithTheme(<GroupNameText groupId="group-1" />);

    await waitFor(() => expect(screen.getByText('Unknown group')).toBeInTheDocument());
  });
});
