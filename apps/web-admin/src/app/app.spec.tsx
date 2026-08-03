import { render, screen, waitFor } from '@testing-library/react';

import { App } from './app';

// Full end-to-end auth (Cognito + `/auth/me`) is covered by
// `auth/AuthContext.spec.tsx` and `auth/cognito-client.spec.ts`. This test
// only exercises routing/redirect behaviour, so `useAuth` is mocked
// directly to each state under test rather than driving it through a real
// login flow here too.
const mockUseAuth = jest.fn();
jest.mock('./auth/AuthContext', () => {
  const actual = jest.requireActual('./auth/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

beforeEach(() => {
  window.history.pushState({}, '', '/');
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('App', () => {
  it('redirects to the login page when unauthenticated', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'unauthenticated' }, login: jest.fn(), submitMfaCode: jest.fn(), logout: jest.fn() });

    render(<App />);

    await waitFor(() => expect(screen.getByText('Sign in to the Admin Console.')).toBeInTheDocument());
  });

  it('shows a restoring indicator while the session is being restored', () => {
    mockUseAuth.mockReturnValue({ state: { status: 'restoring' }, login: jest.fn(), submitMfaCode: jest.fn(), logout: jest.fn() });

    render(<App />);

    expect(screen.getByText('Restoring your session…')).toBeInTheDocument();
  });

  it('redirects an authenticated visitor at "/" to the Resident Pastor dashboard, inside the application shell', async () => {
    mockUseAuth.mockReturnValue({
      state: {
        status: 'authenticated',
        accessToken: 'token',
        actor: { personId: 'person-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' },
      },
      login: jest.fn(),
      submitMfaCode: jest.fn(),
      logout: jest.fn(),
    });
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    render(<App />);

    // The shell's own nav (Sidebar) renders even before dashboard data
    // resolves - proves this is the real application shell, not the old
    // UI Foundation showcase.
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /Dashboard/ })).toBeInTheDocument();
    expect(screen.queryByText(/UI Foundation showcase/i)).not.toBeInTheDocument();
  });
});
