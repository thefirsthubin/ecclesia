import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { ConfigurationPage } from './ConfigurationPage';

const mockUseAuth = jest.fn();
jest.mock('../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

afterEach(() => jest.clearAllMocks());

describe('ConfigurationPage', () => {
  it('blocks a non-Admin/Council-Overseer role even via direct navigation', () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', actor: { personId: 'p1', role: 'TREASURER', branchId: 'b1' } } });

    render(
      <ThemeProvider>
        <ConfigurationPage />
      </ThemeProvider>,
    );

    expect(screen.getByText("You don't have access to Configuration")).toBeInTheDocument();
  });

  it('allows ADMIN through to the stub', () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', actor: { personId: 'p1', role: 'ADMIN', branchId: 'b1' } } });

    render(
      <ThemeProvider>
        <ConfigurationPage />
      </ThemeProvider>,
    );

    expect(screen.getByText('Configuration — coming soon')).toBeInTheDocument();
  });

  it('allows COUNCIL_OVERSEER through to the stub', () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', actor: { personId: 'p1', role: 'COUNCIL_OVERSEER', branchId: 'b1' } } });

    render(
      <ThemeProvider>
        <ConfigurationPage />
      </ThemeProvider>,
    );

    expect(screen.getByText('Configuration — coming soon')).toBeInTheDocument();
  });
});
