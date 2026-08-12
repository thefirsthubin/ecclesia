import type {
  CreateGroupMembershipRequestInput,
  CreatePersonInput,
  CreateRoleAssignmentRequestInput,
  GroupMembershipResponseDto,
  GroupResponseDto,
  LifecycleStageDto,
  LifecycleTransitionRequestInput,
  ListPeopleQuery,
  PersonResponseDto,
  RoleAssignmentResponseDto,
  RoleDto,
} from '@ecclesia/contracts';
import { checkLifecycleTransition, LIFECYCLE_STAGES, requiresGroupMembershipToTransition } from '@ecclesia/domain-people';
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

/**
 * `[Lifecycle Stage Transition milestone]` FR-PPL-03's Member Journey
 * state machine, reused verbatim rather than re-derived here -
 * `@ecclesia/domain-people` is on `apps/web-admin`'s allowed dependency
 * list (`eslint.config.cjs`'s module-boundary rules already permit
 * `scope:app-web` -> `scope:domain-people`), so this filters
 * `LIFECYCLE_STAGES` through the exact same `checkLifecycleTransition`
 * the API's own `PersonService.transitionLifecycleStage` calls - the
 * picker can never offer a transition the server would reject, and the
 * two can never silently drift apart the way a hand-copied transition
 * table would risk.
 *
 * `FOLLOW_UP -> ASSIGNED_TO_BACENTA` is deliberately excluded
 * (`requiresGroupMembershipToTransition`) - that specific transition only
 * happens atomically with opening a Group Membership (PRD §19.1 step 6),
 * a different, not-yet-built Web Admin workflow (see
 * `RELEASE_1_WORKFLOW_MATRIX.md`'s People section) - not this endpoint's
 * job, and offering it here would only produce a guaranteed 409.
 */
export function nextLifecycleStageOptions(current: LifecycleStageDto): LifecycleStageDto[] {
  return LIFECYCLE_STAGES.filter(
    (candidate) =>
      candidate !== current &&
      checkLifecycleTransition(current, candidate).allowed &&
      !requiresGroupMembershipToTransition(current, candidate),
  );
}

/**
 * `POST /people/:id/lifecycle-transitions` (FR-PPL-03). Imperative, same
 * shape as `createPerson`/`recordTransaction` - triggered from a form
 * submit, not fetched on mount. No client-side role check gates who may
 * call this (matching Stewardship's Verify/Flag/Reconcile precedent,
 * `StewardshipPage.tsx`) - `people.person.lifecycle_stage.update` is
 * BRANCH/CLUSTER/OWN_GROUP-scoped per PRD §17.3's own matrix (notably
 * *not* granted to `RESIDENT_PASTOR`, who holds only `.read` on this
 * action - a deliberate PRD row, not a bug), and the backend is the only
 * source of truth for that decision; a denied actor sees the same
 * `RbacGuard` 403 message any other gated action already surfaces.
 */
export function transitionLifecycleStage(
  accessToken: string,
  personId: string,
  input: LifecycleTransitionRequestInput,
): Promise<PersonResponseDto> {
  return apiPost<PersonResponseDto>(`/people/${personId}/lifecycle-transitions`, input, { authToken: accessToken });
}

/**
 * `[Group Membership Assignment milestone]` `GET /groups` for the
 * `RecordPicker` search backing "Assign to Bacenta/Basonta"
 * (`PersonDetailPage.tsx`). `listGroupsQuerySchema` supports only a
 * `type` filter, no `search` param (unlike `GET /people`) -
 * `GroupService.list` returns every Group in the actor's Branch
 * regardless of type when `type` is omitted, so this fetches once and
 * filters by name client-side, matching how `RecordPicker`'s own
 * contract (`onSearch: (query) => Promise<RecordOption[]>`) expects to
 * be driven either way.
 *
 * **`GET /groups` is BRANCH-scope only** (`GroupListResourceContextGuard`'s
 * own doc comment: "a BACENTA_LEADER/BASONTA_LEADER already knows their
 * own single Group id and has no need to list; an ASSISTANT_PASTOR's
 * CLUSTER scope cannot match a bare `{ branchId }` resource at all" - a
 * deliberate, disclosed design, not an oversight this milestone can or
 * should paper over). For `RESIDENT_PASTOR`/`ADMIN` this search works
 * fully; for `ASSISTANT_PASTOR`/`BACENTA_LEADER`/`BASONTA_LEADER` it
 * 403s, same as any other action those roles lack the underlying grant
 * for - not caught here, matching `searchPeopleForEscalation`/
 * `searchPeopleForGuardian`'s own precedent of not swallowing search
 * errors internally.
 */
export async function searchGroupsForAssignment(accessToken: string, query: string): Promise<RecordOption[]> {
  const groups = await apiGet<GroupResponseDto[]>('/groups', { authToken: accessToken });
  const normalizedQuery = query.trim().toLowerCase();
  const matches = normalizedQuery ? groups.filter((group) => group.name.toLowerCase().includes(normalizedQuery)) : groups;
  return matches.map((group) => ({
    id: group.id,
    label: group.name,
    description: `${group.type === 'PASTORAL_CARE' ? 'Bacenta' : 'Basonta'} · ${group.lifecycleStatus}`,
  }));
}

