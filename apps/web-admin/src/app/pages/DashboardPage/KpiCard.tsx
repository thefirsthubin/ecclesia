import { Card, Heading, Icon, Sparkline, Text, useTheme } from '@ecclesia/ui-web';

import { useNavigate } from '../../router/router';
import type { GrowthSeriesPoint, KpiDatum } from './dashboardDemoData';

export interface KpiCardProps {
  datum: KpiDatum;
  /** `[Dashboard Visual Redesign]` The same 6-month series
   * `growthSeriesFromSummary` already computes from real
   * `BranchDashboardSummaryResponseDto` data for Insights' own
   * `PerformanceChartCard` - optional because not every `KpiDatum` has a
   * matching real series (Volunteers has none today), and demo-sourced
   * `KpiCard` usages elsewhere pass nothing rather than fabricate one. */
  series?: GrowthSeriesPoint[];
  testId?: string;
}

const TREND_ICON = { up: 'trendingUp', down: 'trendingDown', flat: 'arrowRight' } as const;

/**
 * One KPI zone card (Members/Attendance/Giving/Volunteers - redesign
 * brief). Design System v1.0 Part 4's "no card without an implied next
 * action" rule is why every card is a real navigation target
 * (`Card interactive`, not a static tile) and always renders
 * `datum.actionLabel` - a plain count alone (e.g. bare "Attendance: 356")
 * is exactly the "stats-first" pattern Part 4 calls out as the incumbent
 * pattern this product replaces, so this card never renders one without
 * its trend + action line directly beneath it.
 *
 * Trend color intentionally does not follow the five-color status system
 * (`Badge`'s "never reused for anything except status meaning" rule) -
 * up/down here means "more/less than before", not "good/bad" (an
 * attendance dip is worth reviewing, not a status failure) - so trend
 * icons use `text.secondary`, with direction conveyed by icon shape +
 * text together, never color alone (Design System v1.0 Part 5.10's
 * "never convey meaning by color alone").
 *
 * `[Dashboard Visual Redesign, second pass]` Compacted from a tall
 * vertical stack (icon row / label+value block / action sentence, each
 * its own full-height section) into a tighter 3-row card - a smaller
 * icon well, value and sparkline sharing one baseline-aligned row, and
 * the action sentence clipped to one line with `title` carrying the full
 * text for anyone who needs it (still real DOM text, so still
 * screen-reader accessible in full - only the *visual* line is
 * truncated). Four of these now sit in a compact strip rather than four
 * tall single-column cards, per the "compact and visually balanced KPI
 * row" brief.
 *
 * `[Third visual redesign pass]` Value bumped to `heading2` (was
 * `heading3`) and the sparkline shrunk to a fixed 64x24 - "the number
 * should dominate, supporting trend information should be secondary"
 * (brief). The sparkline stays, but as a small supporting mark next to a
 * now-larger number, not competing with it for visual weight.
 *
 * `[Product Experience Sprint II, Phase 4]` Fixed a real overflow bug
 * found during this sprint's own required-breakpoint pass (visible even
 * at 1280px, not just mobile): the label/trend header row relied on
 * `minWidth: 0` alone to let the label shrink under a long trend string,
 * but `minWidth: 0` only permits a flex item's *box* to shrink - it does
 * nothing to the text inside, which then rendered past the shrunk box's
 * edge and visually overlapped the trend text next to it. The label is
 * now wrapped in the same `overflow: hidden; textOverflow: ellipsis;
 * whiteSpace: nowrap` pattern this card's own action-label footer already
 * used correctly one section down - proven in this exact file, just not
 * applied consistently before now.
 */
export function KpiCard({ datum, series, testId }: KpiCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Card interactive onClick={() => navigate(datum.actionHref)} padding={4} testId={testId}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                flexShrink: 0,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.brand.subtle,
              }}
            >
              <Icon name={datum.icon} size="sm" color={theme.colors.brand.default} />
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
              <Text variant="label" color={theme.colors.text.secondary} as="span">
                {datum.label.toUpperCase()}
              </Text>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1], flexShrink: 0, whiteSpace: 'nowrap' }}>
            <Icon name={TREND_ICON[datum.trendDirection]} size="sm" color={theme.colors.text.secondary} />
            <Text variant="caption" color={theme.colors.text.secondary} as="span">
              {datum.trendLabel}
            </Text>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: theme.spacing[2] }}>
          <Heading level={2}>{datum.formattedValue}</Heading>
          {series && series.length >= 2 && <Sparkline data={series} width={64} height={24} testId={testId ? `${testId}-sparkline` : undefined} />}
        </div>

        <div title={datum.actionLabel} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            {datum.actionLabel}
          </Text>
        </div>
      </div>
    </Card>
  );
}
