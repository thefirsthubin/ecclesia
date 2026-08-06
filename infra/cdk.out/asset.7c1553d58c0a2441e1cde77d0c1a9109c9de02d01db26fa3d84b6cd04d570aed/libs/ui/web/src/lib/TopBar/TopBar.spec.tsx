import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('renders as a header landmark with left/right content', () => {
    render(
      <ThemeProvider>
        <TopBar left={<span>Dashboard</span>} right={<span>Account</span>} />
      </ThemeProvider>,
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('only renders the sidebar toggle button when onToggleSidebar is provided', () => {
    const { rerender } = render(
      <ThemeProvider>
        <TopBar />
      </ThemeProvider>,
    );
    expect(screen.queryByRole('button', { name: 'Toggle navigation menu' })).not.toBeInTheDocument();

    const onToggleSidebar = jest.fn();
    rerender(
      <ThemeProvider>
        <TopBar onToggleSidebar={onToggleSidebar} />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Toggle navigation menu' }));
    expect(onToggleSidebar).toHaveBeenCalledTimes(1);
  });
});
