import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { AttendanceCompletenessBadge } from './AttendanceCompletenessBadge';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

afterEach(() => jest.clearAllMocks());

function renderBadge() {
  return render(
    <ThemeProvider>
      <AttendanceCompletenessBadge gatheringId="g-1" />
    </ThemeProvider>,
  );
}

describe('AttendanceCompletenessBadge', () => {
  it('shows "Attendance missing" when the completeness check reports incomplete', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ incomplete: true, reason: 'FR-GTH-05: past the completeness window' }),
    });

    renderBadge();

    await waitFor(() => expect(screen.getByText('Attendance missing')).toBeInTheDocument());
  });

  it('shows "Attendance recorded" when the completeness check reports complete', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ incomplete: false, reason: 'Attendance has already been recorded for this Gathering' }),
    });

    renderBadge();

    await waitFor(() => expect(screen.getByText('Attendance recorded')).toBeInTheDocument());
  });

  it('renders nothing while loading or on error, rather than a broken badge', () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockReturnValue(new Promise(() => undefined));

    renderBadge();

    expect(screen.queryByText(/Attendance/)).not.toBeInTheDocument();
  });
});
