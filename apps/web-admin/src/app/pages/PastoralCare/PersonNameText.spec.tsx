import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { PersonNameText } from './PersonNameText';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

afterEach(() => jest.clearAllMocks());

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('PersonNameText', () => {
  it('resolves a personId into its display name via GET /people/:id', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'person-1',
        branchId: 'branch-1',
        firstName: 'Kofi',
        lastName: 'Mensah',
        phone: null,
        email: null,
        dateOfBirth: null,
        address: null,
        lifecycleStage: 'MEMBER',
        guardianPersonId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });

    renderWithTheme(<PersonNameText personId="person-1" />);

    await waitFor(() => expect(screen.getByText('Kofi Mensah')).toBeInTheDocument());
  });

  it('shows an "Unknown person" fallback when the lookup fails', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    renderWithTheme(<PersonNameText personId="person-1" />);

    await waitFor(() => expect(screen.getByText('Unknown person')).toBeInTheDocument());
  });
});
