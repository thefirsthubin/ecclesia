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
}
