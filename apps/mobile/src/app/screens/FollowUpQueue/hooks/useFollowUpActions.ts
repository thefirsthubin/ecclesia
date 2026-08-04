import type { FollowUpTaskResponseDto, PersonResponseDto } from '@ecclesia/contracts';
import type { RecordOption } from '@ecclesia/ui-native';

import { apiGet, apiPatch } from '../../../lib/api-client';

/**
 * `PATCH /follow-up-tasks/:id/complete` - no request body, the same
 * no-payload `PATCH` shape `apps/web-admin`'s own `completeFollowUpTask`
 * (`PastoralCare/usePastoralCareData.ts`) already established for this
 * exact endpoint. `BACENTA_LEADER` already holds
 * `pastoral_care.followup_task.update` at `OWN_GROUP` scope - no RBAC gap.
 */
export function completeFollowUpTask(authToken: string, taskId: string): Promise<FollowUpTaskResponseDto> {
  return apiPatch<FollowUpTaskResponseDto>(`/follow-up-tasks/${taskId}/complete`, {}, { authToken });
}

/**
 * `PATCH /follow-up-tasks/:id/escalate` - BR-PC-04's caller-supplied
 * `escalatedToPersonId`. The mobile counterpart of `apps/web-admin`'s own
 * `escalateFollowUpTask` - same endpoint, same `RecordPicker` component
 * (this time `@ecclesia/ui-native`'s), same disclosed limitation below.
 */
export function escalateFollowUpTask(authToken: string, taskId: string, escalatedToPersonId: string): Promise<FollowUpTaskResponseDto> {
  return apiPatch<FollowUpTaskResponseDto>(`/follow-up-tasks/${taskId}/escalate`, { escalatedToPersonId }, { authToken });
}

/**
 * `RecordPicker`'s `onSearch` for the Escalate flow - reuses `GET
 * /people?search=`, the exact same endpoint/query param
 * `AttendanceCaptureScreen`'s roster fetch and `apps/web-admin`'s own
 * `searchPeopleForEscalation` already use, not a new search endpoint.
 *
 * `[Design Decision]` A known, disclosed limitation carried over from the
 * Web Admin version, unchanged here: this search is scoped by the
 * *acting* Shepherd's own `people.person.read` grant (`OWN_GROUP` for
 * `BACENTA_LEADER`) - it can only find an escalation target inside their
 * own Bacenta, not the Assistant Pastor above them an escalation is
 * usually meant for. See `apps/web-admin/.../PastoralCare/
 * PASTORAL_CARE_PAGE_DESIGN_NOTES.md` §4/§9 for the full reasoning; this
 * screen inherits it rather than re-solving it.
 */
export async function searchPeopleForEscalation(authToken: string, query: string): Promise<RecordOption[]> {
  const params = new URLSearchParams();
  if (query.trim()) params.set('search', query.trim());
  const qs = params.toString();
  const people = await apiGet<PersonResponseDto[]>(`/people${qs ? `?${qs}` : ''}`, { authToken });
  return people.map((person) => ({
    id: person.id,
    label: `${person.firstName} ${person.lastName}`,
    description: person.phone ?? person.email ?? undefined,
  }));
}
