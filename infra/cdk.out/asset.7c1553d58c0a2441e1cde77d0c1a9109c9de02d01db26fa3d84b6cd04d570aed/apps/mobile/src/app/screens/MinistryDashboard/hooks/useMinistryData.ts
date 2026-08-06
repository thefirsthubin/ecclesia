import type { GatheringResponseDto, OvercommitmentFlagResponseDto, RosterMemberResponseDto } from '@ecclesia/contracts';

import { apiGet, apiPost } from '../../../lib/api-client';
import { useMinistrySession } from '../../../lib/session';
import { useAsyncData } from '../../ShepherdDashboard/hooks/useAsyncData';
import type { AsyncDataResult } from '../../ShepherdDashboard/hooks/useAsyncData';

/**
 * Ministry Leader (`BASONTA_LEADER`) data hooks - the Mobile Personas
 * sprint's counterpart to `ShepherdDashboard/hooks/useShepherdDashboardData.ts`.
 * Shared across all three Ministry Leader screens (Dashboard/Roster/
 * Events), the same cross-screen reuse `ShepherdDashboard`'s own hooks
 * file already established for `FollowUpQueueScreen`/`ProfileScreen`.
 * Every endpoint here already exists (`RosterController`,
 * `GatheringController`) - `gatherings.gathering.read`/`.create` at
 * `OWN_GROUP` for `BASONTA_LEADER` (the `.read` grant added this same
 * sprint - see `permission-matrix.ts`).
 */

export function useRoster(): AsyncDataResult<RosterMemberResponseDto[]> {
  const session = useMinistrySession();
  return useAsyncData(
    (signal) =>
      apiGet<RosterMemberResponseDto[]>(`/ministry/groups/${session.basontaGroupId}/roster`, {
        authToken: session.authToken,
        signal,
      }),
    [session.basontaGroupId, session.authToken],
  );
}

export function useOvercommitmentFlags(): AsyncDataResult<OvercommitmentFlagResponseDto[]> {
  const session = useMinistrySession();
  return useAsyncData(
    (signal) =>
      apiGet<OvercommitmentFlagResponseDto[]>(`/ministry/groups/${session.basontaGroupId}/roster/overcommitment`, {
        authToken: session.authToken,
        signal,
      }),
    [session.basontaGroupId, session.authToken],
  );
}

/** Every Ministry Event (Gathering with `ownerGroupId` = this Basonta)
 * from 30 days back through 60 days out - a wider window than the
 * Shepherd Dashboard's own `useUpcomingMeeting`/`useLastMeetingAttendance`
 * (which each look one direction only), since this screen is a real
 * browsable list, not a single "next/last" card. */
export function useMinistryEvents(): AsyncDataResult<GatheringResponseDto[]> {
  const session = useMinistrySession();
  return useAsyncData(
    (signal) => {
      const now = new Date();
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const to = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      return apiGet<GatheringResponseDto[]>(
        `/gatherings?ownerGroupId=${session.basontaGroupId}&from=${from.toISOString()}&to=${to.toISOString()}`,
        { authToken: session.authToken, signal },
      );
    },
    [session.basontaGroupId, session.authToken],
  );
}

export interface CreateMinistryEventInput {
  type: string;
  scheduledStart: string;
  venue?: string;
}

/** `POST /gatherings` scoped to this Basonta via `ownerGroupId` -
 * `GatheringCreateResourceContextGuard` resolves `OWN_GROUP` scope from
 * this exact field (see that guard's own doc comment), so no separate
 * "which group" input is needed - it's always this Ministry Leader's own
 * Basonta. */
export function createMinistryEvent(
  authToken: string,
  basontaGroupId: string,
  input: CreateMinistryEventInput,
): Promise<GatheringResponseDto> {
  return apiPost<GatheringResponseDto>('/gatherings', { ...input, ownerGroupId: basontaGroupId }, { authToken });
}
