import { Injectable } from '@nestjs/common';
import type { StaffingTarget } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface UpsertStaffingTargetRecord {
  branchId: string;
  gatheringId: string;
  groupId: string;
  targetCount: number;
  createdByPersonId: string;
}

/**
 * Prisma-backed persistence for `ministry.staffing_targets` (FR-MIN-02).
 * `create()` is deliberately an upsert keyed on `db/schema.prisma`'s
 * `@@unique([gatheringId, groupId])` - re-submitting a target for the
 * same (Gathering, Basonta) pair corrects it, the same
 * "re-recording is a correction, not a duplicate" precedent
 * `AttendanceRecordRepository.upsert()` already established for
 * `@@unique([gatheringId, personId])`.
 */
@Injectable()
export class StaffingTargetRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(input: UpsertStaffingTargetRecord): Promise<StaffingTarget> {
    return this.prisma.staffingTarget.upsert({
      where: { gatheringId_groupId: { gatheringId: input.gatheringId, groupId: input.groupId } },
      create: input,
      update: { targetCount: input.targetCount },
    });
  }

  findById(id: string): Promise<StaffingTarget | null> {
    return this.prisma.staffingTarget.findUnique({ where: { id } });
  }

  /**
   * `[Remaining Engineering Sprint, Milestone 11]` `GET /ministry/staffing-targets?groupId=`
   * (the "Staffing Overview" list `MINISTRY_PAGE_DESIGN_NOTES.md` already
   * disclosed as a gap: "no 'list staffing targets for this Basonta'
   * endpoint"). Additive only - `upsert`/`findById` above are unchanged.
   * Ordered by `gatheringId` so the same Gathering's target always sorts
   * together across repeated reads (no richer sort key - e.g. Gathering
   * date - is available without a join this repository deliberately
   * doesn't perform, matching `findById`'s own "no join, compute-on-read
   * happens in the service" precedent).
   */
  findByGroupId(groupId: string): Promise<StaffingTarget[]> {
    return this.prisma.staffingTarget.findMany({ where: { groupId }, orderBy: { gatheringId: 'asc' } });
  }

  /**
   * `[Post-Milestone D — Portal Experiences follow-up]` "Basonta recent
   * activity" read model's staffing-target-changes source: every target
   * set (or corrected - `upsert` above only ever touches `updatedAt`, not
   * `createdAt`, on a correction) for `groupId` whose `createdAt` falls
   * within `[from, to]`, newest first.
   */
  listByGroupWithCreatedInRange(groupId: string, from: Date, to: Date): Promise<StaffingTarget[]> {
    return this.prisma.staffingTarget.findMany({
      where: { groupId, createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
