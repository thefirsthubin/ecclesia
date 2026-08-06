import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';
import { UserMenu } from './UserMenu';

describe('UserMenu', () => {
  it('is closed by default and opens the menu on click', () => {
    render(
      <ThemeProvider>
        <UserMenu name="Pastor Emmanuel" roleLabel="Resident Pastor" onLogout={jest.fn()} />
      </ThemeProvider>,
    );

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Account menu for Pastor Emmanuel' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Resident Pastor')).toBeInTheDocument();
  });

  it('calls onLogout and closes the menu when Log out is clicked', () => {
    const onLogout = jest.fn();
    render(
      <ThemeProvider>
        <UserMenu name="Pastor Emmanuel" roleLabel="Resident Pastor" onLogout={onLogout} />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Account menu for Pastor Emmanuel' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Log out' }));

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
