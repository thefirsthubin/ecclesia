import type {
  CreateOutreachContactInput,
  CreateOutreachInput,
  ListOutreachQuery,
  OutreachContactResponseDto,
  OutreachResponseDto,
  PromoteOutreachContactInput,
  UpdateOutreachContactOutcomeInput,
} from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';

import { apiGet, apiPost, apiPatch } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

/**
 * `[Milestone D — Portal Experiences, Portal 3: Bacenta Leader]` `GET
 * /outreach`'s default scope query - the same shape/reasoning as
 * People's `resolveDefaultPeopleQuery`/Pastoral Care's
 * `resolveDefaultFollowUpTaskQuery`, applied to `outreach.event.read`'s
 * real scope rows (`permission-matrix.ts`): `BACENTA_LEADER`/
 * `BASONTA_LEADER` OWN_GROUP, `ASSISTANT_PASTOR` CLUSTER (defaults to the
 * first Bacenta in the cluster - see `useOutreachListForGroups` for the
 * real "every Bacenta in my cluster" fan-out), `RESIDENT_PASTOR` COUNCIL
 * read-only (no `groupId` - Branch-wide from this Branch's own view).
 */
export function resolveDefaultOutreachQuery(
  actor: Pick<ActorContext, 'role' | 'bacentaId' | 'basontaId' | 'clusterBacentaIds'>,
): ListOutreachQuery {
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

export function useOutreachList(accessToken: string | undefined, query: ListOutreachQuery): AsyncDataResult<OutreachResponseDto[]> {
  return useAsyncData<OutreachResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams();
      if (query.groupId) params.set('groupId', query.groupId);
      if (query.from) params.set('from', query.from);
      if (query.to) params.set('to', query.to);
      const qs = params.toString();
      return apiGet<OutreachResponseDto[]>(`/outreach${qs ? `?${qs}` : ''}`, { authToken: accessToken, signal });
    },
    [accessToken, query.groupId, query.from, query.to],
  );
}

/** `[Branch Pastor portal precedent]` `ASSISTANT_PASTOR`'s real CLUSTER
 * grant spans every Bacenta in `clusterBacentaIds`, but `GET /outreach`
 * only accepts one `groupId` at a time - the exact same `Promise.all` +
 * dedupe-by-id shape `usePeopleListForGroups`
 * (`People/usePeopleData.ts`) already establishes for the identical
 * problem. */
export function useOutreachListForGroups(accessToken: string | undefined, groupIds: string[]): AsyncDataResult<OutreachResponseDto[]> {
  return useAsyncData<OutreachResponseDto[]>(
    async (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      if (groupIds.length === 0) return [];
      const perGroup = await Promise.all(
        groupIds.map((groupId) => apiGet<OutreachResponseDto[]>(`/outreach?groupId=${groupId}`, { authToken: accessToken, signal })),
      );
      const byId = new Map<string, OutreachResponseDto>();
      for (const outreach of perGroup.flat()) byId.set(outreach.id, outreach);
      return [...byId.values()];
    },
    [accessToken, groupIds.join(',')],
  );
}

export function createOutreach(accessToken: string, input: CreateOutreachInput): Promise<OutreachResponseDto> {
  return apiPost<OutreachResponseDto>('/outreach', input, { authToken: accessToken });
}

export function useOutreachContacts(accessToken: string | undefined, outreachId: string | null): AsyncDataResult<OutreachContactResponseDto[]> {
  return useAsyncData<OutreachContactResponseDto[]>(
    (signal) => {
      if (!accessToken || !outreachId) return Promise.reject(new Error('not authenticated or no Outreach selected'));
      return apiGet<OutreachContactResponseDto[]>(`/outreach/${outreachId}/contacts`, { authToken: accessToken, signal });
    },
    [accessToken, outreachId],
  );
}

export function createOutreachContact(accessToken: string, outreachId: string, input: CreateOutreachContactInput): Promise<OutreachContactResponseDto> {
  return apiPost<OutreachContactResponseDto>(`/outreach/${outreachId}/contacts`, input, { authToken: accessToken });
}

export function updateOutreachContactOutcome(accessToken: string, contactId: string, input: UpdateOutreachContactOutcomeInput): Promise<OutreachContactResponseDto> {
  return apiPatch<OutreachContactResponseDto>(`/outreach/contacts/${contactId}/outcome`, input, { authToken: accessToken });
}

/** `POST /outreach/contacts/:id/promote` - the lazy-promotion action
 * (`OutreachContactService.promote`'s own doc comment, `apps/api`). */
export function promoteOutreachContact(accessToken: string, contactId: string, input: PromoteOutreachContactInput): Promise<OutreachContactResponseDto> {
  return apiPost<OutreachContactResponseDto>(`/outreach/contacts/${contactId}/promote`, input, { authToken: accessToken });
}
