import type {
  CreatePersonInput,
  GroupMembershipResponseDto,
  GroupResponseDto,
  ListPeopleQuery,
  PersonResponseDto,
  RoleAssignmentResponseDto,
  RoleDto,
} from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { RecordOption } from '@ecclesia/ui-web';

import { apiGet, apiPost } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

/**
 * Resolves the `GET /people` query for the current actor's role, mirroring
 * PRD §16.1: "a Shepherd searches within their Bacenta context by default;
 * an Admin searches the whole Branch." See
 * `PEOPLE_PAGE_DESIGN_NOTES.md` §2 for the full per-role table.
 *
 * `[Design Decision]` ASSISTANT_PASTOR's CLUSTER scope covers multiple
 * Bacentas (`actor.clusterBacentaIds`), but `GET /people` only accepts one
 * `groupId` at a time - this defaults to the first Bacenta in the
 * cluster. A proper "browse my whole cluster" UX (a Bacenta picker, or a
 * backend change to accept multiple `groupId`s) is deferred - see
 * `PEOPLE_PAGE_DESIGN_NOTES.md` §6.
 */
export function resolveDefaultPeopleQuery(actor: Pick<ActorContext, 'role' | 'bacentaId' | 'basontaId' | 'clusterBacentaIds'>): ListPeopleQuery {
  const role: RoleDto = actor.role;
  switch (role) {
    case 'BACENTA_LEADER':
      return actor.bacentaId ? { groupId: actor.bacentaId } : {};
    case 'BASONTA_LEADER':
      return actor.basontaId ? { groupId: actor.basontaId } : {};
    case 'ASSISTANT_PASTOR':
      return actor.clusterBacentaIds?.[0] ? { groupId: actor.clusterBacentaIds[0] } : {};
    default:
      // RESIDENT_PASTOR, ACTING_RESIDENT_PASTOR, ADMIN, TREASURER all
      // resolve to whole-Branch per PRD §16.1 - `people.person.read`'s
      // BRANCH-scope rows for each. WORKER/MEMBER/VISITOR/COUNCIL_OVERSEER
      // have no groupId to default to either; they simply are not this
      // page's primary audience on web-admin (see
      // `APPLICATION_SHELL_DESIGN_NOTES.md` §1's persona/port scoping).
      return {};
  }
}

export function usePeopleList(accessToken: string | undefined, query: ListPeopleQuery): AsyncDataResult<PersonResponseDto[]> {
  return useAsyncData<PersonResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams();
      if (query.groupId) params.set('groupId', query.groupId);
      if (query.search) params.set('search', query.search);
      const qs = params.toString();
      return apiGet<PersonResponseDto[]>(`/people${qs ? `?${qs}` : ''}`, { authToken: accessToken, signal });
    },
    [accessToken, query.groupId, query.search],
  );
}

export function usePersonDetail(accessToken: string | undefined, personId: string): AsyncDataResult<PersonResponseDto> {
  return useAsyncData<PersonResponseDto>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<PersonResponseDto>(`/people/${personId}`, { authToken: accessToken, signal });
    },
    [accessToken, personId],
  );
}

export function useGroupMembershipHistory(accessToken: string | undefined, personId: string): AsyncDataResult<GroupMembershipResponseDto[]> {
  return useAsyncData<GroupMembershipResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<GroupMembershipResponseDto[]>(`/people/${personId}/group-memberships`, { authToken: accessToken, signal });
    },
    [accessToken, personId],
  );
}

export function useRoleAssignmentHistory(accessToken: string | undefined, personId: string): AsyncDataResult<RoleAssignmentResponseDto[]> {
  return useAsyncData<RoleAssignmentResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<RoleAssignmentResponseDto[]>(`/people/${personId}/role-assignments`, { authToken: accessToken, signal });
    },
    [accessToken, personId],
  );
}

/**
 * `[People Intake milestone]` `POST /people` (FR-PPL-01/FR-PPL-02,
 * `createPersonSchema`). Imperative, not a `useAsyncData` hook - mirrors
 * `recordTransaction`/`requestExpense` (`useStewardshipData.ts`), the
 * established shape for a create call this codebase's pages trigger from a
 * form submit handler rather than on mount. A 409 (`ConflictException({
 * message, candidates })`, see `PersonService.create`) surfaces as an
 * `ApiError` whose `body` is `{ message: string; candidates:
 * DuplicateCandidateResponseDto[] }` - `NewPersonForm` reads that shape
 * directly off `ApiError.body` rather than this function re-typing it,
 * since `ApiError`'s `body` is intentionally `unknown` (see its own doc
 * comment) and every call site is expected to narrow it for its own
 * endpoint.
 */
export function createPerson(accessToken: string, input: CreatePersonInput): Promise<PersonResponseDto> {
  return apiPost<PersonResponseDto>('/people', input, { authToken: accessToken });
}

/**
 * `[People Intake milestone]` `GET /people/:id`, imperative rather than
 * `usePersonDetail`'s hook form - the duplicate-candidate review step
 * fetches an a-priori-unknown, possibly-empty set of candidate ids
 * (`DuplicateCandidateResponseDto[]` from a 409) in a `Promise.all`, which
 * doesn't fit a fixed-deps `useAsyncData` call.
 */
export function fetchPersonById(accessToken: string, personId: string): Promise<PersonResponseDto> {
  return apiGet<PersonResponseDto>(`/people/${personId}`, { authToken: accessToken });
}

/**
 * `[People Intake milestone]` `RecordPicker`'s `onSearch` for the New
 * Person form's optional Guardian field (`createPersonSchema.guardianPersonId`).
 * A direct copy of Pastoral Care's `searchPeopleForEscalation`
 * (`usePastoralCareData.ts`) - same `GET /people?search=` endpoint, same
 * `RecordOption` mapping, same disclosed "scoped to the acting user's own
 * `people.person.read` grant" limitation. Kept as a per-page duplicate
 * rather than extracted into a shared helper, matching this codebase's own
 * "small per-app/per-page glue, not worth extracting" precedent (see
 * `parseAmountToMinorUnits`'s doc comment for the same reasoning applied
 * elsewhere).
 */
export async function searchPeopleForGuardian(accessToken: string, query: string): Promise<RecordOption[]> {
  const params = new URLSearchParams();
  if (query.trim()) params.set('search', query.trim());
  const qs = params.toString();
  const people = await apiGet<PersonResponseDto[]>(`/people${qs ? `?${qs}` : ''}`, { authToken: accessToken });
  return people.map((person) => ({
    id: person.id,
    label: `${person.firstName} ${person.lastName}`,
    description: person.phone ?? person.email ?? undefined,
  }));
}

export function useGroupName(accessToken: string | undefined, groupId: string): AsyncDataResult<GroupResponseDto> {
  return useAsyncData<GroupResponseDto>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<GroupResponseDto>(`/groups/${groupId}`, { authToken: accessToken, signal });
    },
    [accessToken, groupId],
  );
}
