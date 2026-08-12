import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';
import { Sidebar } from './Sidebar';

function FakeLink({
  to,
  children,
  'aria-current': ariaCurrent,
  onFocus,
  onBlur,
}: {
  to: string;
  children: React.ReactNode;
  'aria-current'?: 'page';
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  return (
    <a href={to} aria-current={ariaCurrent} onFocus={onFocus} onBlur={onBlur}>
      {children}
    </a>
  );
}

describe('Sidebar', () => {
  it('renders a Primary nav landmark with every item', () => {
    render(
      <ThemeProvider>
        <Sidebar
          linkAs={FakeLink}
          items={[
            { label: 'Dashboard', href: '/dashboard', icon: 'home', active: true },
            { label: 'People', href: '/people', icon: 'users', active: false },
          ]}
        />
      </ThemeProvider>,
    );

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
  });

  it('marks the active item with aria-current="page"', () => {
    render(
      <ThemeProvider>
        <Sidebar
          linkAs={FakeLink}
          items={[
            { label: 'Dashboard', href: '/dashboard', icon: 'home', active: true },
            { label: 'People', href: '/people', icon: 'users', active: false },
          ]}
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole('link', { name: /Dashboard/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /People/ })).not.toHaveAttribute('aria-current');
  });

  it('hides text labels but keeps an accessible icon label when collapsed', () => {
    render(
      <ThemeProvider>
        <Sidebar
          collapsed
          linkAs={FakeLink}
          items={[{ label: 'Dashboard', href: '/dashboard', icon: 'home', active: true }]}
        />
      </ThemeProvider>,
    );

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Dashboard' })).toBeInTheDocument();
  });

  /** `[UX Design Implementation]` Final UX Design Specification §12. */
  it('renders a group label once before the first item of a new group, not before every item in it', () => {
    render(
      <ThemeProvider>
        <Sidebar
          linkAs={FakeLink}
          items={[
            { label: 'Dashboard', href: '/dashboard', icon: 'home', active: true },
            { label: 'Configuration', href: '/configuration', icon: 'settings', active: false, group: 'Administration' },
            { label: 'Audit Log', href: '/audit-log', icon: 'history', active: false, group: 'Administration' },
          ]}
        />
      </ThemeProvider>,
    );

    expect(screen.getAllByText('ADMINISTRATION')).toHaveLength(1);
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('Audit Log')).toBeInTheDocument();
  });

  /** `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 2 shell verification) - nav links now get the same on-brand
   * focus outline `Button`/`Input` use, not just the browser default. */
  it('shows an on-brand focus outline on the item currently focused, and only that item', () => {
    render(
      <ThemeProvider>
        <Sidebar
          linkAs={FakeLink}
          items={[
            { label: 'Dashboard', href: '/dashboard', icon: 'home', active: true },
            { label: 'People', href: '/people', icon: 'users', active: false },
          ]}
        />
      </ThemeProvider>,
    );

    const dashboardLink = screen.getByRole('link', { name: /Dashboard/ });
    const peopleLink = screen.getByRole('link', { name: /People/ });

    fireEvent.focus(dashboardLink);
    expect(dashboardLink.firstChild).toHaveStyle({ outline: '2px solid #1F6F5B' });
    expect(peopleLink.firstChild).toHaveStyle({ outline: 'none' });

    fireEvent.blur(dashboardLink);
    expect(dashboardLink.firstChild).toHaveStyle({ outline: 'none' });
  });

  /** `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 2 shell verification) - `text.disabled` on `surface.raised`
   * measures 2.59:1 (computed, not asserted here directly), well under
   * WCAG AA's 4.5:1 floor. Pins the fix (`text.secondary`, 5.98:1) so a
   * future edit can't silently regress back to the failing color. */
  it('renders the group label at a WCAG AA-passing color (text.secondary, not text.disabled)', () => {
    render(
      <ThemeProvider>
        <Sidebar
          linkAs={FakeLink}
          items={[
            { label: 'Dashboard', href: '/dashboard', icon: 'home', active: true },
            { label: 'Configuration', href: '/configuration', icon: 'settings', active: false, group: 'Administration' },
          ]}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('ADMINISTRATION')).toHaveStyle({ color: '#5B6472' });
  });

  it('renders no group label at all when no item declares a group', () => {
    render(
      <ThemeProvider>
        <Sidebar
          linkAs={FakeLink}
          items={[{ label: 'Dashboard', href: '/dashboard', icon: 'home', active: true }]}
        />
      </ThemeProvider>,
    );

    expect(screen.queryByText('ADMINISTRATION')).not.toBeInTheDocument();
  });
});
