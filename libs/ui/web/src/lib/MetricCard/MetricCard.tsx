import type { ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Card } from '../Card';
import { Heading } from '../Heading';
import { Text } from '../Text';

export interface MetricCardProps {
  label: string;
  /** The metric's real value, pre-formatted by the caller (currency,
   * count, percentage, etc.) - this component never formats a number
   * itself, so it never has an opinion about currency/locale it might
   * get wrong. `null` renders the same em-dash glyph this codebase
   * already uses for "genuinely not recorded" (see
   * `AttendanceCountCell`/`BranchPastorDashboard`'s own `'—'` precedent)
   * - never a fabricated `0`. */
  value: string | null;
  /** `[Milestone D — Portal Experiences]` Always required, never optional -
   * "every metric must carry a clear time/context label" is a hard rule
   * for this redesign, not a nice-to-have; e.g. "This week", "Week of Aug
   * 17 – Aug 23", "Branch-wide". */
  context: string;
  /** `attention` tints the value the same warning color `HealthStatement`
   * uses for a genuinely missing/negative fact - never a fourth tone. */
  tone?: 'neutral' | 'attention';
  trailing?: ReactNode;
  testId?: string;
}

/**
 * `[Milestone D — Portal Experiences]` A single labeled real number with
 * its own time/context caption - the shared tile Branch Treasurer's
 * giving breakdown (and every other portal's own metric strip) composes
 * from, rather than each portal hand-rolling its own KPI tile shape.
 * Deliberately simpler than the older `KpiCard` (`apps/web-admin`'s
 * dashboard-only component): no forced navigation, no forced trend
 * arrow/sparkline, no `KpiDatum` coupling - `KpiCard` stays exactly as it
 * is for the dashboards still built around it; this is the plain,
 * portable version for every new metric that doesn't have those extra
 * facts (a real navigation target, a real trend series) to show. Static,
 * not `interactive` - a caller wanting a clickable metric wraps its own
 * `Card interactive` instead of this component growing an `onClick` prop
 * for a use case it doesn't have yet.
 */
export function MetricCard({ label, value, context, tone = 'neutral', trailing, testId }: MetricCardProps) {
  const theme = useTheme();
  return (
    <Card padding={4} testId={testId}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
          <Text variant="label" color={theme.colors.text.secondary} as="span">
            {label.toUpperCase()}
          </Text>
          {trailing}
        </div>
        <Heading level={2} color={tone === 'attention' ? theme.colors.status.warning.strong : undefined}>
          {value ?? '—'}
        </Heading>
        <Text variant="caption" color={theme.colors.text.secondary}>
          {context}
        </Text>
      </div>
    </Card>
  );
}
