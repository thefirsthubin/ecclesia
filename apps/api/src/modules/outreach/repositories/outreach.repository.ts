import { Injectable } from '@nestjs/common';
import type { Outreach } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateOutreachRecord {
  branchId: string;
  groupId?: string;
  occurredAt: Date;
  location?: string;
  leaderPersonId: string;
  notes?: string;
  createdByPersonId: string;
}

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` Prisma-backed
 * persistence for `outreach.outreaches`. Schema-scoped per Blueprint
 * §6.4/§7.2, same rule every other repository in this codebase follows.
 */
@Injectable()
export class OutreachRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateOutreachRecord): Promise<Outreach> {
    return this.prisma.outreach.create({
      data: {
        branchId: input.branchId,
        groupId: input.groupId,
        occurredAt: input.occurredAt,
        location: input.location,
        leaderPersonId: input.leaderPersonId,
        notes: input.notes,
        createdByPersonId: input.createdByPersonId,
      },
    });
  }

  findById(id: string): Promise<Outreach | null> {
    return this.prisma.outreach.findUnique({ where: { id } });
  }

  /** `GET /outreach?groupId=...` - one Bacenta/Basonta's own outreach
   * history, mirroring `GatheringRepository.listByGroupAndRange`'s own
   * shape. */
  listByGroup(groupId: string, from?: Date, to?: Date): Promise<Outreach[]> {
    return this.prisma.outreach.findMany({
      where: { groupId, ...(from || to ? { occurredAt: { gte: from, lte: to } } : {}) },
      orderBy: { occurredAt: 'desc' },
    });
  }

  /** `GET /outreach` with no `groupId` - the BRANCH/CLUSTER-wide
   * counterpart, mirroring `GatheringRepository.listByBranchAndRange`. */
  listByBranch(branchId: string, from?: Date, to?: Date): Promise<Outreach[]> {
    return this.prisma.outreach.findMany({
      where: { branchId, ...(from || to ? { occurredAt: { gte: from, lte: to } } : {}) },
      orderBy: { occurredAt: 'desc' },
    });
  }

  /** `[Milestone C.1.2: Outreach Analytics]` The conversion read model's
   * "how many Outreach events happened" count, Branch-wide. */
  countByBranch(branchId: string, from?: Date, to?: Date): Promise<number> {
    return this.prisma.outreach.count({
      where: { branchId, ...(from || to ? { occurredAt: { gte: from, lte: to } } : {}) },
    });
  }

  /** `[Milestone C.1.2]` The same count, narrowed to a scope's own
   * Group(s) - `Outreach.groupId` is a direct column, the same simple
   * cluster-narrowing case `FollowUpTaskRepository.listByGroups` already
   * established. */
  countByGroups(groupIds: string[], from?: Date, to?: Date): Promise<number> {
    if (groupIds.length === 0) {
      return Promise.resolve(0);
    }
    return this.prisma.outreach.count({
      where: { groupId: { in: groupIds }, ...(from || to ? { occurredAt: { gte: from, lte: to } } : {}) },
    });
  }
}
