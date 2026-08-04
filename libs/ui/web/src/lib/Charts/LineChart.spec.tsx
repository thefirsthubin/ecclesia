import { render, screen } from '@testing-library/react';
import { LineChart } from './LineChart';

const DATA = [
  { label: 'Jan', value: 62 },
  { label: 'Jun', value: 78 },
];

describe('LineChart', () => {
  it('renders an svg with role="img" and a summarizing aria-label', () => {
    render(<LineChart data={DATA} testId="pulse-trend" />);
    const chart = screen.getByTestId('pulse-trend');
    expect(chart).toHaveAttribute('role', 'img');
    expect(chart).toHaveAttribute('aria-label', 'Line chart from Jan: 62 to Jun: 78, trending up');
  });

  it('renders one point per datum', () => {
    render(<LineChart data={DATA} testId="pulse-trend" />);
    expect(screen.getByTestId('pulse-trend').querySelectorAll('circle')).toHaveLength(2);
  });
});
