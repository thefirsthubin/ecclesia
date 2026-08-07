import { Card, Heading, Icon, Text, useTheme } from '@ecclesia/ui-web';

import { getTodaysPrayerFocus } from './dashboardDemoData';

/**
 * Prayer Focus card (redesign brief) - an inspirational daily card,
 * deliberately outside Design System v1.0 Part 4's own 5-zone dashboard
 * spec (Priority/Primary-metric/Quick-actions/Recent-activity/
 * Notifications). Part 8.11's tone rule ("plain, respectful, never...
 * marketing flourish") still applies here, applied to devotional content
 * instead of status copy - a single verse and reference, no additional
 * commentary invented on top of it.
 */
export function PrayerFocusCard() {
  const theme = useTheme();
  const focus = getTodaysPrayerFocus();

  return (
    <Card padding={6} testId="prayer-focus-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <Icon name="heart" size="sm" color={theme.colors.brand.default} />
          <Heading level={3}>Today&apos;s Prayer Focus</Heading>
        </div>
        <Text variant="body" color={theme.colors.text.primary}>
          {`"${focus.text}"`}
        </Text>
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {focus.verse}
        </Text>
      </div>
    </Card>
  );
}
