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

  /**
   * `[Resident Pastor Dashboard - real Attendance data milestone]` The
   * Attendance KPI/trend/growth-series' underlying query - every `PRESENT`
   * record in `[from, to)`, Branch-wide (`AttendanceRecord.branchId`, not
   * filtered by which Gathering or Group it belongs to). `PRESENT` only,
   * not `ABSENT`/`EXCUSED` - "Attendance" means people who showed up.
   * Not filtered by `Gathering.type` - that field is free-text
   * (`AttendanceRecordService.record`'s own doc comment: `'BACENTA_MEETING'`
   * is a convention, not an enum), so there is no principled type to
   * single out as "the real services" versus any other Gathering a Branch
   * might configure. `recordedAt` (when the record was entered), not the
   * Gathering's own `scheduledStart` - per this milestone's explicit
   * instruction, matching how attendance is actually timestamped in this
   * table.
   */
  countPresentInWindow(branchId: string, from: Date, to: Date): Promise<number> {
    return this.prisma.attendanceRecord.count({
      where: { branchId, status: 'PRESENT', recordedAt: { gte: from, lt: to } },
    });
  }
}
