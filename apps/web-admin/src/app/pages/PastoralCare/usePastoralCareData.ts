import type { FollowUpTaskResponseDto, ListFollowUpTasksForActorQuery, PersonResponseDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';

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

export function usePersonName(accessToken: string | undefined, personId: string): AsyncDataResult<PersonResponseDto> {
  return useAsyncData<PersonResponseDto>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<PersonResponseDto>(`/people/${personId}`, { authToken: accessToken, signal });
    },
    [accessToken, personId],
  );
}
