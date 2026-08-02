import { Injectable } from '@nestjs/common';
import type { Branch, Gathering } from '@prisma/client';

import { PrismaService } from '../../platform/database/prisma.service';

/**
 * apps/worker's own Prisma-backed queries for the attendance-completeness
 * sweep - see `AttendanceCompletenessSweepJob`'s own doc comment, and
 * `WORKER_DESIGN_NOTES.md` for the "own repository, not a cross-app
 * import" rationale shared with every other worker-side repository.
 */
@Injectable()
export class AttendanceCompletenessSweepRepository {
  constructor(private readonly prisma: PrismaService) {}

  listBranches(): Promise<Pick<Branch, 'id'>[]> {
    return this.prisma.branch.findMany({ select: { id: true } });
  }

  /**
   * Every non-cancelled Gathering in a Branch whose `scheduledEnd` has
   * already passed, bounded to the trailing `lookbackDays` window -
   * `evaluateAttendanceCompleteness()`'s own default completeness window
   * is only 48 hours, so a Gathering whose `scheduledEnd` is, say, six
   * months old has long since had its completeness question settled by
   * whatever manual process resolved it; re-examining the Branch's entire
   * Gathering history every sweep run would grow unboundedly and answer a
   * question nobody is asking. `lookbackDays` bounds that, generously,
   * without needing a persisted "already resolved" marker on `Gathering`
   * itself (no such field exists in `db/schema.prisma`, and adding one is
   * outside this milestone's scope). `CANCELLED` Gatherings are excluded -
   * a cancelled Gathering was never going to have attendance recorded and
   * is not a real completeness gap. **[INFERRED]**, not a citation - see
   * `AttendanceCompletenessSweepJob`'s own doc comment.
   */
  listRecentlyEndedGatherings(branchId: string, now: Date, lookbackDays: number): Promise<Gathering[]> {
    const lookbackStart = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
    return this.prisma.gathering.findMany({
      where: {
        branchId,
        status: { not: 'CANCELLED' },
        scheduledEnd: { not: null, lte: now, gte: lookbackStart },
      },
    });
  }

  async hasAttendanceRecorded(gatheringId: string): Promise<boolean> {
    const count = await this.prisma.attendanceRecord.count({ where: { gatheringId } });
    return count > 0;
  }
}
