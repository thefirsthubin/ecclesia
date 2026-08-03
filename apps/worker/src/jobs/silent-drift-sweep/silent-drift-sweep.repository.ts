import { Injectable } from '@nestjs/common';
import type { SilentDriftFlag } from '@prisma/client';

import { PrismaService } from '../../platform/database/prisma.service';

export interface ActiveBacentaMembership {
  personId: string;
  groupId: string;
}

export interface SilentDriftThresholds {
  n: number;
  m: number;
}

/** OQ-04's own resolution, restated here since apps/worker has no import
 * path back to `db/DESIGN_NOTES.md`'s prose: "ships with N=3/M=3 as an
 * explicit placeholder." Used whenever a Branch's
 * `platform.configurations.silent_drift_config` is missing or doesn't
 * parse as `{ n: number; m: number }`. */
export const DEFAULT_SILENT_DRIFT_THRESHOLDS: SilentDriftThresholds = { n: 3, m: 3 };

/**
 * apps/worker's own Prisma-backed queries for the silent-drift sweep -
 * deliberately not importing anything from `apps/api/src/modules/
 * pastoral-care` (which, per `PASTORAL_CARE_DESIGN_NOTES.md`, has no
 * `SilentDriftFlag` repository/service/controller of its own yet anyway -
 * that milestone built the table and the pure decision function but
 * nothing to trigger it against). Same "own repository, shared
 * `libs/domain`/`libs/contracts` only" split as `WorkerEngagementSignalRepository`.
 */
@Injectable()
export class SilentDriftSweepRepository {
  constructor(private readonly prisma: PrismaService) {}

  // `[Row-Level Security sprint]` `listBranches()` moved to
  // `BranchDirectoryRepository` (`platform/database`) - it needs the
  // unscoped `PrismaRootService`, which does not belong on a repository
  // whose every other method now runs inside a branch-scoped transaction.
  // See that class's own doc comment.

  /**
   * PRD §15.8's own N/M thresholds (see `libs/domain/pastoral-care`'s
   * `silent-drift.ts` doc comment for why N and M are read as both the
   * window size and the required-attended count). Falls back to
   * `DEFAULT_SILENT_DRIFT_THRESHOLDS` if the Branch has no Configuration
   * row yet, or its `silent_drift_config` JSON doesn't have the expected
   * shape - a Branch without configuration should still get sensible
   * placeholder behavior, not a sweep failure.
   */
  async getThresholds(branchId: string): Promise<SilentDriftThresholds> {
    const configuration = await this.prisma.configuration.findUnique({
      where: { branchId },
      select: { silentDriftConfig: true },
    });
    const raw = configuration?.silentDriftConfig as { n?: unknown; m?: unknown } | null;
    const n = typeof raw?.n === 'number' && raw.n > 0 ? raw.n : DEFAULT_SILENT_DRIFT_THRESHOLDS.n;
    const m = typeof raw?.m === 'number' && raw.m > 0 ? raw.m : DEFAULT_SILENT_DRIFT_THRESHOLDS.m;
    return { n, m };
  }

  /** Node A's population: every Person with a currently-open
   * PASTORAL_CARE (Bacenta) GroupMembership in this Branch. */
  listActiveBacentaMemberships(branchId: string): Promise<ActiveBacentaMembership[]> {
    return this.prisma.groupMembership.findMany({
      where: { branchId, groupType: 'PASTORAL_CARE', endedAt: null },
      select: { personId: true, groupId: true },
    });
  }

  /**
   * The Branch's most recent `limit` main-service Gatherings (Node B's
   * "last N Sunday/Wed/Fri Gatherings"). Distinguished from a Bacenta
   * Meeting via `ownerGroupId IS NULL` - `Gathering.type` is a Branch-
   * configured free string with no fixed enum (`GATHERINGS_DESIGN_NOTES.md`),
   * so `ownerGroupId` (set only for a Group-owned recurring Gathering
   * like a Bacenta Meeting, per FR-GTH-03's own "Branch/Bacenta-level
   * scoping via ownerGroupId") is the one schema-grounded signal available
   * to tell the two apart, rather than pattern-matching on `type` string
   * values that are themselves not fixed by any document.
   * **[INFERRED]**, flagged in `WORKER_DESIGN_NOTES.md`.
   */
  async listRecentMainServiceGatheringIds(branchId: string, limit: number): Promise<string[]> {
    const gatherings = await this.prisma.gathering.findMany({
      where: { branchId, ownerGroupId: null },
      orderBy: { scheduledStart: 'desc' },
      take: limit,
      select: { id: true },
    });
    return gatherings.map((g) => g.id);
  }

  /** The Bacenta's most recent `limit` own Gatherings (Node C's "last M
   * Bacenta Meetings") - `ownerGroupId = groupId`, the Bacenta-owned
   * counterpart to the query above. */
  async listRecentBacentaGatheringIds(groupId: string, limit: number): Promise<string[]> {
    const gatherings = await this.prisma.gathering.findMany({
      where: { ownerGroupId: groupId },
      orderBy: { scheduledStart: 'desc' },
      take: limit,
      select: { id: true },
    });
    return gatherings.map((g) => g.id);
  }

  /** "Attended" = `AttendanceStatus.PRESENT` - PRD §12.2's 3-value status
   * (present/absent/excused); `EXCUSED` is deliberately not counted as
   * attendance for this evaluation, only `PRESENT` is. */
  countPresentAttendance(personId: string, gatheringIds: string[]): Promise<number> {
    if (gatheringIds.length === 0) {
      return Promise.resolve(0);
    }
    return this.prisma.attendanceRecord.count({
      where: { personId, gatheringId: { in: gatheringIds }, status: 'PRESENT' },
    });
  }

  /** Business-level idempotency (distinct from `ProcessedEventRepository`'s
   * event-delivery idempotency): a Person already carrying an unresolved
   * `FLAGGED` flag should not get a second one from the next nightly
   * sweep run before the first is resolved/escalated. */
  findOpenFlag(personId: string): Promise<SilentDriftFlag | null> {
    return this.prisma.silentDriftFlag.findFirst({
      where: { personId, status: 'FLAGGED' },
    });
  }

  createFlag(input: {
    branchId: string;
    groupId: string;
    personId: string;
    attendanceMissedCount: number;
    attendanceThreshold: number;
    bacentaMissedCount: number;
    bacentaThreshold: number;
  }): Promise<SilentDriftFlag> {
    return this.prisma.silentDriftFlag.create({ data: input });
  }
}
