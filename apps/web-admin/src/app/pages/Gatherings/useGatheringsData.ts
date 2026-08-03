import type { GatheringResponseDto, ListGatheringsQuery } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';

import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

export interface AttendanceCompletenessResult {
  incomplete: boolean;
  reason: string;
}

/**
 * Resolves the `GET /gatherings` query for the current actor's role - the
 * same shape/reasoning as People's `resolveDefaultPeopleQuery` and
 * Pastoral Care's `resolveDefaultFollowUpTaskQuery`, applied to
 * `gatherings.gathering.read`'s scope rows. See
 * `GATHERINGS_PAGE_DESIGN_NOTES.md` §3 for the full per-role table,
 * including why only `BACENTA_LEADER` gets an OWN_GROUP branch here -
 * `ASSISTANT_PASTOR`/`BASONTA_LEADER` hold no `.read` row on this action
 * at all yet (a pre-existing gap this sprint didn't fix - not the gap
 * this page needed closed).
 */
export function resolveDefaultGatheringsQuery(
  actor: Pick<ActorContext, 'role' | 'bacentaId'>,
): Pick<ListGatheringsQuery, 'ownerGroupId'> {
  if (actor.role === 'BACENTA_LEADER' && actor.bacentaId) {
    return { ownerGroupId: actor.bacentaId };
  }
  // RESIDENT_PASTOR/ADMIN resolve to whole-Branch (BRANCH-scope rows).
  // Every other role either has no scope row for this action at all, or
  // (BACENTA_LEADER with no bacentaId set) nothing to default to -
  // falls through to the same `{}` query, which the backend correctly
  // 403s rather than this hook trying to pre-empt that.
  return {};
}

export function useGatheringsList(accessToken: string | undefined, query: ListGatheringsQuery): AsyncDataResult<GatheringResponseDto[]> {
  return useAsyncData<GatheringResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams();
      if (query.ownerGroupId) params.set('ownerGroupId', query.ownerGroupId);
      if (query.type) params.set('type', query.type);
      const qs = params.toString();
      return apiGet<GatheringResponseDto[]>(`/gatherings${qs ? `?${qs}` : ''}`, { authToken: accessToken, signal });
    },
    [accessToken, query.ownerGroupId, query.type],
  );
}

/** `GET /gatherings/:id/attendance-records/completeness` (FR-GTH-05).
 * Not backed by a `libs/contracts` response schema - the endpoint returns
 * `libs/domain/gatherings`'s `AttendanceCompletenessOutcome` shape
 * directly, unvalidated on the way out (this codebase only runs
 * `ZodValidationPipe` against request bodies/queries, never responses). */
export function useAttendanceCompleteness(
  accessToken: string | undefined,
  gatheringId: string,
): AsyncDataResult<AttendanceCompletenessResult> {
  return useAsyncData<AttendanceCompletenessResult>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<AttendanceCompletenessResult>(`/gatherings/${gatheringId}/attendance-records/completeness`, {
        authToken: accessToken,
        signal,
      });
    },
    [accessToken, gatheringId],
  );
}
