import type { GivingTrendResultDto } from '@ecclesia/contracts';

import { apiGet } from '../../lib/api-client';
import { mostRecentSundayIso } from '../../lib/date-utils';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

export interface GivingBreakdown {
  /** The one real reporting week every card below is drawn from. */
  weekLabel: string;
  from: string;
  to: string;
  /** Whole-Branch giving this week, every attribution combined - Portal 1
   * items 1/2 ("Branch Tithes"/"Branch Offerings"). */
  branch: GivingTrendResultDto;
  /** This week's Gathering-category `SUNDAY` bucket - Portal 1 item 3. */
  sunday: GivingTrendResultDto;
  /** This week's Gathering-category `MIDWEEK` bucket - Portal 1 item 4. */
  midweek: GivingTrendResultDto;
  /** This week's Gathering-category `BACENTA_MEETING` bucket - Portal 1
   * item 5. `GATHERING_CATEGORY_VALUES` (`@ecclesia/contracts`) already
   * distinguishes Bacenta-meeting giving from Basonta-meeting giving as
   * its own category, so this is a real, direct filter - not a
   * cross-referenced group-type guess (see this file's own doc comment
   * for why that alternative approach was rejected). */
  bacenta: GivingTrendResultDto;
  /** This week's Gathering-category `BASONTA_MEETING` bucket - Portal 1
   * item 6. */
  basonta: GivingTrendResultDto;
  /** This week's Gathering-category `OTHER` bucket - Portal 2's own
   * "other giving" line item (Branch Administrator's read-only Finance
   * view); Portal 1 (Treasurer) doesn't render this field, but fetching
   * it once here means a second, near-identical hook was never needed
   * for the second consumer. */
  other: GivingTrendResultDto;
}

async function fetchGivingTrend(
  accessToken: string,
  signal: AbortSignal,
  endingAt: string,
  gatheringCategory?: 'SUNDAY' | 'MIDWEEK' | 'BACENTA_MEETING' | 'BASONTA_MEETING' | 'OTHER',
): Promise<GivingTrendResultDto> {
  const params = new URLSearchParams({ granularity: 'week', count: '1', endingAt });
  if (gatheringCategory) params.set('gatheringCategory', gatheringCategory);
  // Every real consumer of this hook (`TREASURER` BRANCH, `ADMIN` BRANCH,
  // `ASSISTANT_PASTOR` CLUSTER) is never COUNCIL-scoped for
  // `stewardship.transaction.read` - the response is always the
  // single-branch shape, never `{ councilBranches }`.
  const result = (await apiGet<GivingTrendResultDto & { branchId: string }>(`/insights/giving-trend?${params.toString()}`, {
    authToken: accessToken,
    signal,
  })) as GivingTrendResultDto;
  return result;
}

/**
 * `[Milestone D — Portal Experiences]` The real weekly giving breakdown
 * shared by Branch Treasurer's Dashboard (`BranchTreasurerDashboard.tsx`,
 * Portal 1) and the read-only Finance view Branch Pastor and Branch
 * Administrator both use (`BranchFinanceOverviewPage.tsx`, Portal 2) -
 * originally built (and named) for Treasurer alone; generalized once a
 * second, genuinely independent consumer needed the identical
 * composition, rather than duplicating it. Composes `GET
 * /insights/giving-trend` (Milestone C's own read model,
 * `stewardship.transaction.read`-gated - every real consumer holds this
 * action, at BRANCH or CLUSTER scope) six times - once whole-Branch, once
 * per `gatheringCategory` some consumer needs - rather than inventing a
 * new backend aggregate: no endpoint change, no new analytics duplicating
 * what `GivingTrendService` already computes.
 *
 * **Why one shared week window, not six independent "current" windows.**
 * `granularity=week,count=1` with no `endingAt` would resolve to
 * *today's* Monday-Sunday week - correct for "Branch Tithes/Offerings
 * this week," but wrong for "Previous Sunday Giving" on any day before
 * that week's own Sunday has actually happened (the bucket would show
 * `$0`, a real number for a Sunday that hasn't occurred yet, not the
 * *previous* Sunday the label promises). Anchoring every call to
 * `mostRecentSundayIso(now)` instead makes every number describe the
 * same closed seven-day window, and makes "Previous Sunday" honest
 * regardless of what day of the week it is right now.
 */
export function useGivingBreakdown(accessToken: string | undefined): AsyncDataResult<GivingBreakdown> {
  return useAsyncData<GivingBreakdown>(
    async (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const endingAt = mostRecentSundayIso(new Date());

      const [branch, sunday, midweek, bacenta, basonta, other] = await Promise.all([
        fetchGivingTrend(accessToken, signal, endingAt),
        fetchGivingTrend(accessToken, signal, endingAt, 'SUNDAY'),
        fetchGivingTrend(accessToken, signal, endingAt, 'MIDWEEK'),
        fetchGivingTrend(accessToken, signal, endingAt, 'BACENTA_MEETING'),
        fetchGivingTrend(accessToken, signal, endingAt, 'BASONTA_MEETING'),
        fetchGivingTrend(accessToken, signal, endingAt, 'OTHER'),
      ]);

      return {
        weekLabel: branch.from,
        from: branch.from,
        to: branch.to,
        branch,
        sunday,
        midweek,
        bacenta,
        basonta,
        other,
      };
    },
    [accessToken],
  );
}
