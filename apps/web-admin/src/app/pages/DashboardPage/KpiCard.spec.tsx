import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { RouterProvider } from '../../router/router';
import { KpiCard } from './KpiCard';
import type { KpiDatum } from './dashboardDemoData';

const DATUM: KpiDatum = {
  id: 'attendance',
  label: 'Attendance',
  icon: 'calendar',
  formattedValue: '356',
  trendDirection: 'down',
  trendLabel: '-8% vs. 4 weeks ago',
  actionLabel: 'Review attendance trends in Insights',
  actionHref: '/insights',
};

function renderCard(series?: { label: string; value: number }[]) {
  return render(
    <ThemeProvider>
      <RouterProvider>
        <KpiCard datum={DATUM} series={series} testId="kpi-card-attendance" />
      </RouterProvider>
    </ThemeProvider>,
  );
}

/**
 * `[Dashboard Visual Redesign]` `series` is new, optional, and additive -
 * this pins that the card renders identically (still shows
 * `formattedValue`/`trendLabel`/`actionLabel`) whether or not a real
 * series is passed, and only renders the sparkline when one is.
 */
describe('KpiCard', () => {
  it('renders the KPI value, trend, and action label with no series passed', () => {
    renderCard(undefined);
    expect(screen.getByText('356')).toBeInTheDocument();
    expect(screen.getByText('-8% vs. 4 weeks ago')).toBeInTheDocument();
    expect(screen.getByText('Review attendance trends in Insights')).toBeInTheDocument();
    expect(screen.queryByTestId('kpi-card-attendance-sparkline')).not.toBeInTheDocument();
  });

  it('renders a sparkline when a real series is passed', () => {
    renderCard([
      { label: 'Jan', value: 398 },
      { label: 'Feb', value: 384 },
      { label: 'Mar', value: 372 },
    ]);
    expect(screen.getByTestId('kpi-card-attendance-sparkline')).toBeInTheDocument();
  });

  it('does not render a sparkline for a series with fewer than two points', () => {
    renderCard([{ label: 'Jan', value: 398 }]);
    expect(screen.queryByTestId('kpi-card-attendance-sparkline')).not.toBeInTheDocument();
  });

  /** `[Product Experience Sprint II, Phase 4]` The label previously
   * overlapped the trend text under width pressure (`minWidth: 0` shrinks
   * the box, not the text inside it) - pinned as a real assertion that
   * the label now truncates instead. */
  it('truncates the label instead of letting it overlap the trend text', () => {
    renderCard(undefined);
    const label = screen.getByText('ATTENDANCE');
    expect(label.parentElement).toHaveStyle({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
  });
});
