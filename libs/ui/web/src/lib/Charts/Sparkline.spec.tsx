import { render, screen } from '@testing-library/react';
import { Sparkline } from './Sparkline';

const DATA = [
  { label: 'Jan', value: 62 },
  { label: 'Feb', value: 70 },
  { label: 'Mar', value: 78 },
];

describe('Sparkline', () => {
  it('renders a decorative svg with one polyline through every point', () => {
    render(<Sparkline data={DATA} testId="attendance-sparkline" />);
    const svg = screen.getByTestId('attendance-sparkline');
    expect(svg).toHaveAttribute('aria-hidden');
    expect(svg.querySelectorAll('polyline')).toHaveLength(1);
  });

  it('renders nothing for fewer than two points', () => {
    render(<Sparkline data={[{ label: 'Jan', value: 62 }]} testId="single-point" />);
    expect(screen.queryByTestId('single-point')).not.toBeInTheDocument();
  });

  it('renders nothing for an empty series', () => {
    render(<Sparkline data={[]} testId="empty" />);
    expect(screen.queryByTestId('empty')).not.toBeInTheDocument();
  });
});
