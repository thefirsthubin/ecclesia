import type {
  CreateFollowUpTaskInput,
  FollowUpTaskResponseDto,
  ListFollowUpTasksForActorQuery,
  ListSilentDriftFlagsForActorQuery,
  PersonResponseDto,
  SilentDriftFlagResponseDto,
} from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { RecordOption } from '@ecclesia/ui-web';

import { apiGet, apiPatch, apiPost } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

/**
 * Resolves the `GET /pastoral-care/follow-up-tasks` query for the current
 * actor's role - the exact same shape/reasoning as People's
 * `resolveDefaultPeopleQuery` (see
 * `apps/web-admin/.../People/PEOPLE_PAGE_DESIGN_NOTES.md` §3), applied to
 * `pastoral_care.followup_task.read`'s scope rows instead of
 * `people.person.read`'s. See `PASTORAL_CARE_PAGE_DESIGN_NOTES.md` §3 for
 * the full per-role table.
 *
 * `[Design Decision]` Same ASSISTANT_PASTOR simplification as People's:
 * CLUSTER scope spans every Bacenta in `actor.clusterBacentaIds`, but this
 * endpoint takes one `groupId` at a time - defaults to the first Bacenta
 * in the cluster.
 */
export function resolveDefaultFollowUpTaskQuery(
  actor: Pick<ActorContext, 'role' | 'bacentaId' | 'clusterBacentaIds'>,
): ListFollowUpTasksForActorQuery {
  switch (actor.role) {
    case 'BACENTA_LEADER':
      return actor.bacentaId ? { groupId: actor.bacentaId } : {};
    case 'ASSISTANT_PASTOR':
      return actor.clusterBacentaIds?.[0] ? { groupId: actor.clusterBacentaIds[0] } : {};
    default:
      // RESIDENT_PASTOR/ACTING_RESIDENT_PASTOR/ADMIN resolve to
      // whole-Branch (`pastoral_care.followup_task.read`'s BRANCH-scope
      // rows). Every other role (BASONTA_LEADER, WORKER, MEMBER, ...) has
      // no scope row for this action at all - falls through to the same
      // `{}` query, which the backend will correctly 403 rather than this
      // hook trying to pre-empt that (same precedent as People's list).
      return {};
  }
}

export function useFollowUpTaskQueue(
  accessToken: string | undefined,
  query: ListFollowUpTasksForActorQuery,
): AsyncDataResult<FollowUpTaskResponseDto[]> {
  return useAsyncData<FollowUpTaskResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams();
      if (query.groupId) params.set('groupId', query.groupId);
      if (query.status) params.set('status', query.status.join(','));
      const qs = params.toString();
      return apiGet<FollowUpTaskResponseDto[]>(`/pastoral-care/follow-up-tasks${qs ? `?${qs}` : ''}`, {
        authToken: accessToken,
        signal,
      });
    },
    [accessToken, query.groupId, query.status?.join(',')],
  );
}

/** `PATCH /follow-up-tasks/:id/complete` - no request body, same
 * no-payload PATCH shape `AlertPriorityCard`'s `resolve()` already
 * established for `PATCH /insights/alerts/:id/resolve`. */
export function completeFollowUpTask(accessToken: string, taskId: string): Promise<FollowUpTaskResponseDto> {
  return apiPatch<FollowUpTaskResponseDto>(`/follow-up-tasks/${taskId}/complete`, {}, { authToken: accessToken });
}

/**
 * `PATCH /follow-up-tasks/:id/escalate` - BR-PC-04's caller-supplied
 * `escalatedToPersonId` (`escalateFollowUpTaskSchema`, `@ecclesia/contracts`)
 * - automatic "who is this Shepherd's organizational superior" resolution
 * isn't buildable from anything in the schema, so the picker's selection
 * *is* the business rule's required input, not a UI convenience on top of
 * one. See `PASTORAL_CARE_PAGE_DESIGN_NOTES.md` §4.
 */
export function escalateFollowUpTask(accessToken: string, taskId: string, escalatedToPersonId: string): Promise<FollowUpTaskResponseDto> {
  return apiPatch<FollowUpTaskResponseDto>(`/follow-up-tasks/${taskId}/escalate`, { escalatedToPersonId }, { authToken: accessToken });
}

/**
 * `RecordPicker`'s `onSearch` for the Escalate flow - reuses `GET
 * /people?search=`, the exact same endpoint/query param People's own
 * directory search already uses (People Web Admin sprint), rather than a
 * new search endpoint.
 *
 * `[Design Decision]` A known, disclosed limitation, not a silent
 * workaround: this search is scoped by the *acting* user's own
 * `people.person.read` grant, the same as every other `GET /people` call
 * in this app. A `BACENTA_LEADER` (OWN_GROUP scope) can therefore only
 * find escalation targets inside their own Bacenta - not the Assistant
 * Pastor above them an escalation is usually meant for. Fixing this
 * needs either a broader-than-OWN_GROUP search grant or a dedicated
 * "escalation targets" endpoint that resolves organizational superiors,
 * neither of which exists yet. See `PASTORAL_CARE_PAGE_DESIGN_NOTES.md`
 * §4/§9.
 */
