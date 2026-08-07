import { useState } from 'react';
import { BarChart, Card, Heading, LineChart, Text, useTheme } from '@ecclesia/ui-web';

import type { GrowthSeriesPoint } from './dashboardDemoData';

export interface PerformanceChartCardProps {
  attendance: GrowthSeriesPoint[];
  membership: GrowthSeriesPoint[];
  giving: GrowthSeriesPoint[];
}

type Metric = 'attendance' | 'membership' | 'giving';

const formatGhs = (value: number) => `GHS ${value.toLocaleString()}`;

/**
 * `[Dashboard Redesign sprint, reference-image iteration]` The hero
 * "Performance Chart" card - one large panel with a legend that doubles
 * as a metric switcher and a floating trend callout, echoing the
 * reference image's centerpiece card. `BarChart`/`LineChart` (`ui-web`)
 * are unmodified and only ever render one series each - the reference's
 * true overlaid multi-line look isn't something those components support,
 * and extending them to do so is a shared-component change well outside
 * a UI-only dashboard sprint. This gets the same *effect* (compare
 * Attendance/Membership/Giving trends in one place) via a legend that
 * switches which single series is displayed, rather than by overlaying
 * three series that would visually collide anyway (attendance in the
 * hundreds, giving in the tens of thousands - one shared y-axis would
 * flatten two of the three lines to nothing).
 */
export function PerformanceChartCard({ attendance, membership, giving }: PerformanceChartCardProps) {
  const theme = useTheme();
  const [metric, setMetric] = useState<Metric>('attendance');

  const series = { attendance, membership, giving }[metric];
  const color = { attendance: theme.colors.brand.default, membership: theme.colors.churchPulse.healthy, giving: theme.colors.status.warning.strong }[metric];
  const first = series[0]?.value ?? 0;
  const last = series[series.length - 1]?.value ?? 0;
  const pctChange = first === 0 ? 0 : Math.round(((last - first) / first) * 100);
  const latestLabel = metric === 'giving' ? formatGhs(last) : `${last}`;

  return (
    <Card padding={6} testId="performance-chart-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: theme.spacing[3] }}>
          <div>
            <Heading level={3}>Performance Chart</Heading>
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              Track results and watch your Branch rise
            </Text>
          </div>

          <div style={{ display: 'flex', gap: theme.spacing[1] }} role="group" aria-label="Choose a metric">
            {(
              [
                { key: 'attendance' as const, label: 'Attendance', dot: theme.colors.brand.default },
                { key: 'membership' as const, label: 'Membership', dot: theme.colors.churchPulse.healthy },
                { key: 'giving' as const, label: 'Giving', dot: theme.colors.status.warning.strong },
              ]
            ).map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={metric === option.key}
                onClick={() => setMetric(option.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing[1],
                  padding: `${theme.spacing[1]}px ${theme.spacing[3]}px`,
                  borderRadius: theme.radius.full,
                  border: `1px solid ${metric === option.key ? option.dot : theme.colors.border.subtle}`,
                  backgroundColor: metric === option.key ? theme.colors.brand.subtle : 'transparent',
                  cursor: 'pointer',
                  fontFamily: theme.fontFamily.base,
                  fontSize: theme.typography.caption.fontSize,
                  color: theme.colors.text.primary,
                }}
              >
                <span aria-hidden style={{ width: 8, height: 8, borderRadius: theme.radius.full, backgroundColor: option.dot }} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: theme.spacing[2],
              left: theme.spacing[2],
              zIndex: 1,
              padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.brand.subtle,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Heading level={3} color={theme.colors.brand.default}>
              {`${pctChange >= 0 ? '+' : ''}${pctChange}%`}
            </Heading>
            <Text variant="caption" color={theme.colors.text.secondary}>
              {`Latest: ${latestLabel}`}
            </Text>
          </div>

          {metric === 'giving' ? (
            <BarChart data={series} height={220} formatValue={formatGhs} testId="performance-chart" />
          ) : (
            <LineChart data={series} height={220} color={color} testId="performance-chart" />
          )}
        </div>
      </div>
    </Card>
  );
}
