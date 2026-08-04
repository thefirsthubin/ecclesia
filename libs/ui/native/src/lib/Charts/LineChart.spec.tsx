import { render, screen } from '@testing-library/react-native';
import { LineChart } from './LineChart';

const DATA = [
  { label: 'Jan', value: 62 },
  { label: 'Jun', value: 78 },
];

describe('LineChart', () => {
  it('exposes a summarizing accessibilityLabel', () => {
    render(<LineChart data={DATA} testId="pulse-trend" />);
    expect(screen.getByLabelText('Line chart from Jan: 62 to Jun: 78, trending up')).toBeTruthy();
  });

  it('renders with the given testId', () => {
    render(<LineChart data={DATA} testId="pulse-trend" />);
    expect(screen.getByTestId('pulse-trend')).toBeTruthy();
  });
});