export async function searchPeopleForEscalation(accessToken: string, query: string): Promise<RecordOption[]> {
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

/**
 * `[Follow-up Task Creation milestone]` `POST /people/:personId/follow-up-tasks`
 * (FR-PC-03's explicit/manual creation path - see `createFollowUpTaskSchema`'s
 * own doc comment in `@ecclesia/contracts` for why `trigger` defaults to
 * `MANUAL` and no automatic-assignee resolution exists). `personId` is the
 * route's own path param - the subject Person the task concerns - not part
 * of the request body.
 *
 * **RBAC, traced against `permission-matrix.ts` directly, not assumed:**
 * `RESIDENT_PASTOR` holds `pastoral_care.followup_task.read`/`.update` at
 * BRANCH scope but **no `.create` row at all**; `ADMIN` holds only `.read`
 * at BRANCH. Only `ASSISTANT_PASTOR` (CLUSTER) and `BACENTA_LEADER`
 * (OWN_GROUP) can actually create a Follow-up task. Scope resolves from
 * the *subject Person's* own active Bacenta membership
 * (`PersonScopeService.loadResourceContext`, `apps/api`), not the acting
 * user's own group - the selected subject Person must actually belong to
 * a Bacenta the actor's scope reaches. None of this is enforced
 * client-side; the backend's real response is what the caller sees.
 */
export function createFollowUpTask(accessToken: string, personId: string, input: CreateFollowUpTaskInput): Promise<FollowUpTaskResponseDto> {
  return apiPost<FollowUpTaskResponseDto>(`/people/${personId}/follow-up-tasks`, input, { authToken: accessToken });
}

export function usePersonName(accessToken: string | undefined, personId: string): AsyncDataResult<PersonResponseDto> {
  return useAsyncData<PersonResponseDto>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<PersonResponseDto>(`/people/${personId}`, { authToken: accessToken, signal });
    },
    [accessToken, personId],
  );
}

/**
 * `[Silent-Drift Detection Branch-wide milestone]` Resolves the `GET
 * /pastoral-care/silent-drift-flags` query for the current actor's role -
 * a separate function from `resolveDefaultFollowUpTaskQuery`, not a
 * reuse of it, even though `pastoral_care.silent_drift_flag.read`'s scope
 * rows happen to name the identical four roles/scopes (traced against
 * `permission-matrix.ts`, not assumed): `RESIDENT_PASTOR`/`ADMIN`
 * (BRANCH), `ASSISTANT_PASTOR` (CLUSTER), `BACENTA_LEADER` (OWN_GROUP).
 * Kept independent since these are two different domain objects/endpoints
 * that could diverge later - same "small per-domain duplicate, not a
 * premature shared abstraction" precedent this codebase already applies
 * to `searchPeopleForEscalation`/`searchPeopleForGuardian`.
 */
export function resolveDefaultSilentDriftQuery(
  actor: Pick<ActorContext, 'role' | 'bacentaId' | 'clusterBacentaIds'>,
): ListSilentDriftFlagsForActorQuery {
  switch (actor.role) {
    case 'BACENTA_LEADER':
      return actor.bacentaId ? { groupId: actor.bacentaId } : {};
    case 'ASSISTANT_PASTOR':
      return actor.clusterBacentaIds?.[0] ? { groupId: actor.clusterBacentaIds[0] } : {};
    default:
      // RESIDENT_PASTOR/ADMIN resolve to whole-Branch (BRANCH-scope rows).
      // Every other role has no scope row for this action at all - falls
      // through to the same `{}` query, which the backend will correctly
      // 403 rather than this hook trying to pre-empt that.
      return {};
  }
}

/** `GET /pastoral-care/silent-drift-flags` - the BRANCH-wide/optional-
 * `groupId` listing this milestone adds. Read-only: `SilentDriftFlagController`
 * exposes no mutation route at all (traced, not assumed - no `PATCH`/`POST`
 * exists anywhere on that controller), so there is no resolve/escalate
 * action to wire up here, unlike Follow-up Tasks. */
export function useSilentDriftFlags(
  accessToken: string | undefined,
  query: ListSilentDriftFlagsForActorQuery,
): AsyncDataResult<SilentDriftFlagResponseDto[]> {
  return useAsyncData<SilentDriftFlagResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams();
      if (query.groupId) params.set('groupId', query.groupId);
      if (query.status) params.set('status', query.status.join(','));
      const qs = params.toString();
      return apiGet<SilentDriftFlagResponseDto[]>(`/pastoral-care/silent-drift-flags${qs ? `?${qs}` : ''}`, {
        authToken: accessToken,
        signal,
      });
    },
    [accessToken, query.groupId, query.status?.join(',')],
  );
}
