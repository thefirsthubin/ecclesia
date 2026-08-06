import { Injectable } from '@nestjs/common';
import type { FollowUpTask } from '@prisma/client';

import { PrismaService } from '../../platform/database/prisma.service';

/**
 * apps/worker's own Prisma-backed queries for the follow-up-sla-sweep -
 * see `FollowUpSlaSweepJob`'s own doc comment for why this job never
 * mutates `FollowUpTask` (only publishes a signal), and
 * `WORKER_DESIGN_NOTES.md` for the "own repository, not a cross-app
 * import" rationale shared with every other worker-side repository.
 */
@Injectable()
export class FollowUpSlaSweepRepository {
  constructor(private readonly prisma: PrismaService) {}

  // `[Row-Level Security sprint]` `listBranches()` moved to
  // `BranchDirectoryRepository` - see that class's own doc comment.

  /** Every `OPEN` Follow-up task in a Branch with a `dueAt` set - the
   * candidate population `isFollowUpTaskPastSla()` evaluates. Tasks with
   * no `dueAt` (schema allows it to be null) have nothing to breach and
   * are excluded at the query level rather than left to the pure
   * function's own null-check, purely to keep the candidate set small. */
  listOpenTasksWithDueDate(branchId: string): Promise<FollowUpTask[]> {
    return this.prisma.followUpTask.findMany({
      where: { branchId, status: 'OPEN', dueAt: { not: null } },
    });
  }
}
