import type { CreateStaffingTargetInput, PersonResponseDto, StaffingTargetResponseDto } from '@ecclesia/contracts';
import type { RecordOption } from '@ecclesia/ui-web';

import { apiGet, apiPost } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

/**
 * `[Remaining Engineering Sprint, Milestone 11]` `GET
 * /ministry/staffing-targets?groupId=` - the Staffing Overview list this
 * sprint's backend addition makes possible (`staffing-target.controller.ts`'s
 * own doc comment). Every returned `StaffingTargetResponseDto` already
 * embeds the live-computed `rosteredCount`/`ratio`/`isAdequate` the
 * service's `toResponseDto` always attaches - no separate adequacy fetch
 * needed.
 */
export function useStaffingTargets(accessToken: string | undefined, groupId: string | undefined): AsyncDataResult<StaffingTargetResponseDto[]> {
  return useAsyncData<StaffingTargetResponseDto[]>(
    (signal) => {
      if (!accessToken || !groupId) return Promise.reject(new Error('not authenticated or no Basonta selected'));
      return apiGet<StaffingTargetResponseDto[]>(`/ministry/staffing-targets?groupId=${encodeURIComponent(groupId)}`, {
        authToken: accessToken,
        signal,
      });
    },
    [accessToken, groupId],
  );
}

/** `POST /ministry/staffing-targets` - doubles as "set or correct" (the
 * repository's own upsert on the `(gatheringId, groupId)` unique pair),
 * so this same call backs both "+ Set Staffing Target" and each row's
 * "Edit" action - Edit is just this call pre-filled with the existing
 * `targetCount`. */
export function setStaffingTarget(accessToken: string, input: CreateStaffingTargetInput): Promise<StaffingTargetResponseDto> {
  return apiPost<StaffingTargetResponseDto>('/ministry/staffing-targets', input, { authToken: accessToken });
}

/**
 * `RecordPicker`'s `onSearch` for the Assign Volunteers flow - the same
 * `GET /people?search=` reuse `searchPeopleForEscalation`
 * (`PastoralCare/usePastoralCareData.ts`) already established, applied
 * here instead to `POST /people/:personId/group-memberships`'s target
 * selection. Same disclosed scope limitation as that function: results
 * are bounded by the *acting* user's own `people.person.read` grant.
 */
export async function searchPeopleForAssignment(accessToken: string, query: string): Promise<RecordOption[]> {
  const params = new URLSearchParams();
  if (query.trim()) params.set('search', query.trim());
  const qs = params.toString();
  const people = await apiGet<PersonResponseDto[]>(`/people${qs ? `?${qs}` : ''}`, { authToken: accessToken });
  return people.map((person) => ({
    id: person.id,
    label: `${person.firstName} ${person.lastName}`,
    description: person.phone ?? person.email ?? undefined,
  }));
}

/** `POST /people/:personId/group-memberships` (`createGroupMembershipRequestSchema`,
 * `{ groupId }`) - Assign Volunteers' submit action, the exact endpoint
 * `GroupMembershipController.assign` already exposes; no new backend work. */
export function assignVolunteerToGroup(accessToken: string, personId: string, groupId: string): Promise<unknown> {
  return apiPost(`/people/${personId}/group-memberships`, { groupId }, { authToken: accessToken });
}
