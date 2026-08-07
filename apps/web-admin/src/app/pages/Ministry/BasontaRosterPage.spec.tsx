import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { BasontaRosterPage } from './BasontaRosterPage';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Same isolation approach as `PastoralCare/PersonDetailPage.spec.tsx` -
// mocked directly so this test doesn't need a full `RouterProvider`/
// `Routes` tree just to get one param value in.
jest.mock('../../router/router', () => ({
  useParams: () => ({ groupId: 'basonta-1' }),
}));

afterEach(() => jest.clearAllMocks());

describe('BasontaRosterPage', () => {
  it('reads :groupId from the route and fetches that Basonta\'s roster', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    render(
      <ThemeProvider>
        <ToastProvider>
          <BasontaRosterPage />
        </ToastProvider>
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText('No active workers yet')).toBeInTheDocument());
    const calledUrls = fetchMock.mock.calls.map((call) => call[0] as string);
    expect(calledUrls.some((url) => url.includes('/ministry/groups/basonta-1/roster'))).toBe(true);
  });
});
