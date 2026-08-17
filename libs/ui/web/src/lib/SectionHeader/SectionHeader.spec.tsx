import { render, screen } from '@testing-library/react';
import { SectionHeader } from './SectionHeader';

describe('SectionHeader', () => {
  it('renders the title as an h3, an optional description, and an action slot', () => {
    render(<SectionHeader title="Bacenta Health" description="Current Church Pulse score, strongest first" action={<span>3</span>} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Bacenta Health' })).toBeInTheDocument();
    expect(screen.getByText('Current Church Pulse score, strongest first')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
