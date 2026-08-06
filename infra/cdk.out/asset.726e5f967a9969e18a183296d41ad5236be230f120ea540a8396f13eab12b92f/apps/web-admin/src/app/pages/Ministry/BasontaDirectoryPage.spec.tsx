import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { RouterProvider } from '../../router/router';
import { BasontaDirectoryPage } from './BasontaDirectoryPage';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function group(overrides: Record<string, unknown> = {}) {
  return {
    id: 'group-1',
    branchId: 'branch-1',
    type: 'MINISTRY',
    name: 'Media Basonta',
    meetingSchedule: null,
    meetingLocation: null,
    category: 'Technical',
    lifecycleStatus: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <ThemeProvider>
      <RouterProvider>
        <BasontaDirectoryPage />
      </RouterProvider>
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('BasontaDirectoryPage', () => {
  it('fetches GET /groups?type=MINISTRY and renders each Basonta', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [group()] });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByText('Media Basonta')).toBeInTheDocument());
    expect(screen.getByText('Technical')).toBeInTheDocument();
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/groups?type=MINISTRY');
  });

  it('shows an empty state when no Basontas exist yet', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No Basontas yet')).toBeInTheDocument());
  });

  it('shows a retryable error state when the directory request fails (e.g. an Assistant Pastor\'s structural 403)', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load the Basonta directory")).toBeInTheDocument());
  });
});
