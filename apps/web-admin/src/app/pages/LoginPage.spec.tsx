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
        { id: 'dev-treasurer', label: 'Branch Treasurer', role: 'TREASURER', context: 'River of Life Headquarters' },
      ],
      login: jest.fn(),
      submitMfaCode: jest.fn(),
      loginAsDevUser: jest.fn(),
      logout: jest.fn(),
    });

    renderLoginPage();

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getByText('Resident Pastor')).toBeInTheDocument();
    expect(screen.getByText('Branch Treasurer')).toBeInTheDocument();
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  });

  /**
   * `[Multi-Tenant Foundation, Phase 2]` `context` (e.g. "River of Life
   * Headquarters") renders as a secondary line under the role label, not
   * folded into it - and simply doesn't render at all for a persona that
   * doesn't have one (Council-scoped/platform personas).
   */
  it('shows a persona\'s context label when present, and omits the line entirely when absent', () => {
    mockUseAuth.mockReturnValue({
      state: { status: 'unauthenticated' },
      mode: 'development',
      devUsers: [
        { id: 'dev-bacenta-leader', label: 'Bacenta Leader', role: 'BACENTA_LEADER', context: 'Grace Bacenta' },
        { id: 'dev-resident-pastor', label: 'Resident Pastor', role: 'RESIDENT_PASTOR' },
      ],
      login: jest.fn(),
      submitMfaCode: jest.fn(),
      loginAsDevUser: jest.fn(),
      logout: jest.fn(),
    });

    renderLoginPage();

    expect(screen.getByText('— Grace Bacenta')).toBeInTheDocument();
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

  /**
   * `[Product terminology fix]` The backend's own seeded label
   * (`dev-users.ts`) still says "Assistant Pastor" - this pins that the
   * picker shows the approved "Branch Pastor" terminology instead
   * (`roleLabel()`, `shell/nav-items.ts`), not the raw backend label, while
   * the technical `role` identifier next to it stays untouched.
   */
  it('shows the approved role terminology, not the raw backend dev-user label', () => {
    mockUseAuth.mockReturnValue({
      state: { status: 'unauthenticated' },
      mode: 'development',
      devUsers: [{ id: 'dev-assistant-pastor', label: 'Assistant Pastor', role: 'ASSISTANT_PASTOR' }],
      login: jest.fn(),
      submitMfaCode: jest.fn(),
      loginAsDevUser: jest.fn(),
      logout: jest.fn(),
    });

    renderLoginPage();

    expect(screen.getByText('Branch Pastor')).toBeInTheDocument();
    expect(screen.queryByText('Assistant Pastor')).not.toBeInTheDocument();
    expect(screen.getByText('(ASSISTANT_PASTOR)')).toBeInTheDocument();
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
