import type { FollowUpTaskResponseDto, ListFollowUpTasksForActorQuery, PersonResponseDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { RecordOption } from '@ecclesia/ui-web';

import { apiGet, apiPatch } from '../../lib/api-client';
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

export function usePersonName(accessToken: string | undefined, personId: string): AsyncDataResult<PersonResponseDto> {
  return useAsyncData<PersonResponseDto>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<PersonResponseDto>(`/people/${personId}`, { authToken: accessToken, signal });
    },
    [accessToken, personId],
  );
}
