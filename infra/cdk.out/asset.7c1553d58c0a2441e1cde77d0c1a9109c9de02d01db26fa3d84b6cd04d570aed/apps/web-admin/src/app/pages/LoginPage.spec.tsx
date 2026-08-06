import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { LoginPage } from './LoginPage';
import { RouterProvider } from '../router/router';

const mockUseAuth = jest.fn();
jest.mock('../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderLoginPage() {
  return render(
    <ThemeProvider>
      <RouterProvider>
        <LoginPage />
      </RouterProvider>
    </ThemeProvider>,
  );
}

afterEach(() => {
  jest.clearAllMocks();
});

/**
 * Development Authentication sprint (STEP 6). Confirms the two branches
 * `LoginPage`'s own top comment describes are genuinely mutually exclusive
 * at render time, driven entirely by `useAuth().mode` - never a client-side
 * toggle.
 */
describe('LoginPage', () => {
  it('renders the Cognito email/password form when mode is cognito', () => {
    mockUseAuth.mockReturnValue({
      state: { status: 'unauthenticated' },
      mode: 'cognito',
      devUsers: [],
      login: jest.fn(),
      submitMfaCode: jest.fn(),
      loginAsDevUser: jest.fn(),
      logout: jest.fn(),
    });

    renderLoginPage();

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('renders the Cognito form (not the picker) when mode has not resolved yet', () => {
    mockUseAuth.mockReturnValue({
      state: { status: 'restoring' },
      mode: undefined,
      devUsers: [],
      login: jest.fn(),
      submitMfaCode: jest.fn(),
      loginAsDevUser: jest.fn(),
      logout: jest.fn(),
    });

    renderLoginPage();

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('renders the development role picker, no password field, when mode is development', () => {
    mockUseAuth.mockReturnValue({
      state: { status: 'unauthenticated' },
      mode: 'development',
      devUsers: [
        { id: 'dev-resident-pastor', label: 'Resident Pastor', role: 'RESIDENT_PASTOR' },
        { id: 'dev-treasurer', label: 'Treasurer', role: 'TREASURER' },
      ],
      login: jest.fn(),
      submitMfaCode: jest.fn(),
      loginAsDevUser: jest.fn(),
      logout: jest.fn(),
    });

    renderLoginPage();

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getByText('Resident Pastor')).toBeInTheDocument();
    expect(screen.getByText('Treasurer')).toBeInTheDocument();
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  });

  it('calls loginAsDevUser with the selected persona id and no other credentials', async () => {
    const loginAsDevUser = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      state: { status: 'unauthenticated' },
      mode: 'development',
      devUsers: [{ id: 'dev-treasurer', label: 'Treasurer', role: 'TREASURER' }],
      login: jest.fn(),
      submitMfaCode: jest.fn(),
      loginAsDevUser,
      logout: jest.fn(),
    });

    renderLoginPage();
    fireEvent.click(screen.getByLabelText(/Treasurer/));
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(loginAsDevUser).toHaveBeenCalledWith('dev-treasurer'));
  });

  it('shows a helpful message instead of an empty picker when no development users are seeded', () => {
    mockUseAuth.mockReturnValue({
      state: { status: 'unauthenticated' },
      mode: 'development',
      devUsers: [],
      login: jest.fn(),
      submitMfaCode: jest.fn(),
      loginAsDevUser: jest.fn(),
      logout: jest.fn(),
    });

    renderLoginPage();

    expect(screen.getByText(/No development users are seeded yet/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  });
});
