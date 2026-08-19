import { randomUUID } from 'crypto';

import { Injectable, NotFoundException } from '@nestjs/common';
import { evaluateAttendanceCompleteness } from '@ecclesia/domain-gatherings';
import type { AttendanceCompletenessOutcome } from '@ecclesia/domain-gatherings';
import type { AttendanceRecordResponseDto, PublishableEngagementSignal, RecordAttendanceInput } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { AttendanceRecord } from '@prisma/client';

import { EventBridgePublisherService } from '../../../platform/events/eventbridge-publisher.service';
import { AttendanceRecordRepository } from '../repositories/attendance-record.repository';
import type { AttendanceForTrendRow } from '../repositories/attendance-record.repository';
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
    private readonly eventPublisher: EventBridgePublisherService,
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

    // `[Engagement Signal Ingestion Pipeline milestone]` Blueprint §10.4's
    // Engagement Signal catalog names two attendance-derived event types -
    // `attendance.recorded` (Attendance consistency category) and
    // `bacenta_meeting.attendance_recorded` (Bacenta participation
    // category) - from what is, in this codebase, a single write path:
    // `Gathering.type` is a Branch-configurable free-text field
    // (`libs/contracts/src/lib/gatherings.schemas.ts`), not a fixed enum
    // with a dedicated "this is a Bacenta Meeting" flag. `'BACENTA_MEETING'`
    // is the one type value every fixture/seed in this codebase uses for
    // Bacenta gatherings - branching on it here, deterministically, is the
    // only available signal to distinguish the two catalog event types;
    // every other gathering type (`'SUNDAY_SERVICE'` and any other
    // Branch-configured value) is treated as the general `attendance.recorded`
    // category. See `ENGAGEMENT_SIGNAL_PIPELINE_DESIGN_NOTES.md`.
    const envelope: PublishableEngagementSignal = {
      eventId: randomUUID(),
      eventType: gathering.type === 'BACENTA_MEETING' ? 'bacenta_meeting.attendance_recorded' : 'attendance.recorded',
      schemaVersion: 1,
      branchId: gathering.branchId,
      occurredAt: record.recordedAt.toISOString(),
      subjectPersonId: record.personId,
      subjectGroupId: gathering.ownerGroupId ?? undefined,
      payload: { gatheringId: record.gatheringId, gatheringType: gathering.type, status: record.status },
    };
    await this.eventPublisher.publish(envelope);

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

  /** `[Resident Pastor Dashboard - real Attendance data milestone]` Thin
   * passthrough - see `AttendanceRecordRepository.countPresentInWindow`'s
   * own doc comment. No `actor`/authorization parameter, matching this
   * module's other cross-module-consumed service (`GatheringScopeService`)
   * - the caller (`BranchDashboardSummaryService`) is only ever reached
   * from an already-RBAC-guarded controller route. */
  countPresentInWindow(branchId: string, from: Date, to: Date): Promise<number> {
    return this.attendanceRecordRepository.countPresentInWindow(branchId, from, to);
  }

  /** `[Milestone C: Portal Read Models + Analytics]` Thin passthrough -
   * see `AttendanceRecordRepository.listPresentForTrend`'s own doc
   * comment. Consumed by `AttendanceTrendService` (`apps/api/src/modules/insights`). */
  listPresentForTrend(
    branchId: string,
    from: Date,
    to: Date,
    gatheringTypes?: string[],
    ownerGroupIds?: string[],
    personIds?: string[],
  ): Promise<AttendanceForTrendRow[]> {
    return this.attendanceRecordRepository.listPresentForTrend(branchId, from, to, gatheringTypes, ownerGroupIds, personIds);
  }

  /** `[Milestone C]` Thin passthrough - see
   * `AttendanceRecordRepository.listDistinctPresentPersonIds`'s own doc
   * comment. Consumed by `MembershipTrendService`'s active-member
   * computation. */
  listDistinctPresentPersonIds(branchId: string, from: Date, to: Date, gatheringTypes: string[]): Promise<string[]> {
    return this.attendanceRecordRepository.listDistinctPresentPersonIds(branchId, from, to, gatheringTypes);
  }
}
