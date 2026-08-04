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
