import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';
import type { PulseScoreResponseDto } from '@ecclesia/contracts';

import { BranchComparisonCard, ChurchPulseInsightsPanel } from './ChurchPulseInsightsPanel';
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

  /**
   * `[Dashboard Visual Redesign]` The score ring is decorative - the real
   * score/band are already real text (`Heading`/`Badge`) right beside it -
   * so this pins that the gauge itself stays out of the accessibility
   * tree rather than duplicating that information into a second
   * `aria-label`.
   */
  it('renders the score gauge as a decorative, aria-hidden svg', () => {
    const { container } = render(
      <ThemeProvider>
        <ChurchPulseInsightsPanel status="success" pulseScore={pulseScore} onRetry={jest.fn()} openAlertCount={0} />
      </ThemeProvider>,
    );
    const svg = container.querySelector('svg[aria-hidden]');
    expect(svg).not.toBeNull();
    expect(svg?.querySelectorAll('circle')).toHaveLength(2);
  });

  /**
   * `[Dashboard Visual Redesign, second pass]` Branch Comparison moved
   * out of this component into its own `BranchComparisonCard` (see the
   * describe block below) - this component no longer has a `branches`
   * prop at all, so there is nothing to omit/render conditionally here
   * anymore. This pins that the "what's contributing" chip row (the
   * panel's own real sub-metric data, restyled) still renders in its
   * place.
   */
  it('renders a contributing-factors chip for each available real/demo sub-metric', () => {
    render(
      <ThemeProvider>
        <ChurchPulseInsightsPanel status="success" pulseScore={pulseScore} onRetry={jest.fn()} openAlertCount={1} kpis={[kpi({ id: 'attendance', trendDirection: 'down' })]} />
      </ThemeProvider>,
    );
    expect(screen.getByText("WHAT'S CONTRIBUTING")).toBeInTheDocument();
    expect(screen.getByTestId('pulse-submetric-alerts')).toHaveTextContent('1');
    expect(screen.getByTestId('pulse-submetric-attendance')).toHaveTextContent('356');
  });
});

/**
 * `[Dashboard Visual Redesign, second pass]` Extracted from
 * `ChurchPulseInsightsPanel` into its own sibling card - same
 * `DEMO_COUNCIL_BRANCHES`-shaped data and disclosure, only the placement
 * changed (now a standalone card next to the Church Pulse hero, not a
 * subsection nested inside it).
 */
describe('BranchComparisonCard', () => {
  it('renders a labeled, sample-badged row for every branch passed', () => {
    render(
      <ThemeProvider>
        <BranchComparisonCard branches={[{ id: 'branch-2', name: 'River of Life — Kumasi (preview)', pulseScore: 81, memberCount: 310, status: 'thriving' }]} />
      </ThemeProvider>,
    );
    expect(screen.getByText('BRANCH COMPARISON')).toBeInTheDocument();
    expect(screen.getByTestId('branch-comparison-sample-badge')).toBeInTheDocument();
    expect(screen.getByText('River of Life — Kumasi (preview)')).toBeInTheDocument();
    expect(screen.getByText('81')).toBeInTheDocument();
    expect(screen.getByText('310 members')).toBeInTheDocument();
  });
});
