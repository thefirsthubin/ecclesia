import { Card, Heading, Icon, Text, useTheme } from '@ecclesia/ui-web';

import { useNavigate } from '../../router/router';
import type { KpiDatum } from './dashboardDemoData';

export interface KpiCardProps {
  datum: KpiDatum;
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
 */
export function KpiCard({ datum, testId }: KpiCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Card interactive onClick={() => navigate(datum.actionHref)} padding={5} testId={testId}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.brand.subtle,
            }}
          >
            <Icon name={datum.icon} size="md" color={theme.colors.brand.default} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
            <Icon name={TREND_ICON[datum.trendDirection]} size="sm" color={theme.colors.text.secondary} />
            <Text variant="caption" color={theme.colors.text.secondary}>
              {datum.trendLabel}
            </Text>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
          <Text variant="label" color={theme.colors.text.secondary}>
            {datum.label.toUpperCase()}
          </Text>
          <Heading level={3}>{datum.formattedValue}</Heading>
        </div>

        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {datum.actionLabel}
        </Text>
      </div>
    </Card>
  );
}
