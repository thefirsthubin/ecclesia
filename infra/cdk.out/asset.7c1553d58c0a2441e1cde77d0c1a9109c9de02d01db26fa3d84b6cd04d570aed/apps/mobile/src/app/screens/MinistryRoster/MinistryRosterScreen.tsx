import { ScrollView, View } from 'react-native';
import { Badge, Divider, EmptyState, ErrorState, Heading, Skeleton, Text, useTheme } from '@ecclesia/ui-native';

import { useMinistrySession } from '../../lib/session';
import { usePersonNameByToken } from '../../lib/usePersonName';
import { useOvercommitmentFlags, useRoster } from '../MinistryDashboard/hooks/useMinistryData';

function RosterRow({ personId, authToken, overcommitted }: { personId: string; authToken: string; overcommitted: boolean }) {
  const theme = useTheme();
  const nameState = usePersonNameByToken(personId, authToken);
  return (
    <View style={{ gap: theme.spacing[1] }} testID={`ministry-roster-row-${personId}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {nameState.status === 'success' ? (
          <Text variant="body">{`${nameState.data.firstName} ${nameState.data.lastName}`}</Text>
        ) : (
          <Skeleton height={18} width="50%" />
        )}
        {overcommitted && <Badge status="warning">Overcommitted</Badge>}
      </View>
    </View>
  );
}

/**
 * Ministry Leader Roster — FR-MIN-01/§16.3's "Basonta roster view" and
 * FR-MIN-04's overcommitment flag, both already-existing read endpoints
 * (`RosterController`, unmodified by this sprint — see
 * `MOBILE_PERSONAS_DESIGN_NOTES.md`). Read-only, matching
 * `ministry.roster.read`'s own scope — adding/removing a roster member is
 * a `people.group_membership.update` action this screen deliberately does
 * not surface (see the design notes for why: no dedicated
 * add/remove-member UI exists anywhere in this app yet, on any persona,
 * to model this screen's own affordance after, and inventing one from
 * scratch is out of this milestone's named scope — Dashboard/Roster/
 * Events/Profile, not roster editing).
 */
export function MinistryRosterScreen() {
  const theme = useTheme();
  const session = useMinistrySession();
  const rosterState = useRoster();
  const overcommitmentState = useOvercommitmentFlags();

  const overcommittedIds = new Set(overcommitmentState.status === 'success' ? overcommitmentState.data.map((flag) => flag.personId) : []);

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
      <Heading level={1}>Roster</Heading>

      {rosterState.status === 'loading' && (
        <View style={{ gap: theme.spacing[3] }}>
          <Skeleton height={40} radius="md" />
          <Skeleton height={40} radius="md" />
          <Skeleton height={40} radius="md" />
        </View>
      )}

      {rosterState.status === 'error' && (
        <ErrorState title="Couldn't load your roster" description={rosterState.error.message} onRetry={rosterState.refetch} testId="ministry-roster-error" />
      )}

      {rosterState.status === 'success' &&
        (rosterState.data.length === 0 ? (
          <EmptyState icon="users" title="No roster members yet" description="No one is currently active in your Basonta." />
        ) : (
          <View style={{ gap: theme.spacing[3] }}>
            {rosterState.data.map((member, index) => (
              <View key={member.personId}>
                {index > 0 && <Divider />}
                <View style={{ paddingTop: index > 0 ? theme.spacing[3] : 0 }}>
                  <RosterRow personId={member.personId} authToken={session.authToken} overcommitted={overcommittedIds.has(member.personId)} />
                </View>
              </View>
            ))}
          </View>
        ))}
    </ScrollView>
  );
}
