import { useState } from 'react';
import { Badge, Button, Card, Divider, EmptyState, ErrorState, Heading, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import type { AlertResponseDto } from '@ecclesia/contracts';

import { apiPatch } from '../../lib/api-client';

export interface AlertPriorityCardProps {
  status: 'loading' | 'error' | 'success';
  alerts: AlertResponseDto[];
  accessToken: string | undefined;
  onResolved: () => void;
  onRetry: () => void;
  /** `[Design Decision, Insights Web Admin sprint]` Defaults to `false`
   * (unchanged behavior for `ResidentPastorDashboard`'s existing usage).
   * Insights' Admin view passes `true`: `permission-matrix.ts` grants
   * ADMIN `insights.alert.read` but not `insights.alert.resolve` (PRD
   * §17.3's Insights row shows Admin "R" only) - rendering a Resolve
   * button Admin cannot actually use would be a false affordance, not a
   * gap to let the backend 403 away (see
   * `INSIGHTS_PAGE_DESIGN_NOTES.md`). */
  readOnly?: boolean;
}

/**
 * Priority zone (Design System §4.2/§4.3, Resident Pastor row): "Top
 * alerts across all clusters, ranked by severity/trend decline." No
 * severity field exists on `AlertResponseDto` — sorted `triggeredAt`
 * descending instead (`[Design Decision]`, see
 * `APPLICATION_SHELL_DESIGN_NOTES.md` §5).
 *
 * Quick action: **Resolve** (`PATCH /insights/alerts/:id/resolve`, an
 * endpoint that already exists). The spec's "forward to Assistant Pastor"
 * action has no backing endpoint anywhere in `apps/api` and is
 * deliberately not built here — see the same design-notes section.
 */
export function AlertPriorityCard({ status, alerts, accessToken, onResolved, onRetry, readOnly = false }: AlertPriorityCardProps) {
  const theme = useTheme();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  if (status === 'loading') {
    return (
      <Card padding={6}>
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
      <Card padding={6}>
        <ErrorState title="Couldn't load alerts" onRetry={onRetry} />
      </Card>
    );
  }

  const openAlerts = [...alerts]
    .filter((alert) => alert.status === 'OPEN')
    .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());

  const resolve = async (alertId: string) => {
    setResolvingId(alertId);
    try {
      await apiPatch(`/insights/alerts/${alertId}/resolve`, { status: 'ACTED' }, { authToken: accessToken });
      onResolved();
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Card padding={6} testId="priority-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        <Heading level={3}>Needs your attention</Heading>
        {openAlerts.length === 0 ? (
          <EmptyState icon="checkCircle" title="No open alerts" description="Every alert across the Branch has been handled." tone="positive" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            {openAlerts.map((alert, index) => (
              <div key={alert.id}>
                {index > 0 && <Divider />}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[3], paddingTop: index > 0 ? theme.spacing[3] : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                    <Badge status="warning">{alert.alertType}</Badge>
                    <Text variant="bodySmall" color={theme.colors.text.secondary}>
                      {alert.message ?? 'No further detail recorded.'}
                    </Text>
                  </div>
                  {readOnly ? (
                    <Badge status="neutral">Read only</Badge>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={resolvingId === alert.id}
                      onClick={() => void resolve(alert.id)}
                      accessibilityLabel={`Resolve alert: ${alert.alertType}`}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
