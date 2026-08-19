import type { GroupResponseDto, PersonResponseDto, PotentialResponseDto } from '@ecclesia/contracts';

import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

export interface BacentaDirectoryCard {
  group: GroupResponseDto;
  members: PersonResponseDto[];
}

export interface PeopleDirectoryData {
  bacentas: BacentaDirectoryCard[];
  firstTimeGuests: PersonResponseDto[];
  visitors: PersonResponseDto[];
  potentials: PotentialResponseDto[];
  /** Branch-wide People with no active Bacenta (`PASTORAL_CARE` Group)
   * membership at all - derived, not a dedicated endpoint (none exists;
   * see this hook's own doc comment). */
  peopleWithoutBacenta: PersonResponseDto[];
}

/**
 * `[Milestone D — Portal Experiences]` Powers `PeopleDirectoryPage` (the
 * Bacenta-organized People view for `ADMIN`/`RESIDENT_PASTOR`/
 * `ACTING_RESIDENT_PASTOR` - Portal 2/5's "People should be organized
 * primarily by Bacenta" requirement). Composes four real endpoints, no
 * new backend capability:
 *
 * - `GET /people` (no `groupId` - these three roles' real
 *   `people.person.read` grant is BRANCH-wide) for the full Branch roster,
 *   the source for the First-time-guest/Visitor lifecycle buckets and for
 *   deriving "no Bacenta" below.
 * - `GET /groups?type=PASTORAL_CARE` for the Branch's real Bacenta list
 *   (BRANCH-scope only, per `searchGroupsForAssignment`'s own doc comment
 *   - correct for these three roles).
 * - `GET /people?groupId=X` once per Bacenta (`Promise.all`) for each
 *   card's real roster/count - the same fan-out shape
 *   `useBacentaPerformance`/`usePeopleListForGroups`
 *   (`DashboardPage/useBranchPastorDashboardData.ts`,
 *   `People/usePeopleData.ts`) already establish for "one request per
 *   Bacenta the actor's scope covers," not a new pattern.
 * - `GET /potentials` (no `groupId` - same BRANCH-wide fallback
 *   `PotentialService.list` documents for a COUNCIL/BRANCH actor).
 *
 * **"People without a Bacenta" is derived, not fetched** - no endpoint
 * answers "who has no active Group membership" directly. This unions
 * every Bacenta roster fetched above into one id set and subtracts it
 * from the full Branch roster - real people, real membership facts, just
 * computed client-side from data already on hand rather than invented.
 */
/** The one piece of real logic in this file, extracted so it's directly
 * unit-testable without mocking `fetch` - mirrors
 * `useBranchPastorDashboardData.ts`'s own `sumSundayAttendance`/
 * `sumMeetingOffering` precedent for the same reason: a hook's fetcher
 * body should stay thin wiring, real computation should be a plain
 * function. `bacentaGroups[i]`'s roster is `rosters[i]` - the two arrays
 * are built from the same `Promise.all` call in the same order, so this
 * is a safe positional zip, not an assumption. */
export function deriveDirectoryData(
  allPeople: PersonResponseDto[],
  bacentaGroups: GroupResponseDto[],
  rosters: PersonResponseDto[][],
  potentials: PotentialResponseDto[],
): PeopleDirectoryData {
  const inBacentaIds = new Set<string>();
  const bacentas: BacentaDirectoryCard[] = bacentaGroups.map((group, index) => {
    const members = rosters[index] ?? [];
    for (const person of members) inBacentaIds.add(person.id);
    return { group, members };
  });

  return {
    bacentas,
    firstTimeGuests: allPeople.filter((person) => person.lifecycleStage === 'FIRST_TIME_GUEST'),
    visitors: allPeople.filter((person) => person.lifecycleStage === 'VISITOR'),
    potentials,
    peopleWithoutBacenta: allPeople.filter((person) => !inBacentaIds.has(person.id)),
  };
}

export function usePeopleDirectory(accessToken: string | undefined): AsyncDataResult<PeopleDirectoryData> {
  return useAsyncData<PeopleDirectoryData>(
    async (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));

      const [allPeople, bacentaGroups, potentials] = await Promise.all([
        apiGet<PersonResponseDto[]>('/people', { authToken: accessToken, signal }),
        apiGet<GroupResponseDto[]>('/groups?type=PASTORAL_CARE', { authToken: accessToken, signal }),
        apiGet<PotentialResponseDto[]>('/potentials', { authToken: accessToken, signal }),
      ]);

      const rosters = await Promise.all(
        bacentaGroups.map((group) => apiGet<PersonResponseDto[]>(`/people?groupId=${group.id}`, { authToken: accessToken, signal })),
      );

      return deriveDirectoryData(allPeople, bacentaGroups, rosters, potentials);
    },
    [accessToken],
  );
}
