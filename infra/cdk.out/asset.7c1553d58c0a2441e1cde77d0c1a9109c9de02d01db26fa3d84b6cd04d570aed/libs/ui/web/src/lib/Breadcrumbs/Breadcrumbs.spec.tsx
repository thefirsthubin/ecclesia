import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';
import { Breadcrumbs } from './Breadcrumbs';

function FakeLink({ to, children }: { to: string; children: React.ReactNode }) {
  return <a href={to}>{children}</a>;
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
});
