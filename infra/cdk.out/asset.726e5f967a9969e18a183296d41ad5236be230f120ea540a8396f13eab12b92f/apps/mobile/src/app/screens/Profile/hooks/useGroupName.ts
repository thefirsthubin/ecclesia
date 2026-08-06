import type { GroupResponseDto } from '@ecclesia/contracts';

import { apiGet } from '../../../lib/api-client';
import { useSession } from '../../../lib/session';
import { useAsyncData } from '../../ShepherdDashboard/hooks/useAsyncData';
import type { AsyncDataResult } from '../../ShepherdDashboard/hooks/useAsyncData';

/**
 * `GET /groups/:id` for the Shepherd's own Bacenta - `BACENTA_LEADER`
 * already holds `people.group.read` at `OWN_GROUP` scope
 * (`permission-matrix.ts`), the same grant `AttendanceCaptureScreen`'s
 * roster fetch relies on for `people.person.read`. No new backend work;
 * this is this screen's only genuinely new data need (name/role both
 * already resolve from existing session/auth state, not a fetch).
 */
export function useGroupName(): AsyncDataResult<GroupResponseDto> {
  const session = useSession();
  return useAsyncData(
    (signal) => apiGet<GroupResponseDto>(`/groups/${session.bacentaGroupId}`, { authToken: session.authToken, signal }),
    [session.bacentaGroupId, session.authToken],
  );
}

/**
 * `[Mobile Personas sprint]` The role-agnostic sibling `ProfileScreen`
 * now uses for every persona - `useGroupName()` above is left unchanged
 * (still exactly what it was: Shepherd-only, via `useSession()`), but
 * `ProfileScreen` itself is shared across all four personas and cannot
 * call a hook that throws for `TREASURER`/`RESIDENT_PASTOR`/
 * `ACTING_RESIDENT_PASTOR` (no `bacentaId`/`basontaId` at all - those
 * roles are `BRANCH`-scoped) or that fetches the wrong id for
 * `BASONTA_LEADER` (`basontaId`, not `bacentaId`).
 *
 * Takes an explicit, possibly-absent `groupId` rather than resolving one
 * itself from session state - React's Rules of Hooks require this hook to
 * be called unconditionally on every render regardless of role, so the
 * "does this role even have a group" branch has to live in the caller
 * (`ProfileScreen`), which already knows `actor.role`. When `groupId` is
 * `undefined` (Treasurer, Resident Pastor, Acting Resident Pastor - every
 * `BRANCH`-scoped persona this app has today), this resolves to `null`
 * with no network call at all, the same "skip the fetch, no HTTP round
 * trip for a case with nothing to fetch" pattern
 * `useShepherdDashboardData.ts`'s `useUpcomingMeeting`/
 * `useLastMeetingAttendance` already use for their own "nothing found"
 * case.
 */
export function useGroupNameById(groupId: string | undefined, authToken: string): AsyncDataResult<GroupResponseDto | null> {
  return useAsyncData(
    (signal) => (groupId ? apiGet<GroupResponseDto>(`/groups/${groupId}`, { authToken, signal }) : Promise.resolve(null)),
    [groupId, authToken],
  );
}
