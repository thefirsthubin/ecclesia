import { Injectable } from '@nestjs/common';
import type { Gathering, GatheringStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateGatheringRecord {
  branchId: string;
  type: string;
  ownerGroupId?: string;
  seriesId?: string;
  scheduledStart: Date;
  scheduledEnd?: Date;
  venue?: string;
  /** `[Milestone A: Financial + Gathering Backend Foundation]` See
   * `Gathering.preacherPersonId`/`.message`'s own doc comments in
   * `db/schema.prisma`. */
  preacherPersonId?: string;
  message?: string;
  config?: Prisma.InputJsonValue;
  createdByPersonId: string;
}

export interface UpdateGatheringRecord {
  scheduledStart?: Date;
  scheduledEnd?: Date | null;
  venue?: string | null;
  status?: GatheringStatus;
  preacherPersonId?: string | null;
  message?: string | null;
  config?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
}

/**
 * Prisma-backed persistence for `gatherings.gatherings` (§12.4/FR-GTH-01).
 * Schema-scoped per Blueprint §6.4/§7.2.
 */
@Injectable()
export class GatheringRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateGatheringRecord): Promise<Gathering> {
    return this.prisma.gathering.create({ data: input });
  }

  findById(id: string): Promise<Gathering | null> {
    return this.prisma.gathering.findUnique({ where: { id } });
  }

  /** `GET /gatherings?ownerGroupId=...` (Shepherd Dashboard sprint's
   * Today's-Meeting/Attendance-Summary cards - see this repository's own
   * doc comment on the gap this closes). Sorted earliest-first so the
   * caller can pick "the first instance ≥ now" for an upcoming meeting,
   * or "the last instance < now" for a just-happened one, from the same
   * result set. `type` (Gatherings Web Admin sprint) narrows to an exact
   * match when supplied - §16.4's "filterable by type." */
  listByGroupAndRange(groupId: string, from: Date, to: Date, type?: string): Promise<Gathering[]> {
    return this.prisma.gathering.findMany({
      where: { ownerGroupId: groupId, scheduledStart: { gte: from, lte: to }, ...(type ? { type } : {}) },
      orderBy: { scheduledStart: 'asc' },
    });
  }

  /** `GET /gatherings` with no `ownerGroupId` (Gatherings Web Admin
   * sprint) - the BRANCH-wide counterpart to `listByGroupAndRange`, for a
   * BRANCH-scoped actor with no single Group to name, or simply to browse
   * every Gathering (grouped and Branch-wide) in the Branch. Same
   * range/ordering/`type`-filter shape. */
  listByBranchAndRange(branchId: string, from: Date, to: Date, type?: string): Promise<Gathering[]> {
    return this.prisma.gathering.findMany({
      where: { branchId, scheduledStart: { gte: from, lte: to }, ...(type ? { type } : {}) },
      orderBy: { scheduledStart: 'asc' },
    });
  }

  update(id: string, input: UpdateGatheringRecord): Promise<Gathering> {
    return this.prisma.gathering.update({ where: { id }, data: input });
  }
}
