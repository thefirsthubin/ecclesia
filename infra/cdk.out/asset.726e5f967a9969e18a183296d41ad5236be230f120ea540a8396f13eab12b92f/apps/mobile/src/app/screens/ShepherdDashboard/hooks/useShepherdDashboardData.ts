import type {
  AttendanceRecordResponseDto,
  FollowUpTaskResponseDto,
  GatheringResponseDto,
  GroupDashboardResponseDto,
  PersonResponseDto,
  SilentDriftFlagResponseDto,
} from '@ecclesia/contracts';

import { apiGet } from '../../../lib/api-client';
import { useSession } from '../../../lib/session';
import { useAsyncData } from './useAsyncData';
import type { AsyncDataResult } from './useAsyncData';

/**
 * One hook per dashboard card (STEP 5's data-requirements table). Every
 * hook is a thin `apiGet` + `useAsyncData` composition against the exact
 * endpoints named in `SHEPHERD_DASHBOARD_DESIGN_NOTES.md` STEP 6 — no
 * client-side data transformation beyond what's noted there (e.g.
 * `useAttendanceSummary` composing two existing endpoints instead of a
 * new aggregation one).
 */

/** ChurchPulseCard + NotificationsCard both read this one response
 * (§16.6's "Alert inbox: embedded per-dashboard" decision, inherited
 * here rather than re-decided — see design notes). */
export function useBacentaDashboard(): AsyncDataResult<GroupDashboardResponseDto> {
  const session = useSession();
  return useAsyncData(
    (signal) =>
      apiGet<GroupDashboardResponseDto>(`/insights/bacenta-dashboard/${session.bacentaGroupId}`, {
        authToken: session.authToken,
        signal,
      }),
    [session.bacentaGroupId, session.authToken],
  );
}

export function useOpenFollowUpTasks(): AsyncDataResult<FollowUpTaskResponseDto[]> {
  const session = useSession();
  return useAsyncData(
    (signal) =>
      apiGet<FollowUpTaskResponseDto[]>(`/pastoral-care/groups/${session.bacentaGroupId}/follow-up-tasks?status=OPEN,ESCALATED`, {
        authToken: session.authToken,
        signal,
      }),
    [session.bacentaGroupId, session.authToken],
  );
}

export function useSilentDriftFlags(): AsyncDataResult<SilentDriftFlagResponseDto[]> {
  const session = useSession();
  return useAsyncData(
    (signal) =>
      apiGet<SilentDriftFlagResponseDto[]>(
        `/pastoral-care/groups/${session.bacentaGroupId}/silent-drift-flags?status=FLAGGED,ESCALATED`,
        { authToken: session.authToken, signal },
      ),
    [session.bacentaGroupId, session.authToken],
  );
}

/** RecentActivityCard reuses the same two endpoints above, filtered to
 * resolved/completed items client-side (STEP 5: "no extra network
 * call") — exposed here as its own hook so the card doesn't need to know
 * about Priority card's hooks directly. */
export function useRecentlyResolved(): AsyncDataResult<{
  followUps: FollowUpTaskResponseDto[];
  driftFlags: SilentDriftFlagResponseDto[];
}> {
  const session = useSession();
  return useAsyncData(
    async (signal) => {
      const [followUps, driftFlags] = await Promise.all([
        apiGet<FollowUpTaskResponseDto[]>(`/pastoral-care/groups/${session.bacentaGroupId}/follow-up-tasks?status=COMPLETED`, {
          authToken: session.authToken,
          signal,
        }),
        apiGet<SilentDriftFlagResponseDto[]>(`/pastoral-care/groups/${session.bacentaGroupId}/silent-drift-flags?status=RESOLVED`, {
          authToken: session.authToken,
          signal,
        }),
      ]);
      return { followUps: followUps.slice(0, 5), driftFlags: driftFlags.slice(0, 5) };
    },
    [session.bacentaGroupId, session.authToken],
  );
}

/** TodaysMeetingCard: the earliest upcoming Bacenta Meeting in the next
 * 7 days (STEP 5). */
export function useUpcomingMeeting(): AsyncDataResult<GatheringResponseDto | null> {
  const session = useSession();
  return useAsyncData(
    async (signal) => {
      const now = new Date();
      const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const gatherings = await apiGet<GatheringResponseDto[]>(
        `/gatherings?ownerGroupId=${session.bacentaGroupId}&from=${now.toISOString()}&to=${to.toISOString()}`,
        { authToken: session.authToken, signal },
      );
      return gatherings[0] ?? null;
    },
    [session.bacentaGroupId, session.authToken],
  );
}

/** AttendanceSummaryCard: the most recent *past* Bacenta Meeting and its
 * attendance records, composed from two existing endpoints (STEP 6 —
 * "do not invent APIs, reuse existing endpoints where possible"). */
export function useLastMeetingAttendance(): AsyncDataResult<{
  gathering: GatheringResponseDto;
  records: AttendanceRecordResponseDto[];
} | null> {
  const session = useSession();
  return useAsyncData(
    async (signal) => {
      const now = new Date();
      const from = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const gatherings = await apiGet<GatheringResponseDto[]>(
        `/gatherings?ownerGroupId=${session.bacentaGroupId}&from=${from.toISOString()}&to=${now.toISOString()}`,
        { authToken: session.authToken, signal },
      );
      const lastGathering = gatherings.at(-1);
      if (!lastGathering) {
        return null;
      }
      const records = await apiGet<AttendanceRecordResponseDto[]>(`/gatherings/${lastGathering.id}/attendance-records`, {
        authToken: session.authToken,
        signal,
      });
      return { gathering: lastGathering, records };
    },
    [session.bacentaGroupId, session.authToken],
  );
}

/** Used by row components (a flagged member, a follow-up subject) to
 * show a name instead of a bare UUID — reuses the existing
 * `GET /people/:id` endpoint (`people.person.read`, already
 * `OWN_GROUP`-scoped for `BACENTA_LEADER`), not a new batch/aggregation
 * endpoint, consistent with STEP 6's "reuse existing endpoints" rule.
 * Row lists are capped at 5 (STEP 4/5), so this is at most 5 small,
 * independently-cached-by-the-browser requests per card, not an
 * unbounded N+1. */
export function usePersonName(personId: string): AsyncDataResult<PersonResponseDto> {
  const session = useSession();
  return useAsyncData(
    (signal) => apiGet<PersonResponseDto>(`/people/${personId}`, { authToken: session.authToken, signal }),
    [personId, session.authToken],
  );
}