/**
 * `POST /people/:personId/group-memberships` (BR-PPL-01/02, FR-PPL-04/05,
 * PRD §17.3's "Bacenta/Basonta: reassign member" row). Imperative, same
 * shape as `transitionLifecycleStage`. Deliberately does **not**
 * pre-compute whether `reason` is required client-side -
 * `GroupMembershipService.assign` decides that server-side via
 * `planGroupMembershipChange` (whether this specific assignment closes
 * an existing active Bacenta membership), and duplicating that decision
 * here would risk drifting from the real rule. The caller
 * (`PersonDetailPage.tsx`) always offers the optional reason field and
 * surfaces the server's actual 400 message inline if one turns out to be
 * required - the backend stays the single source of truth for this
 * business rule, not a client-side guess.
 */
export function assignGroupMembership(
  accessToken: string,
  personId: string,
  input: CreateGroupMembershipRequestInput,
): Promise<GroupMembershipResponseDto> {
  return apiPost<GroupMembershipResponseDto>(`/people/${personId}/group-memberships`, input, { authToken: accessToken });
}

/**
 * `[Role Assignment Management milestone]` `POST /people/:personId/role-assignments`
 * (PRD §17.3's "Role Assignment: grant Shepherd/Worker/etc." row).
 * Imperative, same shape as `assignGroupMembership`/`transitionLifecycleStage`.
 *
 * **Deliberately does not pre-compute who is authorized to call this.**
 * `RoleAssignmentController.grant` has no declarative `@RequirePermission`/
 * `RbacGuard` at all - authorization is decided imperatively inside
 * `RoleAssignmentService.grant()` via `evaluate()` (it must pick between
 * `people.role_assignment.grant` and the Poimen-gated `.grant_shepherd`
 * based on `body.role`, which a static decorator can't express). Traced
 * against the real matrix this milestone: only `RESIDENT_PASTOR` (BRANCH)
 * and `ASSISTANT_PASTOR` (CLUSTER) hold this grant at all -
 * **`ADMIN` does not** (PRD §17.3's own "R only (no grant authority)" row
 * for Admin, confirmed against `permission-matrix.ts` - a real, deliberate
 * PRD design, not a gap this UI works around). `ASSISTANT_PASTOR`'s
 * CLUSTER grant is additionally confirmed live (prior session) to never
 * succeed in practice - `RoleAssignmentService.grant()`'s own
 * `ResourceContext` never sets `bacentaId`, so CLUSTER scope's resource
 * check can never match, regardless of cluster membership. Recorded as a
 * P2 product-decision finding, not something this UI silently works
 * around. The backend's real 403 is what a denied actor sees, same as
 * every other gated action in this file.
 */
export function grantRoleAssignment(
  accessToken: string,
  personId: string,
  input: CreateRoleAssignmentRequestInput,
): Promise<RoleAssignmentResponseDto> {
  return apiPost<RoleAssignmentResponseDto>(`/people/${personId}/role-assignments`, input, { authToken: accessToken });
}

/**
 * `[Role Assignment Management milestone]` `ROLE_VALUES` (`@ecclesia/contracts`)
 * is the complete, real Role catalog `createRoleAssignmentRequestSchema.role`
 * accepts - no roles invented or excluded here. `GROUP_SCOPED_ROLES` names
 * the two roles whose grant is meaningless without a target Group
 * (`RoleAssignmentService.grant()`'s own succession branch only exists for
 * `BACENTA_LEADER`+`groupId`; `BASONTA_LEADER` is the same shape of
 * Group-scoped role even though it has no succession logic of its own).
 * This is existing domain semantics read off the service's real behavior,
 * not a new rule invented for this UI.
 */
export const GROUP_SCOPED_ROLES: readonly RoleDto[] = ['BACENTA_LEADER', 'BASONTA_LEADER'];

/**
 * `[Role Assignment Revoke milestone]` `POST
 * /people/:personId/role-assignments/:assignmentId/revoke` - ends a
 * currently-active assignment (`effectiveTo = now`, the same "close,
 * don't delete" temporal model succession already used implicitly). No
 * request body - a pure action, the same no-payload `apiPost` shape
 * `verifyTransaction`/`completeFollowUpTask` already established.
 *
 * **RBAC, traced against `permission-matrix.ts` directly, not assumed:**
 * this reuses the existing `people.role_assignment.update` action, which
 * happens to name the identical two roles/scopes `grantRoleAssignment`'s
 * own doc comment already traces for `.grant` - `RESIDENT_PASTOR`
 * (BRANCH) and `ASSISTANT_PASTOR` (CLUSTER). `ADMIN` again has no grant
 * authority here either (no `.update` row exists for it, same as `.grant`).
 * Unlike `.grant`, though, this new route's resource context resolves
 * from the assignment's own real `groupId` (not a candidate-Person-shaped
 * resource with no `bacentaId` at all), so Assistant Pastor's CLUSTER
 * scope is not structurally broken here the way it is for granting - see
 * `RoleAssignmentRevokeResourceContextGuard`'s own doc comment
 * (`apps/api`). None of this is enforced client-side.
 */
export function revokeRoleAssignment(accessToken: string, personId: string, assignmentId: string): Promise<RoleAssignmentResponseDto> {
  return apiPost<RoleAssignmentResponseDto>(`/people/${personId}/role-assignments/${assignmentId}/revoke`, {}, { authToken: accessToken });
}
