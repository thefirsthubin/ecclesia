import type { GroupResponseDto, OvercommitmentFlagResponseDto, RosterMemberResponseDto } from '@ecclesia/contracts';

import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

/**
 * `GET /groups?type=MINISTRY` (Ministry Web Admin sprint) - the Basonta
 * directory `BasontaDirectoryPage` needs. Only meaningful for BRANCH-scoped
 * actors (`GroupListResourceContextGuard` always resolves to the actor's
 * own Branch - see that guard's own doc comment and
 * `MINISTRY_PAGE_DESIGN_NOTES.md` §3 for why this page doesn't attempt to
 * call it for a Basonta Leader, who never needs a directory of one).
 */
export function useBasontaDirectory(accessToken: string | undefined): AsyncDataResult<GroupResponseDto[]> {
  return useAsyncData<GroupResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<GroupResponseDto[]>('/groups?type=MINISTRY', { authToken: accessToken, signal });
    },
    [accessToken],
  );
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
