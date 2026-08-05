import type { PersonResponseDto } from '@ecclesia/contracts';

import { apiGet } from './api-client';
import { useAsyncData } from '../screens/ShepherdDashboard/hooks/useAsyncData';
import type { AsyncDataResult } from '../screens/ShepherdDashboard/hooks/useAsyncData';

/**
 * `[Mobile Personas sprint]` The role-agnostic sibling of
 * `ShepherdDashboard/hooks/useShepherdDashboardData.ts`'s own
 * `usePersonName` - that one derives its `authToken` from `useSession()`,
 * which throws for any actor without a `bacentaId` (Shepherd-only, by
 * that hook's own design). This version takes `authToken` as an explicit
 * argument instead, so it works from any persona's own session hook
 * (`useMinistrySession`, `useActorSession`, ...) without depending on
 * which one. Same `GET /people/:id` call, same shape, otherwise
 * unchanged - not a new endpoint or a new caching strategy.
 */
export function usePersonNameByToken(personId: string, authToken: string): AsyncDataResult<PersonResponseDto> {
  return useAsyncData(
    (signal) => apiGet<PersonResponseDto>(`/people/${personId}`, { authToken, signal }),
    [personId, authToken],
  );
}
