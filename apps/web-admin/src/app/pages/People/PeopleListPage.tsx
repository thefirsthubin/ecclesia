import { useMemo, useState } from 'react';
import { Avatar, Badge, Button, Card, ErrorState, Heading, Search, Table, Text, useTheme } from '@ecclesia/ui-web';
import type { TableColumn } from '@ecclesia/ui-web';
import type { LifecycleStageDto, PersonResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { Link } from '../../router/router';
import { LIFECYCLE_BADGE_STATUS, LIFECYCLE_LABEL, ORDERED_LIFECYCLE_STAGES } from './lifecycleLabels';
import { NewPersonForm } from './NewPersonForm';
import { resolveDefaultPeopleQuery, usePeopleList, usePeopleListForGroups } from './usePeopleData';

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

type SortKey = 'name' | 'lifecycleStage';

/**
 * `[Product Experience Sprint II, Phase 5]` Module-level, not component
 * state - deliberately, so it survives `PeopleListPage` unmounting when a
 * user opens a Person and comes back (`app.tsx`'s router swaps the routed
 * component out entirely on navigation; a plain `useState` here would
 * reset on remount). The concrete workflow this exists for is this
 * sprint's own named example: search -> open a record -> return ->
 * shouldn't have to search again. Not sessionStorage, not a new Context -
 * this app's router (`router.tsx`) has no query-string support to hang
 * state on, and both of those would be a genuinely new persistence
 * mechanism; plain module scope is neither, it's just how long-lived a
 * JS module already is for the life of the tab. Resets on a real page
 * reload, which is the right amount of persistence for "I clicked back,"
 * not "I want this restored after closing my laptop."
 */
let persistedSearch = '';
let persistedStageFilter: LifecycleStageDto | undefined = undefined;

/** `[Product Experience Sprint II, Phase 5]` Test-only escape hatch - a
 * real app session never needs to clear this (module scope only ever
 * resets on a real reload, exactly the intended behavior), but a Jest
 * module instance is shared across every `it()` in a spec file, so
 * without this, one test's search text would silently leak into the
 * next test's initial render. Exported deliberately (not a hack around
 * the module system) so `PeopleListPage.spec.tsx` can call it from
 * `beforeEach` rather than the tests coupling to execution order. */
export function __resetPeopleListPagePersistedStateForTests(): void {
  persistedSearch = '';
  persistedStageFilter = undefined;
}

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
 * click handler with no modifier-key awareness, so wiring it here
 * alongside the Link would fire an unwanted same-tab navigation even on
 * a deliberate Ctrl/Cmd-click meant to open in a new tab. Left exactly as
 * originally reasoned - `Link` alone already gives native keyboard
 * activation and modifier-click behavior `onRowClick` structurally
 * cannot replicate without a `Table` API change this sprint didn't need
 * to make.
 *
 * The Lifecycle Stage filter chips are a pure client-side filter over the
 * already-fetched, already-scoped result set - `ListPeopleQuery`
 * (`people.schemas.ts`) has no `lifecycleStage` field at all, so this is
 * not a new backend capability or a widened data-access boundary, only a
 * display-layer refinement of data this page already receives. Kept as a
 * button-toggle row, not `FilterBar`'s removable-chip pattern - `FilterBar`
 * is built for combining several independent filters; this is a single
 * mutually-exclusive choice, where a pressed/unpressed toggle group is
 * the clearer, more standard control (`aria-pressed`, not a second chip
 * UI duplicating the same seven options).
 *
 * `[Product Experience Sprint II, Phase 5]` Three real fixes found by
 * actually auditing this page against the shared `Search` component
 * (which existed, fully built - debounce, a clear button, a leading icon
 * - and was used by zero pages in this app until now):
 * 1. Search previously re-fetched from the real backend on *every
 *    keystroke* (`Input`'s `onChange` fed `usePeopleList`'s query
 *    directly, no debounce) - now `Search`'s dedicated `onSearch` (300ms
 *    debounced) drives the actual query; `onChange` only updates what's
 *    visibly typed.
 * 2. The empty-state description only ever named one active filter,
 *    silently dropping the other when search text and a stage filter
 *    were both applied.
 * 3. `Contact` is a new column - `person.phone` was already being
 *    fetched for every row and simply never shown; no new request. Not
 *    added: a Branch/Bacenta column - `PersonResponseDto` has no group
 *    field at all (group membership is a separate resource), so showing
 *    one would mean an N+1 fetch per row for a scope that, for every
 *    non-Branch-wide role, is already the same single group for the
 *    whole list anyway.
 */
