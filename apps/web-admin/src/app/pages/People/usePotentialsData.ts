import type { CreatePotentialInput, ListPotentialsQuery, PotentialResponseDto, UpdatePotentialInput } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';

import { apiGet, apiPatch, apiPost } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` `GET /potentials`'s
 * default scope query - the same shape/reasoning as Outreach's
 * `resolveDefaultOutreachQuery` (`Outreach/useOutreachData.ts`), applied
 * to `people.potential.read`'s real scope rows (`permission-matrix.ts`,
 * traced not assumed): `BACENTA_LEADER`/`BASONTA_LEADER` OWN_GROUP,
 * `ASSISTANT_PASTOR` CLUSTER (defaults to the first Bacenta in the
 * cluster - see `usePotentialsListForGroups` for the real "every Bacenta
 * in my cluster" fan-out).
 *
 * Closes a real gap found during Milestone D's own D11 audit: all three
 * `PeopleListWorkspace` roles hold a working `people.potential.*` grant,
 * but the Potentials pipeline only had a web-admin surface on
 * `PeopleDirectoryPage` (`ADMIN`/`RESIDENT_PASTOR`/`ACTING_RESIDENT_PASTOR`).
 */
export function resolveDefaultPotentialsQuery(
  actor: Pick<ActorContext, 'role' | 'bacentaId' | 'basontaId' | 'clusterBacentaIds'>,
): ListPotentialsQuery {
  switch (actor.role) {
    case 'BACENTA_LEADER':
      return actor.bacentaId ? { groupId: actor.bacentaId } : {};
    case 'BASONTA_LEADER':
      return actor.basontaId ? { groupId: actor.basontaId } : {};
    case 'ASSISTANT_PASTOR':
      return actor.clusterBacentaIds?.[0] ? { groupId: actor.clusterBacentaIds[0] } : {};
    default:
      return {};
  }
}

export function usePotentialsList(accessToken: string | undefined, query: ListPotentialsQuery): AsyncDataResult<PotentialResponseDto[]> {
  return useAsyncData<PotentialResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams();
      if (query.groupId) params.set('groupId', query.groupId);
      const qs = params.toString();
      return apiGet<PotentialResponseDto[]>(`/potentials${qs ? `?${qs}` : ''}`, { authToken: accessToken, signal });
    },
    [accessToken, query.groupId],
  );
}

/** `[Branch Pastor portal precedent]` `ASSISTANT_PASTOR`'s real CLUSTER
 * grant spans every Bacenta in `clusterBacentaIds`, but `GET /potentials`
 * only accepts one `groupId` at a time - the exact same `Promise.all` +
 * dedupe-by-id shape `useOutreachListForGroups`/`usePeopleListForGroups`
 * already establish for the identical problem. */
export function usePotentialsListForGroups(accessToken: string | undefined, groupIds: string[]): AsyncDataResult<PotentialResponseDto[]> {
  return useAsyncData<PotentialResponseDto[]>(
    async (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      if (groupIds.length === 0) return [];
      const perGroup = await Promise.all(groupIds.map((groupId) => apiGet<PotentialResponseDto[]>(`/potentials?groupId=${groupId}`, { authToken: accessToken, signal })));
      const byId = new Map<string, PotentialResponseDto>();
      for (const potential of perGroup.flat()) byId.set(potential.id, potential);
      return [...byId.values()];
    },
    [accessToken, groupIds.join(',')],
  );
}

export function createPotential(accessToken: string, input: CreatePotentialInput): Promise<PotentialResponseDto> {
  return apiPost<PotentialResponseDto>('/potentials', input, { authToken: accessToken });
}

/** `PATCH /potentials/:id` - status/notes/assignment triage, or linking
 * to an existing Person (`updatePotentialSchema`'s own doc comment -
 * deliberately not a name/source/group edit). */
export function updatePotential(accessToken: string, potentialId: string, input: UpdatePotentialInput): Promise<PotentialResponseDto> {
  return apiPatch<PotentialResponseDto>(`/potentials/${potentialId}`, input, { authToken: accessToken });
}
