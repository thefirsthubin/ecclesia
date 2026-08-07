import type { CSSProperties } from 'react';
import { BarChart, Card, Heading, LineChart, Text, useTheme } from '@ecclesia/ui-web';

import type { GrowthSeriesPoint } from './dashboardDemoData';

export interface ChurchGrowthChartsProps {
  attendance: GrowthSeriesPoint[];
  membership: GrowthSeriesPoint[];
  giving: GrowthSeriesPoint[];
  /** Stacks to a single column below the `sm` breakpoint - computed once by the parent (`useDashboardBreakpoint`), not re-derived per chart. */
  isNarrow: boolean;
}

const formatGhs = (value: number) => `GHS ${value.toLocaleString()}`;

/**
 * Church Growth section (redesign brief) - three six-month trend panels.
 * Attendance/Membership use `LineChart` (the shape of change over time is
 * the point); Giving uses `BarChart` with a currency formatter (comparing
 * discrete monthly totals reads more naturally as bars) - both components
 * are `ui-web`'s existing, unmodified Charts (`BarChart`/`LineChart`),
 * reused exactly as `Charts.tsx`'s own API already supports, not extended.
 */
export function ChurchGrowthCharts({ attendance, membership, giving, isNarrow }: ChurchGrowthChartsProps) {
  const theme = useTheme();

  const panelStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isNarrow ? '1fr' : 'repeat(3, 1fr)',
    gap: theme.spacing[4],
  };

  return (
    <Card padding={6} testId="church-growth-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <div>
          <Heading level={3}>Church Growth</Heading>
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            Trailing six months, whole Branch
          </Text>
        </div>
        <div style={panelStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
            <Text variant="label" color={theme.colors.text.secondary}>
              ATTENDANCE
            </Text>
            <LineChart data={attendance} height={140} testId="growth-chart-attendance" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
            <Text variant="label" color={theme.colors.text.secondary}>
              MEMBERSHIP
            </Text>
            <LineChart data={membership} height={140} color={theme.colors.churchPulse.healthy} testId="growth-chart-membership" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
            <Text variant="label" color={theme.colors.text.secondary}>
              GIVING
            </Text>
            <BarChart data={giving} height={140} formatValue={formatGhs} testId="growth-chart-giving" />
          </div>
        </div>
      </div>
    </Card>
  );
}
