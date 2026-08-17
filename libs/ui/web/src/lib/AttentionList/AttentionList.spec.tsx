import { render, screen } from '@testing-library/react';
import { AttentionList } from './AttentionList';

describe('AttentionList', () => {
  it('renders each item\'s label (uppercased) and description', () => {
    render(
      <AttentionList
        items={[
          { id: '1', label: 'Grace Bacenta', description: 'Meeting attendance missing.' },
          { id: '2', label: 'Branch-wide', description: 'Sunday attendance not recorded for this week yet.' },
        ]}
        emptyState={{ title: 'Nothing needs attention' }}
      />,
    );
    expect(screen.getByText('GRACE BACENTA')).toBeInTheDocument();
    expect(screen.getByText('Meeting attendance missing.')).toBeInTheDocument();
    expect(screen.getByText('BRANCH-WIDE')).toBeInTheDocument();
  });

  it('renders each item\'s action', () => {
    render(
      <AttentionList
        items={[{ id: '1', label: 'Grace Bacenta', description: 'An alert.', action: <button>Resolve</button> }]}
        emptyState={{ title: 'Nothing needs attention' }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Resolve' })).toBeInTheDocument();
  });

  it('shows a positive-tone empty state, not a blank list, when there are no items', () => {
    render(<AttentionList items={[]} emptyState={{ title: 'Nothing needs attention', description: 'All clear.' }} />);
    expect(screen.getByRole('heading', { name: 'Nothing needs attention' })).toBeInTheDocument();
    expect(screen.getByText('All clear.')).toBeInTheDocument();
  });
});
