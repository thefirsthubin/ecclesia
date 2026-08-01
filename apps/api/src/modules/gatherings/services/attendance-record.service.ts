import { Injectable, NotFoundException } from '@nestjs/common';
import { evaluateAttendanceCompleteness } from '@ecclesia/domain-gatherings';
import type { AttendanceCompletenessOutcome } from '@ecclesia/domain-gatherings';
import type { AttendanceRecordResponseDto, RecordAttendanceInput } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { AttendanceRecord } from '@prisma/client';

import { AttendanceRecordRepository } from '../repositories/attendance-record.repository';
import { GatheringRepository } from '../repositories/gathering.repository';

function toResponseDto(record: AttendanceRecord): AttendanceRecordResponseDto {
  return {
    id: record.id,
    gatheringId: record.gatheringId,
    personId: record.personId,
    branchId: record.branchId,
    status: record.status,
    recordedByPersonId: record.recordedByPersonId,
    recordedAt: record.recordedAt.toISOString(),
  };
}

/**
 * FR-GTH-03/BR-GTH-01 (Branch and per-Bacenta scoping via
 * `Gathering.ownerGroupId`, a query filter rather than a separate
 * reporting subsystem - §12.4's own implementation note). FR-GTH-05's
 * completeness check (`checkCompleteness`) is exposed per-Gathering here;
 * the Branch-wide sweep/report across many Gatherings and the "Attendance
 * not yet recorded" reminder notification (§16.4) are not built this
 * milestone - see `GATHERINGS_DESIGN_NOTES.md`.
 */
@Injectable()
export class AttendanceRecordService {
  constructor(
    private readonly attendanceRecordRepository: AttendanceRecordRepository,
    private readonly gatheringRepository: GatheringRepository,
  ) {}

  async record(actor: ActorContext, gatheringId: string, input: RecordAttendanceInput): Promise<AttendanceRecordResponseDto> {
    const gathering = await this.gatheringRepository.findById(gatheringId);
    if (!gathering) {
      throw new NotFoundException(`No Gathering found with id '${gatheringId}'`);
    }

    const record = await this.attendanceRecordRepository.upsert({
      gatheringId,
      personId: input.personId,
      branchId: gathering.branchId,
      status: input.status,
      recordedByPersonId: actor.personId,
    });
    return toResponseDto(record);
  }

  async listByGathering(gatheringId: string): Promise<AttendanceRecordResponseDto[]> {
    const records = await this.attendanceRecordRepository.findByGathering(gatheringId);
    return records.map(toResponseDto);
  }

  async checkCompleteness(gatheringId: string, windowHours?: number): Promise<AttendanceCompletenessOutcome> {
    const gathering = await this.gatheringRepository.findById(gatheringId);
    if (!gathering) {
      throw new NotFoundException(`No Gathering found with id '${gatheringId}'`);
    }
    const attendanceCount = await this.attendanceRecordRepository.countByGathering(gatheringId);
    return evaluateAttendanceCompleteness({
      scheduledEnd: gathering.scheduledEnd,
      hasAttendanceRecorded: attendanceCount > 0,
      now: new Date(),
      windowHours,
    });
  }
}
