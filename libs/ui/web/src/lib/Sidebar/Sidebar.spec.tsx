import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';
import { Sidebar } from './Sidebar';

function FakeLink({ to, children, 'aria-current': ariaCurrent }: { to: string; children: React.ReactNode; 'aria-current'?: 'page' }) {
  return (
    <a href={to} aria-current={ariaCurrent}>
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
});
