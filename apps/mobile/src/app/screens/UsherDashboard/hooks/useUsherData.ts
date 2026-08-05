import type {
  AttendanceRecordResponseDto,
  GatheringResponseDto,
  GroupResponseDto,
  LifecycleStageDto,
  PersonResponseDto,
  RecordAttendanceInput,
  SubmitVisitorIntakeInput,
  VisitorIntakeResponseDto,
} from '@ecclesia/contracts';
import type { RecordOption } from '@ecclesia/ui-native';

import { apiGet, apiPost } from '../../../lib/api-client';
import { useActorSession } from '../../../lib/session';
import { useAsyncData } from '../../ShepherdDashboard/hooks/useAsyncData';
import type { AsyncDataResult } from '../../ShepherdDashboard/hooks/useAsyncData';

/**
 * Usher (`USHER`) data hooks - shared across all three Usher screens
 * (Dashboard/Attendance/Visitor Intake), the same cross-screen reuse
 * pattern `useMinistryData.ts`/`useFinanceData.ts`/`usePastorData.ts`
 * already established. `USHER` is `BRANCH`-scoped for every action here
 * (`permission-matrix.ts` - see `USHER_ROLE_PROPOSAL.md`), so
 * `useActorSession()` is all that's needed, no group-scoped session hook.
 */

/** Today's Branch-wide Gathering (typically Sunday Service, `ownerGroupId`
 * `null`) - `GET /gatherings?from=&to=`, `ownerGroupId` omitted so the
 * query resolves against the actor's whole Branch
 * (`GatheringListResourceContextGuard`'s own "absence falls back to the
 * actor's own Branch" doc comment) rather than a single Bacenta/Basonta
 * the way `AttendanceCaptureScreen`'s `useAttendanceCaptureData.ts` does -
 * an Usher leads no single Group to scope to. Same "full local calendar
 * day, first result wins" scoping decision that screen's own design notes
 * already disclose, reused here rather than reinvented; same disclosed
 * edge case if more than one Gathering is scheduled Branch-wide today. */
export function useTodayGathering(): AsyncDataResult<GatheringResponseDto | null> {
  const session = useActorSession();
  return useAsyncData((signal) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return apiGet<GatheringResponseDto[]>(`/gatherings?from=${startOfDay.toISOString()}&to=${endOfDay.toISOString()}`, {
      authToken: session.authToken,
      signal,
    }).then((gatherings) => gatherings[0] ?? null);
  }, [session.authToken]);
}

/** Attendance already recorded for a Gathering - the "N recorded so far"
 * progress indicator on both the Dashboard and Attendance tabs. `null`
 * `gatheringId` (no Gathering scheduled today) resolves to an empty list
 * rather than skipping the fetch entirely, so callers get a normal
 * `'success'` state with zero rows instead of a permanently `'loading'`
 * one. */
export function useAttendanceRecords(gatheringId: string | null): AsyncDataResult<AttendanceRecordResponseDto[]> {
  const session = useActorSession();
  return useAsyncData(
    (signal) =>
      gatheringId
        ? apiGet<AttendanceRecordResponseDto[]>(`/gatherings/${gatheringId}/attendance-records`, { authToken: session.authToken, signal })
        : Promise.resolve([]),
    [gatheringId, session.authToken],
  );
}

/** `POST /gatherings/:id/attendance-records` - always `PRESENT`. Unlike
 * `AttendanceCaptureScreen`'s roster-toggle-then-batch-save shape (staged
 * local edits, one `Save` action), an Usher's flow is inherently one
 * person at a time as they walk through the door - `[Design Decision,
 * Usher role milestone]` each search-and-select immediately records that
 * one person, no batching. `AttendanceRecordRepository.upsert()`'s own
 * `@@unique([gatheringId, personId])` keying makes a mistaken duplicate
 * tap a harmless correction (re-recording `PRESENT` for the same pair),
 * not a new row - the same fact `AttendanceCaptureScreen`'s own hook
 * leans on. */
export function recordAttendance(authToken: string, gatheringId: string, personId: string): Promise<AttendanceRecordResponseDto> {
  const input: RecordAttendanceInput = { personId, status: 'PRESENT' };
  return apiPost<AttendanceRecordResponseDto>(`/gatherings/${gatheringId}/attendance-records`, input, { authToken });
}

/** Human-readable label per `LifecycleStageDto` - used only for the
 * search result's optional `description`, never a full profile field. */
