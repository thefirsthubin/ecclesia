import { render, screen } from '@testing-library/react-native';
import { BarChart } from './BarChart';

const DATA = [
  { label: 'Jan', value: 62 },
  { label: 'Feb', value: 78 },
];

describe('BarChart', () => {
  it('renders each value as visible text', () => {
    render(<BarChart data={DATA} />);
    expect(screen.getByText('62')).toBeTruthy();
    expect(screen.getByText('78')).toBeTruthy();
  });

  it('renders each label', () => {
    render(<BarChart data={DATA} />);
    expect(screen.getByText('Jan')).toBeTruthy();
    expect(screen.getByText('Feb')).toBeTruthy();
  });

  it('formats values with a custom formatter', () => {
    render(<BarChart data={DATA} formatValue={(v) => `GHS ${v}`} />);
    expect(screen.getByText('GHS 62')).toBeTruthy();
  });
});
