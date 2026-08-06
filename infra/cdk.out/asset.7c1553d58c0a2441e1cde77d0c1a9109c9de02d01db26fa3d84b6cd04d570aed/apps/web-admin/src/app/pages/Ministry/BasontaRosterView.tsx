import { Badge, Card, Divider, EmptyState, ErrorState, Heading, Skeleton, Text, useTheme } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { PersonNameText } from '../PastoralCare/PersonNameText';
import { useOvercommitmentFlags, useRoster } from './useMinistryData';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/**
 * PRD §16.3's "Basonta roster view" (FR-MIN-01) and its overcommitment
 * flag (FR-MIN-04), read together on one Card - `RosterService` already
 * computes both from the same active-membership set server-side, so there
 * is no reason to split them into two page sections. See
 * `MINISTRY_PAGE_DESIGN_NOTES.md` for why Staffing Target adequacy is not
 * shown here too.
 *
 * A pure presentational component (no router dependency) so
 * `MinistryPage` can render it directly for a Basonta Leader's own
 * `groupId` without a route round-trip, and `BasontaRosterPage` can render
 * it for whichever `:groupId` the directory linked to - same
 * view-component/route-wrapper split `PersonDetailPage`'s siblings use.
 */
export function BasontaRosterView({ groupId }: { groupId: string }) {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;

  const rosterState = useRoster(accessToken, groupId);
  const overcommitmentState = useOvercommitmentFlags(accessToken, groupId);

  const overcommittedIds = new Set(
    overcommitmentState.status === 'success' ? overcommitmentState.data.map((flag) => flag.personId) : [],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4], maxWidth: 640 }}>
      <Heading level={1}>Basonta roster</Heading>

      {rosterState.status === 'loading' && (
        <Card padding={6}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>
        </Card>
      )}

      {rosterState.status === 'error' && (
        <Card padding={6}>
          <ErrorState title="Couldn't load the roster" onRetry={rosterState.refetch} />
        </Card>
      )}

      {rosterState.status === 'success' && (
        <Card padding={6} testId="basonta-roster-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            {rosterState.data.length === 0 ? (
              <EmptyState title="No active workers yet" description="No one is currently rostered on this Basonta." />
            ) : (
              rosterState.data.map((member, index) => (
                <div key={member.personId}>
                  {index > 0 && <Divider />}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: theme.spacing[3],
                      paddingTop: index > 0 ? theme.spacing[3] : 0,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                      <PersonNameText personId={member.personId} />
                      <Text variant="caption" color={theme.colors.text.secondary}>
                        {`Serving since ${formatDate(member.startedAt)}`}
                      </Text>
                    </div>
                    {overcommittedIds.has(member.personId) && <Badge status="warning">Overcommitted</Badge>}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
