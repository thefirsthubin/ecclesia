import { Card, Divider, EmptyState, ErrorState, Heading, Icon, SampleDataBadge, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import type { AlertResponseDto } from '@ecclesia/contracts';
import type { IconName } from '@ecclesia/ui-core';

import { DEMO_RECENT_ACTIVITY } from './dashboardDemoData';

export interface RecentActivityTimelineProps {
  status: 'loading' | 'error' | 'success';
  alerts: AlertResponseDto[];
  onRetry: () => void;
}

interface TimelineRow {
  id: string;
  description: string;
  hoursAgo: number;
  icon: IconName;
  isSample: boolean;
}

function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

function hoursAgoLabel(hours: number): string {
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

/**
 * `[Dashboard Redesign sprint]` A dashboard-only timeline, deliberately
 * **not** a restyle of the shared `RecentActivityCard.tsx` - that
 * component is also rendered by `InsightsPage.tsx`/`ClusterInsightsView.tsx`
 * (`grep` confirmed both import it directly), and blending in
 * `DEMO_RECENT_ACTIVITY` there would put fabricated demo content on a
 * screen this sprint didn't touch and that has nothing to do with the
 * dashboard redesign brief. This is a new, separate component instead -
 * `RecentActivityCard.tsx` itself is completely unmodified by this sprint
 * and still renders real-data-only for Insights.
 *
 * Real resolved alerts (same `OPEN`-excluded/`resolvedAt`-sorted logic
 * `RecentActivityCard` already established) are merged with
 * `DEMO_RECENT_ACTIVITY` and re-sorted by recency, so a Branch with real
 * resolved alerts still sees them alongside the richer demo activity types
 * (visitor intake, giving, staffing) no backend endpoint provides yet.
 *
 * `[UX Design Implementation]` Final UX Design Specification §8/§17
 * (decision 4) - this is the one screen where real and sample rows are
 * genuinely interleaved row-by-row (every other demo section on this
 * Dashboard is either fully real or fully sample), so it gets the
 * per-row `SampleDataBadge` treatment the spec calls out as the most
 * severe case, rather than one section-level badge that would
 * mischaracterize the real rows sitting right next to it.
 */
export function RecentActivityTimeline({ status, alerts, onRetry }: RecentActivityTimelineProps) {
  const theme = useTheme();

  if (status === 'loading') {
    return (
      <Card padding={6} testId="recent-activity-timeline">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <Skeleton height={20} width="40%" />
          <Skeleton height={16} />
          <Skeleton height={16} />
        </div>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card padding={6} testId="recent-activity-timeline">
        <ErrorState title="Couldn't load recent activity" onRetry={onRetry} />
      </Card>
    );
  }

  const resolvedAlertRows: TimelineRow[] = [...alerts]
    .filter((alert) => alert.status !== 'OPEN')
    .map((alert) => {
      const resolvedAt = alert.resolvedAt ?? alert.triggeredAt;
      return {
        id: alert.id,
        description: capitalize(`${alert.alertType.replaceAll('_', ' ').toLowerCase()} — ${alert.status === 'ACTED' ? 'acted on' : 'dismissed'}`),
        hoursAgo: (Date.now() - new Date(resolvedAt).getTime()) / 3_600_000,
        icon: alert.status === 'ACTED' ? 'checkCircle' : 'xCircle',
        isSample: false,
      };
    });

  const demoRows: TimelineRow[] = DEMO_RECENT_ACTIVITY.map((item) => ({
    id: item.id,
    description: item.description,
    hoursAgo: item.hoursAgo,
    icon: item.icon,
    isSample: true,
  }));

  const rows = [...resolvedAlertRows, ...demoRows].sort((a, b) => a.hoursAgo - b.hoursAgo).slice(0, 6);

  return (
    <Card padding={6} testId="recent-activity-timeline">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <Heading level={3}>Recent Activity</Heading>
        {rows.length === 0 ? (
          <EmptyState title="Nothing to show yet" description="Recent activity across the Branch will show up here." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {rows.map((row, index) => (
              <div key={row.id}>
                {index > 0 && <Divider />}
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3], padding: `${theme.spacing[3]}px 0` }}>
                  <Icon
                    name={row.icon}
                    size="sm"
                    color={row.icon === 'checkCircle' ? theme.colors.status.success.strong : theme.colors.text.secondary}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1], flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                      <Text variant="bodySmall" as="span">
                        {row.description}
                      </Text>
                      {row.isSample && <SampleDataBadge testId={`recent-activity-sample-badge-${row.id}`} />}
                    </div>
                    <Text variant="caption" color={theme.colors.text.secondary}>
                      {hoursAgoLabel(row.hoursAgo)}
                    </Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
