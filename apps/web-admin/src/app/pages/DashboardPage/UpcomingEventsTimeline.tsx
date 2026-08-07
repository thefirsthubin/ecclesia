import { Card, Divider, Heading, Icon, Text, useTheme } from '@ecclesia/ui-web';

import type { UpcomingEventDatum } from './dashboardDemoData';

export interface UpcomingEventsTimelineProps {
  events: UpcomingEventDatum[];
}

function resolveDateLabel(daysFromNow: number): string {
  if (daysFromNow === 0) return 'Today';
  if (daysFromNow === 1) return 'Tomorrow';
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Upcoming Events zone (redesign brief) - a timeline layout, demo data (`dashboardDemoData.ts` - no events endpoint exists to read real ones from). */
export function UpcomingEventsTimeline({ events }: UpcomingEventsTimelineProps) {
  const theme = useTheme();

  return (
    <Card padding={6} testId="upcoming-events-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <Heading level={3}>Upcoming Events</Heading>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {events.map((event, index) => (
            <div key={event.id}>
              {index > 0 && <Divider />}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing[3],
                  padding: `${theme.spacing[3]}px 0`,
                }}
              >
                <div
                  aria-hidden
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    borderRadius: theme.radius.full,
                    backgroundColor: theme.colors.brand.subtle,
                  }}
                >
                  <Icon name={event.icon} size="sm" color={theme.colors.brand.default} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1], flex: 1, minWidth: 0 }}>
                  <Text variant="body" as="span">
                    {event.title}
                  </Text>
                  <Text variant="caption" color={theme.colors.text.secondary}>
                    {`${resolveDateLabel(event.daysFromNow)} · ${event.time} · ${event.location}`}
                  </Text>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
