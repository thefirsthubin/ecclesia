import { Avatar, Card, Heading, Text, useTheme } from '@ecclesia/ui-web';

import type { BacentaLeaderboardEntry } from './dashboardDemoData';

export interface BacentaLeaderboardCardProps {
  entries: BacentaLeaderboardEntry[];
}

/** `[Reference-image iteration]` Maps to the reference's "Friends Score" card - see `dashboardDemoData.ts`'s own doc comment on why this is a per-Bacenta ranking built from demo data, not a real endpoint. */
export function BacentaLeaderboardCard({ entries }: BacentaLeaderboardCardProps) {
  const theme = useTheme();

  return (
    <Card padding={6} testId="bacenta-leaderboard-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <div>
          <Heading level={3}>Bacenta Leaderboard</Heading>
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            Engagement this month, whole Branch
          </Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
          {entries.map((entry) => (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
              <Avatar name={entry.leaderName} size="sm" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1], flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: theme.spacing[2] }}>
                  <Text variant="bodySmall" as="span">
                    {`${entry.bacentaName} · ${entry.leaderName}`}
                  </Text>
                  <Text variant="label" color={theme.colors.text.secondary}>
                    {`${entry.engagementPercent}%`}
                  </Text>
                </div>
                <div style={{ height: 6, borderRadius: theme.radius.full, backgroundColor: theme.colors.border.subtle, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${entry.engagementPercent}%`,
                      borderRadius: theme.radius.full,
                      backgroundColor: theme.colors.brand.default,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
