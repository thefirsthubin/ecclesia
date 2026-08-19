import { useState } from 'react';
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, Heading, Icon, PageHeader, SectionHeader, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import type { PersonResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { Link } from '../../router/router';
import { LIFECYCLE_BADGE_STATUS, LIFECYCLE_LABEL } from './lifecycleLabels';
import { NewPersonForm } from './NewPersonForm';
import type { BacentaDirectoryCard } from './usePeopleDirectory';
import { usePeopleDirectory } from './usePeopleDirectory';

function PersonRow({ person }: { person: PersonResponseDto }) {
  const theme = useTheme();
  return (
    <Link to={`/people/${person.id}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[3], padding: `${theme.spacing[2]}px 0` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
          <Avatar name={`${person.firstName} ${person.lastName}`} size="sm" />
          <Text variant="bodySmall" as="span">{`${person.firstName} ${person.lastName}`}</Text>
        </div>
        <Badge status={LIFECYCLE_BADGE_STATUS[person.lifecycleStage]}>{LIFECYCLE_LABEL[person.lifecycleStage]}</Badge>
      </div>
    </Link>
  );
}

function PersonListCard({ title, description, icon, people, emptyDescription }: {
  title: string;
  description: string;
  icon: 'userPlus' | 'user' | 'users';
  people: PersonResponseDto[];
  emptyDescription: string;
}) {
  const theme = useTheme();
  return (
    <Card padding={4} testId={`people-directory-${title.toLowerCase().replace(/\s+/g, '-')}-card`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        <SectionHeader title={title} description={description} action={<Badge status="info">{people.length}</Badge>} />
        {people.length === 0 ? (
          <EmptyState icon={icon} title="None right now" description={emptyDescription} tone="positive" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {people.slice(0, 8).map((person, index) => (
              <div key={person.id} style={{ borderTop: index === 0 ? 'none' : `1px solid ${theme.colors.border.subtle}` }}>
                <PersonRow person={person} />
              </div>
            ))}
          </div>
        )}
        {people.length > 8 && (
          <Text variant="caption" color={theme.colors.text.secondary}>{`+ ${people.length - 8} more`}</Text>
        )}
      </div>
    </Card>
  );
}

function BacentaCard({ card, isSelected, onSelect }: { card: BacentaDirectoryCard; isSelected: boolean; onSelect: () => void }) {
  const theme = useTheme();
  return (
    <Card padding={4} interactive onClick={onSelect} testId={`bacenta-card-${card.group.id}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <Icon name="building" size="sm" color={theme.colors.brand.default} />
          <Heading level={3}>{card.group.name}</Heading>
        </div>
        <Text variant="bodySmall" color={theme.colors.text.secondary}>{`${card.members.length} member${card.members.length === 1 ? '' : 's'}`}</Text>
        {card.group.meetingSchedule && (
          <Text variant="caption" color={theme.colors.text.secondary}>{card.group.meetingSchedule}</Text>
        )}
        {isSelected && <Badge status="info">Viewing roster</Badge>}
      </div>
    </Card>
  );
}

/**
 * `[Milestone D — Portal Experiences]` Portal 2 (Branch Administrator) /
 * Portal 5 (Resident Pastor) People page: "This page should be visually
 * strong. Show Bacenta cards / groups... People should be organized
 * primarily by Bacenta." Shared by both roles (`PeopleDirectoryWorkspace`
 * wraps this + the profile `Drawer`, the exact same composition
 * `PeopleListWorkspace` uses for the flat-list roles) - the first genuine
 * "two portals need the identical composition" case since D1-D4 landed.
 *
 * Real data only (`usePeopleDirectory` - see its own doc comment for the
 * full endpoint trace): Bacenta cards, First-time guests, Visitors,
 * Potentials (`GET /potentials`, Milestone C.1.1's read model), and
 * "People without a Bacenta" (derived, not invented - see the hook's own
 * doc comment). Clicking a Bacenta card reveals that Bacenta's real
 * roster inline (no new route - this router has no query-string support
 * to hang a "selected Bacenta" on, so this is local component state, the
 * same reasoning `PeopleListPage.tsx`'s own persisted-search comment
 * already documents for this router's limits).
 */
export function PeopleDirectoryPage() {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const [selectedBacentaId, setSelectedBacentaId] = useState<string | null>(null);
  const [newPersonFormOpen, setNewPersonFormOpen] = useState(false);
  const directoryState = usePeopleDirectory(accessToken);

  if (state.status !== 'authenticated') return null;

  // `[People Intake milestone]` Only `ADMIN` holds `people.person.create`
  // (`libs/rbac/src/lib/permission-matrix.ts`) - see `PeopleListPage.tsx`'s
  // own `CAN_CREATE_PERSON_ROLES` doc comment for the full reasoning; not
  // imported from there since it's a one-role, one-line check, matching
  // this codebase's own "small per-page glue, not worth extracting"
  // precedent (`parseAmountToMinorUnits`'s doc comment).
  const canCreatePerson = state.actor.role === 'ADMIN';

  const selectedBacenta = directoryState.status === 'success' ? directoryState.data.bacentas.find((card) => card.group.id === selectedBacentaId) : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
      <PageHeader
        title="People"
        context={`${state.actor.branchName} · organized by Bacenta`}
        action={
          canCreatePerson && !newPersonFormOpen ? (
            <Button variant="secondary" size="sm" onClick={() => setNewPersonFormOpen(true)} accessibilityLabel="Add a new Person" testId="new-person-open">
              + New Person
            </Button>
          ) : undefined
        }
      />

      {canCreatePerson && newPersonFormOpen && (
        <NewPersonForm
          onCancel={() => setNewPersonFormOpen(false)}
          onCreated={() => {
            setNewPersonFormOpen(false);
            directoryState.refetch();
          }}
        />
      )}

      {directoryState.status === 'error' && (
        <Card padding={6}>
          <ErrorState title="Couldn't load the People directory" onRetry={directoryState.refetch} />
        </Card>
      )}

      {directoryState.status === 'loading' && (
        <Card padding={6} testId="people-directory-loading">
          <Skeleton height={160} />
        </Card>
      )}

      {directoryState.status === 'success' && (
        <div data-testid="people-directory-content" style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <SectionHeader title="Bacentas" description={`${directoryState.data.bacentas.length} Bacenta${directoryState.data.bacentas.length === 1 ? '' : 's'} in this Branch`} />
            {directoryState.data.bacentas.length === 0 ? (
              <Card padding={6}>
                <EmptyState icon="building" title="No Bacentas yet" description="No Bacenta Groups have been created for this Branch yet." />
              </Card>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: theme.spacing[3],
                }}
                data-testid="bacenta-card-grid"
              >
                {directoryState.data.bacentas.map((card) => (
                  <BacentaCard
                    key={card.group.id}
                    card={card}
                    isSelected={card.group.id === selectedBacentaId}
                    onSelect={() => setSelectedBacentaId(card.group.id === selectedBacentaId ? null : card.group.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {selectedBacenta && (
            <Card padding={4} testId="selected-bacenta-roster-card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                <SectionHeader
                  title={`${selectedBacenta.group.name} roster`}
                  description={`${selectedBacenta.members.length} member${selectedBacenta.members.length === 1 ? '' : 's'}`}
                  action={
                    <Button variant="tertiary" size="sm" onClick={() => setSelectedBacentaId(null)}>
                      Close
                    </Button>
                  }
                />
                {selectedBacenta.members.length === 0 ? (
                  <EmptyState icon="users" title="No members yet" description="This Bacenta has no active members yet." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {selectedBacenta.members.map((person, index) => (
                      <div key={person.id} style={{ borderTop: index === 0 ? 'none' : `1px solid ${theme.colors.border.subtle}` }}>
                        <PersonRow person={person} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: theme.spacing[3],
            }}
          >
            <PersonListCard
              title="First Timers"
              description="Guests recorded as attending for the first time"
              icon="userPlus"
              people={directoryState.data.firstTimeGuests}
              emptyDescription="No first-time guests recorded yet."
            />
            <PersonListCard
              title="Visitors"
              description="People at the Visitor lifecycle stage"
              icon="user"
              people={directoryState.data.visitors}
              emptyDescription="No visitors recorded yet."
            />
            <PersonListCard
              title="People without a Bacenta"
              description="Branch members with no active Bacenta membership"
              icon="users"
              people={directoryState.data.peopleWithoutBacenta}
              emptyDescription="Every Person in this Branch belongs to a Bacenta."
            />
          </div>

          <Card padding={4} testId="potentials-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <SectionHeader
                title="Potentials"
                description="People identified through outreach, not yet formal Person records"
                action={<Badge status="info">{directoryState.data.potentials.length}</Badge>}
              />
              {directoryState.data.potentials.length === 0 ? (
                <EmptyState icon="userPlus" title="No open potentials" description="No Potential records are open in this Branch right now." tone="positive" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {directoryState.data.potentials.slice(0, 8).map((potential, index) => (
                    <div
                      key={potential.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: theme.spacing[3],
                        padding: `${theme.spacing[2]}px 0`,
                        borderTop: index === 0 ? 'none' : `1px solid ${theme.colors.border.subtle}`,
                      }}
                    >
                      <Text variant="bodySmall" as="span">{`${potential.firstName}${potential.lastName ? ` ${potential.lastName}` : ''}`}</Text>
                      <Badge status={potential.status === 'CONVERTED' ? 'success' : potential.status === 'CLOSED' ? 'neutral' : 'info'}>{potential.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
