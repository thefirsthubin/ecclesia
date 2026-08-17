import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { PerformanceChartCard } from './PerformanceChartCard';

const attendance = [
  { label: 'Jan', value: 398 },
  { label: 'Jun', value: 356 },
];
const membership = [
  { label: 'Jan', value: 451 },
  { label: 'Jun', value: 482 },
];
const giving = [
  { label: 'Jan', value: 19800 },
  { label: 'Jun', value: 24500 },
];

/**
 * `[Dashboard Visual Redesign, second pass]` `PerformanceChartCard` had
 * no spec before this pass gave it a second call site
 * (`ResidentPastorDashboard`'s "secondary visualization" area, alongside
 * its existing `BranchTrendsSection.tsx`/Insights usage, both fed by the
 * same real `growthSeriesFromSummary` output). Pins the metric-switcher
 * behavior since it's now doing real work on two screens, not one.
 */
describe('PerformanceChartCard', () => {
  it('renders the Attendance series by default as a line chart', () => {
    render(
      <ThemeProvider>
        <PerformanceChartCard attendance={attendance} membership={membership} giving={giving} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('performance-chart')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Attendance/, pressed: true })).toBeInTheDocument();
  });

  it('switches to the Giving series (rendered as a bar chart) when selected', () => {
    render(
      <ThemeProvider>
        <PerformanceChartCard attendance={attendance} membership={membership} giving={giving} />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Giving/ }));
    expect(screen.getByRole('button', { name: /Giving/, pressed: true })).toBeInTheDocument();
    expect(screen.getByText('GHS 24,500')).toBeInTheDocument();
  });

  it('switches to the Membership series when selected', () => {
    render(
      <ThemeProvider>
        <PerformanceChartCard attendance={attendance} membership={membership} giving={giving} />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Membership/ }));
    expect(screen.getByRole('button', { name: /Membership/, pressed: true })).toBeInTheDocument();
    expect(screen.getByText('Latest: 482')).toBeInTheDocument();
  });
});
