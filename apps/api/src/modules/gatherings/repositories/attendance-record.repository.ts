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

  /**
   * `[Milestone C: Portal Read Models + Analytics]` Phase 1 decision #2's
   * active-member computation: distinct Persons `PRESENT` at a
   * `gatheringTypes`-matching Gathering (the Branch's own SUNDAY-category
   * types, resolved by `MembershipTrendService` via
   * `GatheringTypeCategoryService`) whose **Gathering's own
   * `scheduledStart`** - not `recordedAt` - falls in `[from, to)`.
   * Deliberately the opposite date choice from `listPresentForTrend`
   * below: "did this Person attend a Sunday service in the last 8 weeks"
   * is a question about calendar fact (which Sundays had a service this
   * Person was physically at), not about how promptly the attendance was
   * entered - a data-entry lag of a day or two around the 8-week boundary
   * must not flip someone's active/inactive status, which using
   * `recordedAt` here could do.
   */
  async listDistinctPresentPersonIds(branchId: string, from: Date, to: Date, gatheringTypes: string[]): Promise<string[]> {
    if (gatheringTypes.length === 0) {
      return [];
    }
    const rows = await this.prisma.attendanceRecord.findMany({
      where: {
        branchId,
        status: 'PRESENT',
        gathering: { type: { in: gatheringTypes }, scheduledStart: { gte: from, lt: to } },
      },
      distinct: ['personId'],
      select: { personId: true },
    });
    return rows.map((row) => row.personId);
  }

  /**
   * `[Milestone C: Portal Read Models + Analytics]` Phase 4's Attendance
   * Trend read-model source. Bucketed by `recordedAt`, deliberately
   * consistent with `countPresentInWindow` above's own established
   * choice (not `Gathering.scheduledStart`) - Phase 3's explicit
   * "use the Gathering's own date, not createdAt" instruction was scoped
   * to Financial Transactions specifically; no equivalent instruction
   * exists for Attendance, so this keeps the one date-attribution
   * convention this table already has rather than inventing a second,
   * inconsistent one.
   *
   * `gatheringTypes` (Phase 4's Sunday/Midweek/Bacenta Meeting/Basonta
   * Meeting/Other category filter), `ownerGroupIds` (own-group/cluster
   * narrowing for Bacenta/Basonta-*owned* meetings), and `personIds`
   * (`[Milestone C.1, C.1.4]` own-group/cluster narrowing for Branch-wide
   * services, added to close the gap `AttendanceTrendService`'s own doc
   * comment previously disclosed) all join through `Gathering`/`personId`.
   * When both `ownerGroupIds` and `personIds` are supplied, they combine
   * with `OR`: a record counts if the Gathering it belongs to is owned by
   * one of `ownerGroupIds` (a Bacenta/Basonta meeting) **or** the
   * attending Person is one of `personIds` (the scope's own current
   * roster) - correctly covering a Branch-wide Gathering (`ownerGroupId:
   * null`, so it can never match the first clause) attended by a member
   * of the actor's own cluster. No double-count risk: both clauses can
   * only ever match the exact same row twice, not produce two rows for
   * one attendance record.
   */
  listPresentForTrend(
    branchId: string,
    from: Date,
    to: Date,
    gatheringTypes?: string[],
    ownerGroupIds?: string[],
    personIds?: string[],
  ): Promise<AttendanceForTrendRow[]> {
    const groupOrPersonFilter =
      ownerGroupIds || personIds
        ? {
            OR: [
              ...(ownerGroupIds ? [{ gathering: { ownerGroupId: { in: ownerGroupIds } } }] : []),
              ...(personIds ? [{ personId: { in: personIds } }] : []),
            ],
          }
        : {};
    return this.prisma.attendanceRecord.findMany({
      where: {
        branchId,
        status: 'PRESENT',
        recordedAt: { gte: from, lt: to },
        ...(gatheringTypes ? { gathering: { type: { in: gatheringTypes } } } : {}),
        ...groupOrPersonFilter,
      },
      select: {
        id: true,
        recordedAt: true,
        gatheringId: true,
        gathering: { select: { ownerGroupId: true, type: true } },
      },
    });
  }
}

/** Row shape returned by `listPresentForTrend`. */
export interface AttendanceForTrendRow {
  id: string;
  recordedAt: Date;
  gatheringId: string;
  gathering: { ownerGroupId: string | null; type: string } | null;
}
