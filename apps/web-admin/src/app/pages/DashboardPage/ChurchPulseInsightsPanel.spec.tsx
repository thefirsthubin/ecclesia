import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';
import type { PulseScoreResponseDto } from '@ecclesia/contracts';

import { ChurchPulseInsightsPanel } from './ChurchPulseInsightsPanel';
import type { KpiDatum } from './dashboardDemoData';

const pulseScore: PulseScoreResponseDto = {
  id: 'p1',
  branchId: 'branch-1',
  scopeType: 'BRANCH',
  scopeId: 'branch-1',
  score: 74,
  computedAt: new Date().toISOString(),
};

function kpi(overrides: Partial<KpiDatum> = {}): KpiDatum {
  return {
    id: 'attendance',
    label: 'Attendance',
    icon: 'calendar',
    formattedValue: '356',
    trendDirection: 'down',
    trendLabel: '-8% vs. 4 weeks ago',
    actionLabel: 'Review the dip in Bacenta 12',
    actionHref: '/insights',
    ...overrides,
  };
}

/**
 * `[Product Experience Sprint I]` Manually traced against
 * `ChurchPulseInsightsPanel.tsx` - `jest` cannot execute in this sandbox,
 * same disclosed limitation as every other spec in this codebase.
 */
describe('ChurchPulseInsightsPanel', () => {
  it('preserves the same testId and heading text ChurchPulseCard used, for DashboardPage.spec.tsx compatibility', () => {
    render(
      <ThemeProvider>
        <ChurchPulseInsightsPanel status="success" pulseScore={pulseScore} onRetry={jest.fn()} openAlertCount={0} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('church-pulse-card')).toBeInTheDocument();
    expect(screen.getByText('Church Pulse — whole Branch')).toBeInTheDocument();
  });

  it('shows a retryable error state with the same title ChurchPulseCard used', () => {
    const onRetry = jest.fn();
    render(
      <ThemeProvider>
        <ChurchPulseInsightsPanel status="error" onRetry={onRetry} openAlertCount={0} />
      </ThemeProvider>,
    );
    expect(screen.getByText("Couldn't load Church Pulse")).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('surfaces the open-alert count as the insight sentence when alerts exist, even if a KPI is also trending down', () => {
    render(
      <ThemeProvider>
        <ChurchPulseInsightsPanel status="success" pulseScore={pulseScore} onRetry={jest.fn()} openAlertCount={2} kpis={[kpi({ trendDirection: 'down' })]} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('pulse-insight')).toHaveTextContent('2 open pastoral care alerts need review before they age further.');
  });

  it('falls back to a declining KPI\'s own actionLabel when there are no open alerts', () => {
    render(
      <ThemeProvider>
        <ChurchPulseInsightsPanel status="success" pulseScore={pulseScore} onRetry={jest.fn()} openAlertCount={0} kpis={[kpi({ trendDirection: 'down', actionLabel: 'Review the dip in Bacenta 12' })]} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('pulse-insight')).toHaveTextContent('Review the dip in Bacenta 12');
  });

  it('shows a positive reinforcement line when there are no alerts and nothing is trending down', () => {
    render(
      <ThemeProvider>
        <ChurchPulseInsightsPanel status="success" pulseScore={pulseScore} onRetry={jest.fn()} openAlertCount={0} kpis={[kpi({ trendDirection: 'up' })]} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('pulse-insight')).toHaveTextContent('Healthy and holding steady — no urgent follow-up needed today.');
  });

  it('omits the Branch Comparison section entirely when no branches prop is passed', () => {
    render(
      <ThemeProvider>
        <ChurchPulseInsightsPanel status="success" pulseScore={pulseScore} onRetry={jest.fn()} openAlertCount={0} />
      </ThemeProvider>,
    );
    expect(screen.queryByText(/BRANCH COMPARISON/)).not.toBeInTheDocument();
  });

  it('renders the Branch Comparison section when branches are passed', () => {
    render(
      <ThemeProvider>
        <ChurchPulseInsightsPanel
          status="success"
          pulseScore={pulseScore}
          onRetry={jest.fn()}
          openAlertCount={0}
          branches={[{ id: 'branch-2', name: 'River of Life — Kumasi (preview)', pulseScore: 81, memberCount: 310, status: 'thriving' }]}
        />
      </ThemeProvider>,
    );
    expect(screen.getByText('River of Life — Kumasi (preview)')).toBeInTheDocument();
  });
});
