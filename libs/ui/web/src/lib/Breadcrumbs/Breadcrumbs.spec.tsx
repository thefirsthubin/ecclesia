import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';
import { Breadcrumbs } from './Breadcrumbs';

function FakeLink({
  to,
  children,
  style,
  onFocus,
  onBlur,
  onMouseEnter,
  onMouseLeave,
}: {
  to: string;
  children: React.ReactNode;
  style?: { textDecoration: string; outline: string };
  onFocus?: () => void;
  onBlur?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <a href={to} style={style} onFocus={onFocus} onBlur={onBlur} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {children}
    </a>
  );
}

describe('Breadcrumbs', () => {
  it('renders every item and links every item except the last', () => {
    render(
      <ThemeProvider>
        <Breadcrumbs linkAs={FakeLink} items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Bacenta 12' }]} />
      </ThemeProvider>,
    );

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Bacenta 12' })).not.toBeInTheDocument();
    expect(screen.getByText('Bacenta 12')).toHaveAttribute('aria-current', 'page');
  });

  /** `[Sidebar underline fix]` Same root cause and same fix as `Sidebar`'s
   * own nav links - the browser's default `<a>` underline was never
   * overridden. */
  it('never underlines a breadcrumb link', () => {
    render(
      <ThemeProvider>
        <Breadcrumbs linkAs={FakeLink} items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Bacenta 12' }]} />
      </ThemeProvider>,
    );

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveStyle({ textDecoration: 'none' });
  });

  /** `[Product Experience Sprint II, Phase 3]` Breadcrumb links previously
   * had no hover/focus feedback at all - pinned as real assertions. */
  it('darkens text on hover and clears it on mouse leave', () => {
    render(
      <ThemeProvider>
        <Breadcrumbs linkAs={FakeLink} items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Bacenta 12' }]} />
      </ThemeProvider>,
    );

    const link = screen.getByRole('link', { name: 'Dashboard' });
    expect(link.firstChild).toHaveStyle({ color: '#5B6472' });
    fireEvent.mouseEnter(link);
    expect(link.firstChild).toHaveStyle({ color: '#172026' });
    fireEvent.mouseLeave(link);
    expect(link.firstChild).toHaveStyle({ color: '#5B6472' });
  });

  it('shows an on-brand focus outline on keyboard focus, cleared on blur', () => {
    render(
      <ThemeProvider>
        <Breadcrumbs linkAs={FakeLink} items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Bacenta 12' }]} />
      </ThemeProvider>,
    );

    const link = screen.getByRole('link', { name: 'Dashboard' });
    fireEvent.focus(link);
    expect(link).toHaveStyle({ outline: '2px solid #1F6F5B' });
    fireEvent.blur(link);
    expect(link).toHaveStyle({ outline: 'none' });
  });
});
