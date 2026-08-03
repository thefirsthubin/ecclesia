import { Card, Divider, EmptyState, ErrorState, Heading, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import type { AlertResponseDto } from '@ecclesia/contracts';

export interface RecentActivityCardProps {
  status: 'loading' | 'error' | 'success';
  alerts: AlertResponseDto[];
  onRetry: () => void;
}

/**
 * Recent activity zone (Design System §4.3, Resident Pastor row):
 * "Appointment-relevant history surfaced contextually (not a full feed)."
 * No dedicated activity-feed endpoint exists — derived from the same
 * `branch-dashboard` alerts payload's resolved entries, same precedent as
 * the Priority zone deriving from its `OPEN` subset.
 */
export function RecentActivityCard({ status, alerts, onRetry }: RecentActivityCardProps) {
  const theme = useTheme();

  if (status === 'loading') {
    return (
      <Card padding={6}>
        <Skeleton height={20} width="40%" />
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card padding={6}>
        <ErrorState title="Couldn't load recent activity" onRetry={onRetry} />
      </Card>
    );
  }

  const resolved = [...alerts]
    .filter((alert) => alert.status !== 'OPEN')
    .sort((a, b) => new Date(b.resolvedAt ?? b.triggeredAt).getTime() - new Date(a.resolvedAt ?? a.triggeredAt).getTime())
    .slice(0, 5);

  return (
    <Card padding={6} testId="recent-activity-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        <Heading level={3}>Recent activity</Heading>
        {resolved.length === 0 ? (
          <EmptyState title="Nothing resolved recently" description="Resolved alerts will show up here." />
        ) : (
          resolved.map((alert, index) => (
            <div key={alert.id}>
              {index > 0 && <Divider />}
              <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0 }}>
                <Text variant="bodySmall">{alert.alertType}</Text>
                <Text variant="caption" color={theme.colors.text.secondary}>
                  {alert.status === 'ACTED' ? 'Acted on' : 'Dismissed'}
                  {alert.resolvedAt ? ` · ${new Date(alert.resolvedAt).toLocaleDateString()}` : ''}
                </Text>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
