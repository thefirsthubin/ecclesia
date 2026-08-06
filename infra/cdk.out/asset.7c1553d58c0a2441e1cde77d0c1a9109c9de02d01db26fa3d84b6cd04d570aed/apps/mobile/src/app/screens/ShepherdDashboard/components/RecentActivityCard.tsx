import { View } from 'react-native';
import { Badge, EmptyState, Heading, useTheme } from '@ecclesia/ui-native';

import { useRecentlyResolved } from '../hooks/useShepherdDashboardData';
import { CardAsyncBoundary } from './CardAsyncBoundary';
import { PersonNameText } from './PersonNameText';

/** Design System §4.3's Recent activity zone — recently resolved
 * Follow-ups and Silent-Drift flags, composed client-side from data
 * already fetched elsewhere (STEP 5: "no extra network call"). */
export function RecentActivityCard() {
  const theme = useTheme();
  const state = useRecentlyResolved();

  return (
    <CardAsyncBoundary state={state} onRetry={state.refetch} errorTitle="Couldn't load recent activity" skeletonLines={2}>
      {({ followUps, driftFlags }) => {
        const isEmpty = followUps.length === 0 && driftFlags.length === 0;
        return (
          <View style={{ gap: theme.spacing[3] }}>
            <Heading level={3}>Recent activity</Heading>
            {isEmpty ? (
              <EmptyState title="Nothing resolved recently" />
            ) : (
              <View style={{ gap: theme.spacing[2] }}>
                {driftFlags.map((flag) => (
                  <View key={flag.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <PersonNameText personId={flag.personId} />
                    <Badge status="success">Reconnected</Badge>
                  </View>
                ))}
                {followUps.map((task) => (
                  <View key={task.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <PersonNameText personId={task.personId} />
                    <Badge status="success">Follow-up completed</Badge>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      }}
    </CardAsyncBoundary>
  );
}
