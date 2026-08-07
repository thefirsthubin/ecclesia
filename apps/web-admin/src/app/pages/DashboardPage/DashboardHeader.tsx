import { Badge, Heading, Icon, Text, useTheme } from '@ecclesia/ui-web';

import { DEMO_CHURCH_NAME } from './dashboardDemoData';

export interface DashboardHeaderProps {
  /** Falls back to the role label while the Person lookup is still in flight - same pattern `AppShell`'s `UserMenu` already establishes for this exact "no name on `/auth/me`" gap. */
  displayName: string;
  openAlertCount: number;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Header zone (redesign brief) - personalized greeting, current date,
 * church name, and a notification glance.
 *
 * `[Reference-image iteration]` No longer renders its own `Avatar` - the
 * dashboard now runs in `AppShell`'s `navVariant="pill"` mode
 * (`PillNav.tsx`), whose right slot already shows `UserMenu`'s own
 * avatar. A second, larger avatar here would just be the same person
 * rendered twice a few pixels apart. The functional notification control
 * (inbox, resolve, etc.) also stays exactly where it already lives -
 * `PillNav`'s `NotificationBell` - so the badge below is a plain-text
 * glance only, not a second competing bell.
 */
export function DashboardHeader({ displayName, openAlertCount }: DashboardHeaderProps) {
  const theme = useTheme();
  const now = new Date();
  const greeting = greetingForHour(now.getHours());
  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing[4],
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
        <Heading level={1}>{`${greeting}, ${displayName.split(' ')[0]}`}</Heading>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            {dateLabel}
          </Text>
          <Icon name="church" size="sm" color={theme.colors.text.secondary} />
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            {DEMO_CHURCH_NAME}
          </Text>
        </div>
      </div>

      {openAlertCount > 0 && (
        <Badge status="warning" testId="dashboard-header-alert-glance">
          <Icon name="bell" size="sm" color="currentColor" aria-label={`${openAlertCount} open alert${openAlertCount === 1 ? '' : 's'}`} />
          {`${openAlertCount} need${openAlertCount === 1 ? 's' : ''} attention`}
        </Badge>
      )}
    </div>
  );
}
