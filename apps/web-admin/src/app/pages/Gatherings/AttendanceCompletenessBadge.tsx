import { Badge } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { useAttendanceCompleteness } from './useGatheringsData';

/**
 * FR-GTH-05/§16.4's "Attendance completeness report... surfaces
 * Gatherings missing attendance data past the configured window" -
 * shown inline per row rather than a separate report page, since no
 * Branch-wide completeness *list* endpoint exists (only the per-Gathering
 * check, `GATHERINGS_DESIGN_NOTES.md`'s own disclosed gap) - the same
 * "compute per-row from an existing single-record endpoint" pattern
 * Ministry's overcommitment badge already used. `GatheringsListPage`
 * only renders this for Gatherings already past their scheduled end -
 * see that file's own reasoning.
 */
export function AttendanceCompletenessBadge({ gatheringId }: { gatheringId: string }) {
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const completenessState = useAttendanceCompleteness(accessToken, gatheringId);

  if (completenessState.status !== 'success') {
    return null;
  }

  return (
    <Badge status={completenessState.data.incomplete ? 'danger' : 'success'}>
      {completenessState.data.incomplete ? 'Attendance missing' : 'Attendance recorded'}
    </Badge>
  );
}
