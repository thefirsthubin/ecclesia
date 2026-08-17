import { render, screen } from '@testing-library/react';
import { HealthStatement } from './HealthStatement';

describe('HealthStatement', () => {
  it('renders the headline at the display heading level and the real statement beside it', () => {
    render(<HealthStatement headline="8 Bacentas" statement="3 need attention this week." />);
    expect(screen.getByRole('heading', { name: '8 Bacentas' })).toBeInTheDocument();
    expect(screen.getByText('3 need attention this week.')).toBeInTheDocument();
  });

  it('renders a sparkline only when real multi-point trend data is supplied', () => {
    const { rerender } = render(<HealthStatement headline="35" statement="Sunday attendance this week." testId="health" />);
    expect(document.querySelector('[data-testid="health"] svg')).not.toBeInTheDocument();

    rerender(
      <HealthStatement
        headline="35"
        statement="Sunday attendance this week."
        trend={[
          { label: 'Jul', value: 30 },
          { label: 'Aug', value: 35 },
        ]}
        testId="health"
      />,
    );
    expect(document.querySelector('[data-testid="health"] svg')).toBeInTheDocument();
  });

  it('renders the trailing slot', () => {
    render(<HealthStatement headline="GHS 524" statement="Verified giving this month." trailing={<span>View Finance</span>} />);
    expect(screen.getByText('View Finance')).toBeInTheDocument();
  });
});
