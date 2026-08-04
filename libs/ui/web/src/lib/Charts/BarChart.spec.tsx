import { render, screen } from '@testing-library/react';
import { BarChart } from './BarChart';

const DATA = [
  { label: 'Jan', value: 62 },
  { label: 'Feb', value: 78 },
];

describe('BarChart', () => {
  it('renders each value as visible, readable text', () => {
    render(<BarChart data={DATA} />);
    expect(screen.getByText('62')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
  });

  it('renders each label', () => {
    render(<BarChart data={DATA} />);
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Feb')).toBeInTheDocument();
  });

  it('formats values with a custom formatter', () => {
    render(<BarChart data={DATA} formatValue={(v) => `GHS ${v}`} />);
    expect(screen.getByText('GHS 62')).toBeInTheDocument();
  });
});
