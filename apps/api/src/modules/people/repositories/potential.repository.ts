import { Injectable } from '@nestjs/common';
import type { Potential, PotentialSource, PotentialStatus } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreatePotentialRecord {
  branchId: string;
  groupId?: string;
  personId?: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  source: PotentialSource;
  notes?: string;
  assignedToPersonId?: string;
  createdByPersonId: string;
}

export interface UpdatePotentialRecord {
  status?: PotentialStatus;
  notes?: string;
  assignedToPersonId?: string | null;
  personId?: string;
}

/**
 * `[Milestone C.1.1: Complete Read Models]` Prisma-backed persistence
 * for `people.potentials` (Phase 1 decision #4, schema landed in
 * Milestone C; CRUD completed here). Schema-scoped per Blueprint
 * §6.4/§7.2, same rule every other repository in this codebase follows.
 */
@Injectable()
export class PotentialRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreatePotentialRecord): Promise<Potential> {
    return this.prisma.potential.create({
      data: {
        branchId: input.branchId,
        groupId: input.groupId,
        personId: input.personId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        source: input.source,
        notes: input.notes,
        assignedToPersonId: input.assignedToPersonId,
        createdByPersonId: input.createdByPersonId,
      },
    });
  }

  findById(id: string): Promise<Potential | null> {
    return this.prisma.potential.findUnique({ where: { id } });
  }

  update(id: string, input: UpdatePotentialRecord): Promise<Potential> {
    return this.prisma.potential.update({ where: { id }, data: input });
  }

  /** `GET /potentials?groupId=...` - one Bacenta/Basonta's own
   * Potentials, mirroring `OutreachRepository.listByGroup`'s shape. */
  listByGroup(groupId: string): Promise<Potential[]> {
    return this.prisma.potential.findMany({ where: { groupId }, orderBy: { createdAt: 'desc' } });
  }

  /** `[Milestone C.1.1]` Cluster narrowing for a CLUSTER-scoped actor
   * (Assistant Pastor) with no explicit `groupId` - `Potential.groupId`
   * is a direct column, the same simple case
   * `FollowUpTaskRepository.listByGroups`/`SilentDriftFlagRepository.listByGroups`
   * already established (no cross-schema personId join needed, unlike
   * `CounsellingSession`/`MemberInteraction`). */
  listByGroups(groupIds: string[]): Promise<Potential[]> {
    if (groupIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.prisma.potential.findMany({ where: { groupId: { in: groupIds } }, orderBy: { createdAt: 'desc' } });
  }

  /** `GET /potentials` with no `groupId` and no own-group/cluster to
   * narrow by - the BRANCH-wide fallback for a COUNCIL-scoped read-only
   * actor (Resident Pastor), mirroring `OutreachRepository.listByBranch`'s
   * own precedent exactly (branch-only, not Council-looped - see
   * `PotentialService`'s own doc comment). */
  listByBranch(branchId: string): Promise<Potential[]> {
    return this.prisma.potential.findMany({ where: { branchId }, orderBy: { createdAt: 'desc' } });
  }
}
