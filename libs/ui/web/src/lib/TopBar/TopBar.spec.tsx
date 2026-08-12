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

  /** `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 2 shell verification) - on-brand focus outline, matching
   * `Sidebar`'s nav links and `Button`. */
  it('shows an on-brand focus outline on the sidebar toggle button', () => {
    render(
      <ThemeProvider>
        <TopBar onToggleSidebar={jest.fn()} />
      </ThemeProvider>,
    );

    const toggle = screen.getByRole('button', { name: 'Toggle navigation menu' });
    fireEvent.focus(toggle);
    expect(toggle).toHaveStyle({ outline: '2px solid #1F6F5B' });

    fireEvent.blur(toggle);
    expect(toggle).toHaveStyle({ outline: 'none' });
  });
});
