import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the title as a heading', () => {
    render(<EmptyState title="No follow-ups yet" />);
    expect(screen.getByRole('heading', { name: 'No follow-ups yet' })).toBeInTheDocument();
  });

  it('renders an optional description and action', () => {
    render(
      <EmptyState
        title="Nothing needs your attention today"
        description="Every follow-up is on track."
        tone="positive"
        action={<button>Refresh</button>}
      />,
    );
    expect(screen.getByText('Every follow-up is on track.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });
});
