import { Injectable } from '@nestjs/common';
import type { SilentDriftFlag, SilentDriftStatus } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

/** The two still-open statuses (§15.8's decision tree: `FLAGGED` is the
 * initial state, `ESCALATED` is BR-PC-04's unactioned-past-SLA outcome).
 * `RESOLVED` flags are excluded by default - a Shepherd's dashboard
 * queue is for what still needs attention, not a full history. */
const DEFAULT_STATUSES: SilentDriftStatus[] = ['FLAGGED', 'ESCALATED'];

/**
 * Prisma-backed persistence for `pastoral_care.silent_drift_flags`
 * (FR-PC-05, §15.8). Rows are written exclusively by
 * `apps/worker`'s `SilentDriftSweepJob` today - this repository is this
 * codebase's first *read* path against that table (Shepherd Dashboard
 * sprint; see `SHEPHERD_DASHBOARD_DESIGN_NOTES.md` STEP 6).
 */
@Injectable()
export class SilentDriftFlagRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** `GET /pastoral-care/groups/:groupId/silent-drift-flags`. Sorted
   * most-recently-flagged first, matching the Priority card's "what's
   * new since I last looked" framing. */
  listByGroup(groupId: string, statuses: SilentDriftStatus[] = DEFAULT_STATUSES): Promise<SilentDriftFlag[]> {
    return this.prisma.silentDriftFlag.findMany({
      where: { groupId, status: { in: statuses } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