export function PeopleListPage() {
  const theme = useTheme();
  const { state } = useAuth();
  const [searchInput, setSearchInput] = useState(persistedSearch);
  const [debouncedSearch, setDebouncedSearchState] = useState(persistedSearch);
  const [stageFilter, setStageFilterState] = useState<LifecycleStageDto | undefined>(persistedStageFilter);
  const [newPersonFormOpen, setNewPersonFormOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const setDebouncedSearch = (value: string) => {
    persistedSearch = value;
    setDebouncedSearchState(value);
  };
  const setStageFilter = (value: LifecycleStageDto | undefined) => {
    persistedStageFilter = value;
    setStageFilterState(value);
  };

  if (state.status !== 'authenticated') return null;

  const baseQuery = resolveDefaultPeopleQuery(state.actor);
  const query = debouncedSearch.trim() ? { ...baseQuery, search: debouncedSearch.trim() } : baseQuery;

  // `[Branch Pastor portal]` `ASSISTANT_PASTOR`'s real CLUSTER grant spans
  // every Bacenta in `clusterBacentaIds`, not just the first one
  // `resolveDefaultPeopleQuery` defaults to - see `usePeopleListForGroups`'s
  // own doc comment. Both hooks are called unconditionally (Rules of
  // Hooks) but only one is ever actually active per render: passing
  // `undefined` as the access token is this codebase's existing idiom for
  // "don't fetch" (every `useAsyncData`-based hook already short-circuits
  // on it), so the unused branch never makes a network call.
  const isClusterRole = state.actor.role === 'ASSISTANT_PASTOR';
  const clusterBacentaIds = state.actor.clusterBacentaIds ?? [];
  const singleGroupPeopleState = usePeopleList(isClusterRole ? undefined : state.accessToken, query);
  const clusterPeopleState = usePeopleListForGroups(isClusterRole ? state.accessToken : undefined, clusterBacentaIds, debouncedSearch.trim() || undefined);
  const peopleState = isClusterRole ? clusterPeopleState : singleGroupPeopleState;
  const canCreatePerson = CAN_CREATE_PERSON_ROLES.includes(state.actor.role as (typeof CAN_CREATE_PERSON_ROLES)[number]);

  const filteredPeople = useMemo(() => {
    if (peopleState.status !== 'success') return [];
    return stageFilter ? peopleState.data.filter((person) => person.lifecycleStage === stageFilter) : peopleState.data;
  }, [peopleState, stageFilter]);

  const sortedPeople = useMemo(() => {
    const copy = [...filteredPeople];
    copy.sort((a, b) => {
      const result =
        sortKey === 'name'
          ? `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
          : LIFECYCLE_LABEL[a.lifecycleStage].localeCompare(LIFECYCLE_LABEL[b.lifecycleStage]);
      return sortDirection === 'asc' ? result : -result;
    });
    return copy;
  }, [filteredPeople, sortKey, sortDirection]);

  const handleSortChange = (key: string) => {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key as SortKey);
      setSortDirection('asc');
    }
  };

  const columns: TableColumn<PersonResponseDto>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
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
      key: 'contact',
      header: 'Contact',
      render: (person) =>
        person.phone ? (
          <Text variant="bodySmall" as="span" color={theme.colors.text.secondary}>
            {person.phone}
          </Text>
        ) : (
          <Text variant="bodySmall" as="span" color={theme.colors.text.disabled}>
            —
          </Text>
        ),
    },
    {
      key: 'lifecycleStage',
      header: 'Lifecycle stage',
      align: 'right',
      sortable: true,
      render: (person) => <Badge status={LIFECYCLE_BADGE_STATUS[person.lifecycleStage]}>{LIFECYCLE_LABEL[person.lifecycleStage]}</Badge>,
    },
  ];

  const activeSearch = debouncedSearch.trim();

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

      <Search
        label="Search by name"
        value={searchInput}
        onChange={setSearchInput}
        onSearch={setDebouncedSearch}
        placeholder="e.g. Ama Owusu"
        testId="people-search"
      />

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
            data={sortedPeople}
            getRowId={(person) => person.id}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            loading={peopleState.status === 'loading'}
            emptyIcon="users"
            emptyTitle={activeSearch || stageFilter ? 'No matches' : 'No people found'}
            emptyDescription={
              activeSearch && stageFilter
                ? `No one matches "${activeSearch}" who is currently ${LIFECYCLE_LABEL[stageFilter]}.`
                : activeSearch
                  ? `No one matches "${activeSearch}" in this scope.`
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
