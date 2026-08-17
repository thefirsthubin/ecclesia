import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';
import { TopNav } from './TopNav';

function FakeLink({
  to,
  children,
  'aria-current': ariaCurrent,
  onFocus,
  onBlur,
  onMouseEnter,
  onMouseLeave,
  style,
}: {
  to: string;
  children: React.ReactNode;
  'aria-current'?: 'page';
  onFocus?: () => void;
  onBlur?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  style?: { outline: string; textDecoration: string };
}) {
  return (
    <a href={to} aria-current={ariaCurrent} onFocus={onFocus} onBlur={onBlur} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={style}>
      {children}
    </a>
  );
}

const twoItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'home' as const, active: true },
  { label: 'People', href: '/people', icon: 'users' as const, active: false },
];

function renderTopNav(props: Partial<React.ComponentProps<typeof TopNav>> = {}) {
  return render(
    <ThemeProvider>
      <TopNav linkAs={FakeLink} items={twoItems} mobileMenuOpen={false} onOpenMobileMenu={jest.fn()} onCloseMobileMenu={jest.fn()} {...props} />
    </ThemeProvider>,
  );
}

/** Simulates one of `TopNav`'s own two internal breakpoints - mirrors the
 * exact pattern `AppShell.spec.tsx`'s own responsive tests already use for
 * the same real thresholds (`theme.breakpoints.md`/`sm`, 1024/640). */
function mockMatchMedia(matchesSubstring: string | null) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches: matchesSubstring !== null && query.includes(matchesSubstring),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

describe('TopNav', () => {
  it('renders a Primary nav landmark with every item, in the header row by default (desktop)', () => {
    renderTopNav();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
  });

  it('marks the active item with aria-current="page"', () => {
    renderTopNav();
    expect(screen.getByRole('link', { name: /Dashboard/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /People/ })).not.toHaveAttribute('aria-current');
  });

  it('gives the active item a pill-shaped, brand-tinted background and brand-colored label - never a border accent', () => {
    renderTopNav();
    const activePill = screen.getByRole('link', { name: /Dashboard/ }).firstChild;
    expect(activePill).toHaveStyle({ borderRadius: '9999px', backgroundColor: '#EAF4F0' });
    expect(screen.getByText('Dashboard')).toHaveStyle({ color: '#1F6F5B' });

    const inactivePill = screen.getByRole('link', { name: /People/ }).firstChild;
    expect(inactivePill).toHaveStyle({ backgroundColor: 'transparent' });
    expect(screen.getByText('People')).toHaveStyle({ color: '#5B6472' });
  });

  it('shows a hover background on a non-active item, cleared on mouse leave', () => {
    renderTopNav();
    const peopleLink = screen.getByRole('link', { name: /People/ });
    fireEvent.mouseEnter(peopleLink);
    expect(peopleLink.firstChild).toHaveStyle({ backgroundColor: '#F9F8F5' });
    fireEvent.mouseLeave(peopleLink);
    expect(peopleLink.firstChild).toHaveStyle({ backgroundColor: 'transparent' });
  });

  it('shows an on-brand focus outline on only the currently-focused item', () => {
    renderTopNav();
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/ });
    const peopleLink = screen.getByRole('link', { name: /People/ });

    fireEvent.focus(dashboardLink);
    expect(dashboardLink.firstChild).toHaveStyle({ outline: '2px solid #1F6F5B' });
    expect(peopleLink.firstChild).toHaveStyle({ outline: 'none' });

    fireEvent.blur(dashboardLink);
    expect(dashboardLink.firstChild).toHaveStyle({ outline: 'none' });
  });

  it('never underlines a nav link', () => {
    renderTopNav();
    expect(screen.getByRole('link', { name: /Dashboard/ })).toHaveStyle({ textDecoration: 'none' });
  });

  it('renders an "Ecclesia" wordmark linking to homeHref (defaulting to /dashboard)', () => {
    renderTopNav();
    expect(screen.getByRole('link', { name: 'Ecclesia' })).toHaveAttribute('href', '/dashboard');
  });

  it('renders the trailing user/context controls slot', () => {
    renderTopNav({ trailing: <span>User menu</span> });
    expect(screen.getByText('User menu')).toBeInTheDocument();
  });

  it('renders a vertical divider before the first item of a new group, not before every item in it', () => {
    renderTopNav({
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: 'home', active: true },
        { label: 'Configuration', href: '/configuration', icon: 'settings', active: false, group: 'Administration' },
        { label: 'Audit Log', href: '/audit-log', icon: 'history', active: false, group: 'Administration' },
      ],
    });
    expect(screen.getAllByRole('separator')).toHaveLength(1);
  });

  it('lets the header row scroll horizontally rather than break layout when items overflow', () => {
    renderTopNav();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toHaveStyle({ overflowX: 'auto' });
  });

  describe('tablet tier (compact, icon-only)', () => {
    let restore: () => void;
    beforeEach(() => {
      restore = mockMatchMedia('1023'); // matches the md-1 query only, not sm-1
    });
    afterEach(() => restore());

    it('hides text labels but keeps an accessible icon label', () => {
      renderTopNav();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Dashboard' })).toBeInTheDocument();
    });

    it('still renders the Primary nav row directly (not behind the mobile menu)', () => {
      renderTopNav();
      expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Toggle navigation menu' })).not.toBeInTheDocument();
    });
  });

  describe('mobile tier (menu trigger + drawer)', () => {
    let restore: () => void;
    beforeEach(() => {
      restore = mockMatchMedia('639'); // matches both md-1 and sm-1 queries (mobile is compact too)
    });
    afterEach(() => restore());

    it('hides the row and shows a menu trigger instead', () => {
      renderTopNav();
      expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Toggle navigation menu' })).toBeInTheDocument();
    });

    it('calls onOpenMobileMenu when the trigger is clicked', () => {
      const onOpenMobileMenu = jest.fn();
      renderTopNav({ onOpenMobileMenu });
      fireEvent.click(screen.getByRole('button', { name: 'Toggle navigation menu' }));
      expect(onOpenMobileMenu).toHaveBeenCalledTimes(1);
    });

    it('renders every item, labeled, inside the drawer once open', () => {
      renderTopNav({ mobileMenuOpen: true });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('People')).toBeInTheDocument();
    });

    it('renders nothing for the drawer when closed', () => {
      renderTopNav({ mobileMenuOpen: false });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('groups drawer items under one heading before the first item of that group', () => {
      renderTopNav({
        mobileMenuOpen: true,
        items: [
          { label: 'Dashboard', href: '/dashboard', icon: 'home', active: true },
          { label: 'Configuration', href: '/configuration', icon: 'settings', active: false, group: 'Administration' },
          { label: 'Audit Log', href: '/audit-log', icon: 'history', active: false, group: 'Administration' },
        ],
      });
      expect(screen.getAllByText('ADMINISTRATION')).toHaveLength(1);
    });
  });
});
