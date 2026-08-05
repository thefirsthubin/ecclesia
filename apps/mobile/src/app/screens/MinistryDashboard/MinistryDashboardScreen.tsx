import { ScrollView, View } from 'react-native';
import { Badge, Button, Heading, Text, useTheme } from '@ecclesia/ui-native';

import { useSwitchTab } from '../../navigation/Navigator';
import { CardAsyncBoundary } from '../ShepherdDashboard/components/CardAsyncBoundary';
import { useMinistryEvents, useOvercommitmentFlags, useRoster } from './hooks/useMinistryData';

/**
 * Ministry Leader Dashboard - the milestone brief's first of four tabs
 * for this persona. Composed entirely from `@ecclesia/ui-native`'s
 * existing components (`Badge`, `Button`, `Heading`, `Text`) plus the
 * same `CardAsyncBoundary` screen-local composition the Shepherd
 * Dashboard already established - no new base component, matching that
 * screen's own "no new base component" precedent.
 *
 * Two cards: Roster size (with an overcommitment-flag count, FR-MIN-04)
 * and the next upcoming Ministry Event - both read-only summaries that
 * link to their own full tab (`ministry-roster`/`ministry-events`) via
 * `switchTab` on a `Button variant="tertiary"`, the same "Dashboard
 * summarizes, the tab is where you act" pattern `PriorityCard`'s own
 * "View Follow-up queue" button already uses on the Shepherd Dashboard.
 *
 * `ministry.staffing_target.*` (FR-MIN-02/03) is deliberately not
 * surfaced anywhere in this persona - `StaffingTargetController` only
 * exposes `POST` (create/upsert) and `GET /:id` (single, by an id this
 * app has no way to discover), no list endpoint, so there is no honest
 * way to build a "current target vs actual" card without either
 * guessing an id or adding a backend list endpoint neither this milestone
 * nor the brief asked for. See MOBILE_PERSONAS_DESIGN_NOTES.md.
 */
export function MinistryDashboardScreen() {
  const theme = useTheme();
  const switchTab = useSwitchTab();
  const rosterState = useRoster();
  const overcommitmentState = useOvercommitmentFlags();
  const eventsState = useMinistryEvents();

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
      <Heading level={1}>Ministry Dashboard</Heading>

      <CardAsyncBoundary state={rosterState} onRetry={rosterState.refetch} errorTitle="Couldn't load your roster" skeletonLines={2}>
        {(roster) => (
          <View style={{ gap: theme.spacing[2] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Heading level={3}>Roster</Heading>
              {overcommitmentState.status === 'success' && overcommitmentState.data.length > 0 && (
                <Badge status="warning">{`${overcommitmentState.data.length} overcommitted`}</Badge>
              )}
            </View>
            <Heading level="display">{`${roster.length}`}</Heading>
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              Active members in your Basonta
            </Text>
            <Button variant="tertiary" size="sm" onPress={() => switchTab('ministry-roster')} testId="ministry-dashboard-view-roster">
              View full roster
            </Button>
          </View>
        )}
      </CardAsyncBoundary>

      <CardAsyncBoundary state={eventsState} onRetry={eventsState.refetch} errorTitle="Couldn't load your Events" skeletonLines={2}>
        {(events) => {
          const now = Date.now();
          const next = events.filter((event) => new Date(event.scheduledStart).getTime() >= now).at(0);
          return (
            <View style={{ gap: theme.spacing[2] }}>
              <Heading level={3}>Next Event</Heading>
              {next ? (
                <>
                  <Text variant="body">{next.type}</Text>
                  <Text variant="bodySmall" color={theme.colors.text.secondary}>
                    {new Date(next.scheduledStart).toLocaleString()}
                    {next.venue ? ` · ${next.venue}` : ''}
                  </Text>
                </>
              ) : (
                <Text variant="bodySmall" color={theme.colors.text.secondary}>
                  No upcoming Events scheduled.
                </Text>
              )}
              <Button variant="tertiary" size="sm" onPress={() => switchTab('ministry-events')} testId="ministry-dashboard-view-events">
                View all Events
              </Button>
            </View>
          );
        }}
      </CardAsyncBoundary>
    </ScrollView>
  );
}
