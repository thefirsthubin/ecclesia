import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders the title as an h1 and an optional real context line', () => {
    render(<PageHeader title="Gatherings" context="Headquarters · Jun 22 – Sep 14" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Gatherings' })).toBeInTheDocument();
    expect(screen.getByText('Headquarters · Jun 22 – Sep 14')).toBeInTheDocument();
  });

  it('omits the context line entirely when none is given, rather than an empty paragraph', () => {
    render(<PageHeader title="Insights" />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.queryByText('·')).not.toBeInTheDocument();
  });

  it('renders the action slot', () => {
    render(<PageHeader title="Finance" action={<button>Export</button>} />);
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });
});
