import { useMemo, useState } from 'react';
import { Avatar, Badge, Button, Card, ErrorState, Heading, Input, Table, Text, useTheme } from '@ecclesia/ui-web';
import type { TableColumn } from '@ecclesia/ui-web';
import type { LifecycleStageDto, PersonResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { Link } from '../../router/router';
import { LIFECYCLE_BADGE_STATUS, LIFECYCLE_LABEL, ORDERED_LIFECYCLE_STAGES } from './lifecycleLabels';
import { NewPersonForm } from './NewPersonForm';
import { resolveDefaultPeopleQuery, usePeopleList } from './usePeopleData';

/**
 * `[People Intake milestone]` Exactly one permission-matrix row grants
 * `people.person.create` (`libs/rbac/src/lib/permission-matrix.ts`):
 * `{ role: 'ADMIN', ..., effect: 'ALLOW' }` - no other role can ever
 * succeed at this call. Unlike Stewardship's "always show the button, let
 * the backend's 403 decide" precedent (appropriate there because several
 * roles' eligibility is genuinely data-dependent), showing "+ New Person"
 * to a role with zero chance of success would be pure UI noise, not a
 * deferred authorization decision - so this page gates client-side, the
 * same reasoning `ConfigurationPage` already established for a
 * single-role-only surface.
 */
const CAN_CREATE_PERSON_ROLES = ['ADMIN'] as const;

/**
 * PRD §16.1's People directory ("Search & directory" capability). Scope
 * (whole Branch vs. one Bacenta/Basonta vs. one Bacenta of a cluster) is
 * resolved from the actor's own role, not chosen by the user - see
 * `resolveDefaultPeopleQuery`'s doc comment.
 *
 * `[UX Design Implementation]` Final UX Design Specification §19 (Phase 3
 * People workflow UI): the hand-rolled Card+Divider row list is now the
 * shared `Table` (§9's "adoption is itself an accessibility improvement"
 * - real `<table>`/`<th scope>` markup, same `Table` already adopted for
 * Pastoral Care/Stewardship). The Name cell stays a real `<Link>` rather
 * than `Table`'s own `onRowClick` - `onRowClick` only attaches a `<tr>`
 * click handler with no `tabIndex`/keydown handling, so it alone would
 * not be keyboard-reachable; wrapping the name in `Link` preserves native
 * anchor semantics (keyboard, modifier-click-to-open-in-new-tab), the
 * same pattern `FollowUpTaskQueuePage.tsx` already uses for its own
 * Person links.
 *
 * The Lifecycle Stage filter chips are a pure client-side filter over the
 * already-fetched, already-scoped result set - `ListPeopleQuery`
 * (`people.schemas.ts`) has no `lifecycleStage` field at all, so this is
 * not a new backend capability or a widened data-access boundary, only a
 * display-layer refinement of data this page already receives.
 */
export function PeopleListPage() {
  const theme = useTheme();
  const { state } = useAuth();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<LifecycleStageDto | undefined>(undefined);
  const [newPersonFormOpen, setNewPersonFormOpen] = useState(false);

  if (state.status !== 'authenticated') return null;

  const baseQuery = resolveDefaultPeopleQuery(state.actor);
  const query = search.trim() ? { ...baseQuery, search: search.trim() } : baseQuery;
  const peopleState = usePeopleList(state.accessToken, query);
  const canCreatePerson = CAN_CREATE_PERSON_ROLES.includes(state.actor.role as (typeof CAN_CREATE_PERSON_ROLES)[number]);

  const filteredPeople = useMemo(() => {
    if (peopleState.status !== 'success') return [];
    return stageFilter ? peopleState.data.filter((person) => person.lifecycleStage === stageFilter) : peopleState.data;
  }, [peopleState, stageFilter]);

  const columns: TableColumn<PersonResponseDto>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (person) => (
        <Link to={`/people/${person.id}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
            <Avatar name={`${person.firstName} ${person.lastName}`} size="sm" />
            <Text variant="bodySmall" as="span">{`${person.firstName} ${person.lastName}`}</Text>
          </div>
        </Link>
      ),
    },
    {
      key: 'lifecycleStage',
      header: 'Lifecycle stage',
      align: 'right',
      render: (person) => <Badge status={LIFECYCLE_BADGE_STATUS[person.lifecycleStage]}>{LIFECYCLE_LABEL[person.lifecycleStage]}</Badge>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4], maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[3] }}>
        <Heading level={1}>People</Heading>
        {canCreatePerson && !newPersonFormOpen && (
          <Button variant="secondary" size="sm" onClick={() => setNewPersonFormOpen(true)} accessibilityLabel="Add a new Person" testId="new-person-open">
            + New Person
          </Button>
        )}
      </div>

      {canCreatePerson && newPersonFormOpen && (
        <NewPersonForm
          onCancel={() => setNewPersonFormOpen(false)}
          onCreated={() => {
            setNewPersonFormOpen(false);
            peopleState.refetch();
          }}
        />
      )}

      <Input label="Search by name" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="e.g. Ama Owusu" />

      {/* `[UX Design Implementation]` Final UX Design Specification §19
          (Phase 3 People workflow UI, accessibility pass) - `aria-pressed`
          so the selected stage is announced, not only shown via the
          primary/secondary color swap. */}
      <div role="group" aria-label="Filter by lifecycle stage" style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
        <Button variant={stageFilter === undefined ? 'primary' : 'secondary'} size="sm" onClick={() => setStageFilter(undefined)} aria-pressed={stageFilter === undefined}>
          All
        </Button>
        {ORDERED_LIFECYCLE_STAGES.map((stage) => (
          <Button key={stage} variant={stageFilter === stage ? 'primary' : 'secondary'} size="sm" onClick={() => setStageFilter(stage)} aria-pressed={stageFilter === stage}>
            {LIFECYCLE_LABEL[stage]}
          </Button>
        ))}
      </div>

      {peopleState.status === 'error' && (
        <Card padding={6}>
          <ErrorState title="Couldn't load People" onRetry={peopleState.refetch} />
        </Card>
      )}

      {peopleState.status !== 'error' && (
        <Card padding={6} testId="people-list-card">
          <Table
            testId="people-list-table"
            columns={columns}
            data={filteredPeople}
            getRowId={(person) => person.id}
            loading={peopleState.status === 'loading'}
            emptyIcon="users"
            emptyTitle={search || stageFilter ? 'No matches' : 'No people found'}
            emptyDescription={
              search
                ? `No one matches "${search}" in this scope.`
                : stageFilter
                  ? `No one in this scope is currently ${LIFECYCLE_LABEL[stageFilter]}.`
                  : 'No Person records are visible in your current scope yet.'
            }
          />
        </Card>
      )}
    </div>
  );
}
