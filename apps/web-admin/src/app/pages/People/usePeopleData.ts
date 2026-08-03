import type {
  GroupMembershipResponseDto,
  GroupResponseDto,
  ListPeopleQuery,
  PersonResponseDto,
  RoleAssignmentResponseDto,
  RoleDto,
} from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';

import { apiGet } from '../../lib/api-client';
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

export function useGroupName(accessToken: string | undefined, groupId: string): AsyncDataResult<GroupResponseDto> {
  return useAsyncData<GroupResponseDto>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<GroupResponseDto>(`/groups/${groupId}`, { authToken: accessToken, signal });
    },
    [accessToken, groupId],
  );
}
