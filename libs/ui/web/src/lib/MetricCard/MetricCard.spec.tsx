import { render, screen } from '@testing-library/react';
import { MetricCard } from './MetricCard';

describe('[Milestone D] MetricCard', () => {
  it('renders the label, value, and context', () => {
    render(<MetricCard label="Branch Tithes" value="GHS 4,200.00" context="Week of Aug 17 – Aug 23" />);
    expect(screen.getByText('BRANCH TITHES')).toBeInTheDocument();
    expect(screen.getByText('GHS 4,200.00')).toBeInTheDocument();
    expect(screen.getByText('Week of Aug 17 – Aug 23')).toBeInTheDocument();
  });

  it('renders an em-dash for a null value rather than a fabricated 0', () => {
    render(<MetricCard label="Basonta Giving" value={null} context="This week" />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('is never rendered as an interactive/clickable element', () => {
    render(<MetricCard label="Branch Offerings" value="GHS 100.00" context="This week" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders optional trailing content beside the label', () => {
    render(<MetricCard label="Branch Tithes" value="GHS 1.00" context="This week" trailing={<span>badge</span>} />);
    expect(screen.getByText('badge')).toBeInTheDocument();
  });
});
