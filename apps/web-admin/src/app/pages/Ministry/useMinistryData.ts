import type { CreateGroupInput, GroupResponseDto, OvercommitmentFlagResponseDto, RosterMemberResponseDto, UpdateGroupInput } from '@ecclesia/contracts';

import { apiGet, apiPatch, apiPost } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

/**
 * `[Group CRUD milestone]` `GET /groups` (no `type` filter) - the Group
 * directory `BasontaDirectoryPage` needs. Renamed/broadened from this
 * sprint's original `useBasontaDirectory` (which hard-coded
 * `?type=MINISTRY`) now that the page lists both Bacentas
 * (`PASTORAL_CARE`) and Basontas (`MINISTRY`), the full `people.group.*`
 * surface this milestone builds Create/Update for - see
 * `BasontaDirectoryPage.tsx`'s own doc comment for why the roster `Link`
 * remains Basonta-only. Only meaningful for BRANCH-scoped actors
 * (`GroupListResourceContextGuard` always resolves to the actor's own
 * Branch - see that guard's own doc comment and
 * `MINISTRY_PAGE_DESIGN_NOTES.md` §3 for why this page doesn't attempt to
 * call it for a Basonta Leader, who never needs a directory of one).
 */
export function useGroupDirectory(accessToken: string | undefined): AsyncDataResult<GroupResponseDto[]> {
  return useAsyncData<GroupResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<GroupResponseDto[]>('/groups', { authToken: accessToken, signal });
    },
    [accessToken],
  );
}

/**
 * `[Group CRUD milestone]` `POST /groups` (FR-PC-01/FR-MIN-01, [INFERRED] -
 * no PRD §17.3 row covers Group creation itself, see
 * `libs/rbac/src/lib/actions.ts`'s `people.group.*` doc comment).
 *
 * **RBAC, traced against `permission-matrix.ts` directly, not assumed:**
 * only `RESIDENT_PASTOR` and `ADMIN` (both BRANCH scope) hold
 * `people.group.create` - deliberately no CLUSTER/OWN_GROUP create grant,
 * since deciding which cluster a brand-new Bacenta belongs to is itself
 * an unresolved configuration question (`db/DESIGN_NOTES.md` Open
 * Question #1). Not enforced client-side - the backend's real response is
 * what the caller sees.
 *
 * `meetingSchedule`/`meetingLocation`/`category` are accepted regardless
 * of `type` - `createGroupSchema`'s own doc comment: the PRD describes
 * what each creation *flow* captures (Bacenta: schedule/location; Basonta:
 * category), not a hard type-conditional schema constraint, so this form
 * doesn't invent one either.
 */
export function createGroup(accessToken: string, input: CreateGroupInput): Promise<GroupResponseDto> {
  return apiPost<GroupResponseDto>('/groups', input, { authToken: accessToken });
}

/**
 * `[Group CRUD milestone]` `PATCH /groups/:id`. Covers every field
 * `updateGroupSchema` accepts (`name`, `meetingSchedule`,
 * `meetingLocation`, `category`, `lifecycleStatus`) - there is no
 * transition-validating state machine for `lifecycleStatus` anywhere in
 * `libs/domain/people` (confirmed by reading `GroupService.update()` and
 * searching the domain lib - unlike Gathering's real
 * `checkGatheringStatusTransition`), so this form offers the flat
 * `GROUP_LIFECYCLE_STATUS_VALUES` set directly rather than inventing a
 * transition restriction the backend itself doesn't enforce.
 */
export function updateGroup(accessToken: string, groupId: string, input: UpdateGroupInput): Promise<GroupResponseDto> {
  return apiPatch<GroupResponseDto>(`/groups/${groupId}`, input, { authToken: accessToken });
}

export function useRoster(accessToken: string | undefined, groupId: string): AsyncDataResult<RosterMemberResponseDto[]> {
  return useAsyncData<RosterMemberResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<RosterMemberResponseDto[]>(`/ministry/groups/${groupId}/roster`, { authToken: accessToken, signal });
    },
    [accessToken, groupId],
  );
}

export function useOvercommitmentFlags(
  accessToken: string | undefined,
  groupId: string,
): AsyncDataResult<OvercommitmentFlagResponseDto[]> {
  return useAsyncData<OvercommitmentFlagResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<OvercommitmentFlagResponseDto[]>(`/ministry/groups/${groupId}/roster/overcommitment`, {
        authToken: accessToken,
        signal,
      });
    },
    [accessToken, groupId],
  );
}
