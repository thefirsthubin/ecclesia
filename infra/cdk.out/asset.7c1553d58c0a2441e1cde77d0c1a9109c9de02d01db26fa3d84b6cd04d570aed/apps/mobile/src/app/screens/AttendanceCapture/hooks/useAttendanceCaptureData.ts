import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AttendanceRecordResponseDto, AttendanceStatusDto, GatheringResponseDto, PersonResponseDto } from '@ecclesia/contracts';

import { apiGet, apiPost } from '../../../lib/api-client';
import { useSession } from '../../../lib/session';

export interface RosterEntry {
  person: PersonResponseDto;
  status: AttendanceStatusDto | undefined;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'no-gathering' }
  | { status: 'ready'; gathering: GatheringResponseDto; roster: RosterEntry[] };

export interface UseAttendanceCaptureDataResult {
  state: LoadState;
  setStatus: (personId: string, status: AttendanceStatusDto) => void;
  hasUnsavedChanges: boolean;
  saving: boolean;
  saveError: string | undefined;
  save: () => Promise<boolean>;
  refetch: () => void;
}

/**
 * Data + save orchestration for the Attendance Capture screen — see
 * `ATTENDANCE_CAPTURE_DESIGN_NOTES.md` for the full endpoint-reuse
 * rationale. Three existing, unmodified endpoints, no new backend work:
 *
 * 1. `GET /gatherings?ownerGroupId=&from=&to=` (Shepherd Dashboard
 *    sprint) — narrowed to a single calendar day to find "today's"
 *    Bacenta Meeting.
 * 2. `GET /people?groupId=` (People Web Admin sprint) — the Bacenta's
 *    full roster with names, already `people.person.read`/OWN_GROUP for
 *    `BACENTA_LEADER`.
 * 3. `GET`/`POST /gatherings/:gatheringId/attendance-records`
 *    (Gatherings Web Admin sprint) — existing records to pre-populate the
 *    screen, and the same single-record `POST` fired once per changed row
 *    (in parallel, `Promise.all`) to save. No bulk-record endpoint was
 *    added: the `@@unique([gatheringId, personId])` upsert already makes
 *    re-recording a correction, not a duplicate, so N parallel calls are
 *    both correct and simple.
 */
export function useAttendanceCaptureData(): UseAttendanceCaptureDataResult {
  const session = useSession();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, AttendanceStatusDto>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    setPendingStatuses({});
    setSaveError(undefined);

    async function load() {
      try {
        // "Today" = the full local calendar day, so capture works any
        // time during/after the meeting, not only at its exact
        // scheduledStart.
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const gatherings = await apiGet<GatheringResponseDto[]>(
          `/gatherings?ownerGroupId=${session.bacentaGroupId}&from=${startOfDay.toISOString()}&to=${endOfDay.toISOString()}`,
          { authToken: session.authToken },
        );
        const gathering = gatherings[0];
        if (!gathering) {
          if (!cancelled) setState({ status: 'no-gathering' });
          return;
        }

        const [people, records] = await Promise.all([
          apiGet<PersonResponseDto[]>(`/people?groupId=${session.bacentaGroupId}`, { authToken: session.authToken }),
          apiGet<AttendanceRecordResponseDto[]>(`/gatherings/${gathering.id}/attendance-records`, {
            authToken: session.authToken,
          }),
        ]);

        const statusByPersonId = new Map(records.map((record) => [record.personId, record.status]));
        const roster: RosterEntry[] = people
          .slice()
          .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
          .map((person) => ({ person, status: statusByPersonId.get(person.id) }));

        if (!cancelled) setState({ status: 'ready', gathering, roster });
      } catch (error) {
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Something went wrong loading the roster.',
          });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // `reloadKey` is a deliberate manual re-trigger (bumped by `refetch`/
    // after a successful `save()`) - not read inside `load()` itself, only
    // included in the dependency array to force this effect to re-run.
  }, [session.bacentaGroupId, session.authToken, reloadKey]);

  const setStatus = useCallback((personId: string, status: AttendanceStatusDto) => {
    setPendingStatuses((prev) => ({ ...prev, [personId]: status }));
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    if (state.status !== 'ready' || Object.keys(pendingStatuses).length === 0) {
      return true;
    }
    setSaving(true);
    setSaveError(undefined);
    try {
      await Promise.all(
        Object.entries(pendingStatuses).map(([personId, status]) =>
          apiPost<AttendanceRecordResponseDto>(
            `/gatherings/${state.gathering.id}/attendance-records`,
            { personId, status },
            { authToken: session.authToken },
          ),
        ),
      );
      setPendingStatuses({});
      setReloadKey((key) => key + 1);
      return true;
    } catch {
      // Partial-failure is possible (some of the N parallel POSTs
      // succeeded, some didn't) - re-fetching on retry (via the Save
      // button, which stays enabled) picks up whatever did save and
      // leaves only the still-unsaved rows in `pendingStatuses`... except
      // `pendingStatuses` isn't cleared here on purpose, so the user's
      // taps aren't lost and Save can simply be pressed again.
      setSaveError('Some records failed to save. Check your connection and try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [state, pendingStatuses, session.authToken]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  const mergedState = useMemo<LoadState>(() => {
    if (state.status !== 'ready') return state;
    return {
      ...state,
      roster: state.roster.map((entry) => ({
        ...entry,
        status: pendingStatuses[entry.person.id] ?? entry.status,
      })),
    };
  }, [state, pendingStatuses]);

  return {
    state: mergedState,
    setStatus,
    hasUnsavedChanges: Object.keys(pendingStatuses).length > 0,
    saving,
    saveError,
    save,
    refetch,
  };
}
