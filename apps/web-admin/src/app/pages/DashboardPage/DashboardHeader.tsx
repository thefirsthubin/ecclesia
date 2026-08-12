import { Badge, Heading, Icon, Text, useTheme } from '@ecclesia/ui-web';

export interface DashboardHeaderProps {
  /** Falls back to the role label while the Person lookup is still in flight - same pattern `AppShell`'s `UserMenu` already establishes for this exact "no name on `/auth/me`" gap. */
  displayName: string;
  openAlertCount: number;
  /** `[Release 1 blocker fix]` The actor's real `Branch.name`, now part of
   * `GET /auth/me`'s own response (`ActorContextResponseDto.branchName`)
   * - no separate fetch needed, unlike `displayName` above. Replaces the
   * previous hardcoded `DEMO_CHURCH_NAME` placeholder. */
  branchName: string;
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
 * `[UX Design Implementation]` Does not render its own `Avatar` -
 * `AppShell`'s shared top bar (every route, including Dashboard, since
 * the pill-nav variant was retired - Final UX Design Specification §12)
 * already shows `UserMenu`'s own avatar in its identity slot. A second,
 * larger avatar here would just be the same person rendered twice a few
 * pixels apart. The functional notification control (inbox, resolve,
 * etc.) also stays exactly where it already lives - `AppShell`'s
 * `NotificationBell`, in that same identity slot - so the badge below is
 * a plain-text glance only, not a second competing bell.
 */
export function DashboardHeader({ displayName, openAlertCount, branchName }: DashboardHeaderProps) {
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
            {branchName}
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