const LIFECYCLE_LABELS: Record<LifecycleStageDto, string> = {
  VISITOR: 'Visitor',
  FIRST_TIME_GUEST: 'First-time guest',
  FOLLOW_UP: 'Follow-up',
  LAPSED: 'Lapsed',
  ASSIGNED_TO_BACENTA: 'Assigned to Bacenta',
  SIX_WEEKS_PARTICIPATION: 'Six-week participation',
  MEMBER: 'Member',
};

/**
 * `[Design Decision, Usher role milestone]` `RecordPicker`'s `onSearch`
 * for the Attendance tab's search-and-check-in flow - reuses `GET
 * /people?search=`, the same endpoint/query param
 * `searchPeopleForEscalation` (`FollowUpQueue/hooks/useFollowUpActions.ts`)
 * and `AttendanceCaptureScreen`'s own roster fetch already use.
 *
 * **Deliberately narrower `RecordOption` mapping than
 * `searchPeopleForEscalation`'s**, which puts `phone ?? email` in
 * `description`. `people.person.read`'s grant for `USHER`
 * (`permission-matrix.ts`) is `BRANCH`-scoped, wider than any other role
 * this app authenticates as, and the API still returns the full
 * `PersonResponseDto` regardless - `libs/rbac` has no field-level
 * restriction mechanism to narrow that response server-side (checked - no
 * `PersonSummary`/name-only DTO exists anywhere in this codebase). This
 * function is the actual enforcement point instead: it only ever reads
 * `firstName`/`lastName`/`lifecycleStage` off each result and discards
 * everything else the API returned (`phone`, `email`, `dateOfBirth`,
 * `address`, `guardianPersonId`) before it ever reaches a component or a
 * render. A known, disclosed limitation, not a solved one - see
 * `USHER_ROLE_DESIGN_NOTES.md` for the full tradeoff and
 * `permission-matrix.ts`'s own `reason` on this grant.
 */
export async function searchPeopleForAttendance(authToken: string, query: string): Promise<RecordOption[]> {
  const params = new URLSearchParams();
  if (query.trim()) params.set('search', query.trim());
  const qs = params.toString();
  const people = await apiGet<PersonResponseDto[]>(`/people${qs ? `?${qs}` : ''}`, { authToken });
  return people.map(
    (person: PersonResponseDto): RecordOption => ({
      id: person.id,
      label: `${person.firstName} ${person.lastName}`,
      description: person.lifecycleStage === 'MEMBER' ? undefined : LIFECYCLE_LABELS[person.lifecycleStage],
    }),
  );
}

/** Every Bacenta in the Branch (`GET /groups?type=PASTORAL_CARE`,
 * `people.group.read` at `BRANCH` scope - added specifically for this,
 * see `permission-matrix.ts`'s own `reason`). Same endpoint
 * `usePastorData.ts`'s `useBacentaGroups` already uses for the Resident
 * Pastor's Branch tab - duplicated here rather than cross-imported
 * between two personas' own hook files, the same "small per-page glue,
 * not worth extracting" precedent this codebase already established
 * elsewhere. `VisitorIntakeScreen` fetches this once and filters it
 * client-side for its Bacenta-preference picker - the number of Bacentas
 * in a Branch is small and bounded, unlike `people.person.read`'s
 * unbounded search, so there is no server-side `search` param to call
 * repeatedly here (`listGroupsQuerySchema` only has `type`). */
export function useBacentaGroups(): AsyncDataResult<GroupResponseDto[]> {
  const session = useActorSession();
  return useAsyncData(
    (signal) => apiGet<GroupResponseDto[]>('/groups?type=PASTORAL_CARE', { authToken: session.authToken, signal }),
    [session.authToken],
  );
}

/** `POST /visitor-intake` (FR-GTH-04/US-A1) - this app's (and this
 * codebase's) first frontend consumer of this endpoint; it has existed,
 * unconsumed, since the Gatherings sprint (`GATHERINGS_DESIGN_NOTES.md`).
 * `gatheringId` is optional on the wire (`submitVisitorIntakeSchema`) -
 * `VisitorIntakeScreen` attaches today's Gathering id when one was found,
 * but submission is not blocked on one existing (a guest's details
 * shouldn't be lost just because no Gathering row happens to match
 * today). */
export function submitVisitorIntake(authToken: string, input: SubmitVisitorIntakeInput): Promise<VisitorIntakeResponseDto> {
  return apiPost<VisitorIntakeResponseDto>('/visitor-intake', input, { authToken });
}
