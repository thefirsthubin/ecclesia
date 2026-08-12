import type { AuditLogEntryResponseDto } from '@ecclesia/contracts';

import { apiGet } from '../lib/api-client';
import { useAsyncData } from '../lib/useAsyncData';
import type { AsyncDataResult } from '../lib/useAsyncData';

/**
 * `[Audit Log milestone]` `GET /platform/audit-log` - no query params at
 * all, `branchId` is always resolved server-side from `ActorContext`
 * (`AuditLogResourceContextGuard`), same "never a client-supplied Branch"
 * precedent as `useBranchConfiguration`. The response list is already
 * role-filtered and reverse-chronological server-side (`AuditLogReadService`)
 * - nothing further to compute here.
 */
export function useAuditLog(accessToken: string | undefined): AsyncDataResult<AuditLogEntryResponseDto[]> {
  return useAsyncData<AuditLogEntryResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<AuditLogEntryResponseDto[]>('/platform/audit-log', { authToken: accessToken, signal });
    },
    [accessToken],
  );
}
