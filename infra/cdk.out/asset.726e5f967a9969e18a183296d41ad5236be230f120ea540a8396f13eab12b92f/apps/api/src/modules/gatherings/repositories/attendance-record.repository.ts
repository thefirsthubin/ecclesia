import { Injectable } from '@nestjs/common';
import type { AttendanceRecord, AttendanceStatus } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface UpsertAttendanceRecordInput {
  gatheringId: string;
  personId: string;
  branchId: string;
  status: AttendanceStatus;
  recordedByPersonId: string;
}

/**
 * Prisma-backed persistence for `gatherings.attendance_records`
 * (FR-GTH-03). `db/schema.prisma`'s `@@unique([gatheringId, personId])`
 * makes this an upsert - re-recording the same Person's attendance for
 * the same Gathering is a correction, not a duplicate.
 */
@Injectable()
export class AttendanceRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(input: UpsertAttendanceRecordInput): Promise<AttendanceRecord> {
    return this.prisma.attendanceRecord.upsert({
      where: { gatheringId_personId: { gatheringId: input.gatheringId, personId: input.personId } },
      create: input,
      update: {
        status: input.status,
        recordedByPersonId: input.recordedByPersonId,
        recordedAt: new Date(),
      },
    });
  }

  findByGathering(gatheringId: string): Promise<AttendanceRecord[]> {
    return this.prisma.attendanceRecord.findMany({ where: { gatheringId } });
  }

  countByGathering(gatheringId: string): Promise<number> {
    return this.prisma.attendanceRecord.count({ where: { gatheringId } });
  }
}
