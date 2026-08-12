import type { BranchConfigurationResponseDto, CreateBranchConfigurationInput, UpdateBranchConfigurationInput } from '@ecclesia/contracts';

import { apiGet, apiPatch, apiPost } from '../lib/api-client';
import { useAsyncData } from '../lib/useAsyncData';
import type { AsyncDataResult } from '../lib/useAsyncData';

/**
 * `[Branch Configuration milestone]` `GET /platform/configuration` - a
 * per-Branch singleton, no id/query param at all (`branchId` is always
 * resolved server-side from `ActorContext`). `RESIDENT_PASTOR` (BRANCH)
 * is this call's real reader - `ADMIN` (who can write) holds no `.read`
 * grant at all, traced against `permission-matrix.ts`, not assumed - see
 * `ConfigurationPage.tsx`'s own doc comment for the live-verified 403
 * this produces for that role.
 */
export function useBranchConfiguration(accessToken: string | undefined): AsyncDataResult<BranchConfigurationResponseDto> {
  return useAsyncData<BranchConfigurationResponseDto>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<BranchConfigurationResponseDto>('/platform/configuration', { authToken: accessToken, signal });
    },
    [accessToken],
  );
}

/** `POST /platform/configuration` - only reachable the first time a
 * Branch has no `Configuration` row yet (`db/seed.ts` already creates one
 * for the seeded Branch, so this is the uncommon path in practice). */
export function createBranchConfiguration(accessToken: string, input: CreateBranchConfigurationInput): Promise<BranchConfigurationResponseDto> {
  return apiPost<BranchConfigurationResponseDto>('/platform/configuration', input, { authToken: accessToken });
}

/** `PATCH /platform/configuration` - the real, almost-always-reachable
 * write path (a Configuration row already exists for any Branch that has
 * completed onboarding). */
export function updateBranchConfiguration(accessToken: string, input: UpdateBranchConfigurationInput): Promise<BranchConfigurationResponseDto> {
  return apiPatch<BranchConfigurationResponseDto>('/platform/configuration', input, { authToken: accessToken });
}
