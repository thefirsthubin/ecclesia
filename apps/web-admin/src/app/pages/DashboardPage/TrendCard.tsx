import { BarChart, Card, Heading, LineChart, Text, useTheme } from '@ecclesia/ui-web';

import type { GrowthSeriesPoint } from './dashboardDemoData';

export interface TrendCardProps {
  title: string;
  subtitle?: string;
  series: GrowthSeriesPoint[];
  color: string;
  kind?: 'line' | 'bar';
  formatValue?: (value: number) => string;
  testId?: string;
}

/**
 * `[Remaining Engineering Sprint, Milestone 11]` A single-series trend
 * card - the same `LineChart`/`BarChart` (`ui-web`) `PerformanceChartCard`
 * already uses, without that card's tri-metric switcher (Ministry
 * Attendance, Financial Trends, and Branch Health each need exactly one
 * series, not three to switch between). Shared across the four new
 * persona dashboards rather than each building its own near-identical
 * wrapper.
 */
export function TrendCard({ title, subtitle, series, color, kind = 'line', formatValue, testId }: TrendCardProps) {
  const theme = useTheme();
  return (
    <Card padding={6} testId={testId}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <div>
          <Heading level={3}>{title}</Heading>
          {subtitle && (
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              {subtitle}
            </Text>
          )}
        </div>
        {kind === 'bar' ? (
          <BarChart data={series} height={180} formatValue={formatValue} testId={testId ? `${testId}-chart` : undefined} />
        ) : (
          <LineChart data={series} height={180} color={color} testId={testId ? `${testId}-chart` : undefined} />
        )}
      </div>
    </Card>
  );
}
