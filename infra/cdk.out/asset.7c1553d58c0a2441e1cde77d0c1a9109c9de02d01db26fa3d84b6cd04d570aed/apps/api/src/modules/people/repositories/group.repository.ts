import { Injectable } from '@nestjs/common';
import type { Group, GroupType, GroupLifecycleStatus } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateGroupRecord {
  branchId: string;
  type: GroupType;
  name: string;
  meetingSchedule?: string;
  meetingLocation?: string;
  category?: string;
}

export interface UpdateGroupRecord {
  name?: string;
  meetingSchedule?: string | null;
  meetingLocation?: string | null;
  category?: string | null;
  lifecycleStatus?: GroupLifecycleStatus;
}

/**
 * Prisma-backed persistence for `people.groups` (Bacenta/Basonta, PRD
 * §12.6). Schema-scoped per Blueprint §6.4/§7.2, same as `PersonRepository`
 * - see that file's doc comment for the explicit-`branchId`-filtering
 * rationale (RLS not yet wired, `db/DESIGN_NOTES.md` Open Question #3).
 */
@Injectable()
export class GroupRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateGroupRecord): Promise<Group> {
    return this.prisma.group.create({ data: input });
  }

  findById(id: string): Promise<Group | null> {
    return this.prisma.group.findUnique({ where: { id } });
  }

  update(id: string, input: UpdateGroupRecord): Promise<Group> {
    return this.prisma.group.update({ where: { id }, data: input });
  }

  /** `GET /groups` (Ministry Web Admin sprint) - there was previously no
   * list query on this repository at all, only `findById`. `type` narrows
   * to Basontas (`MINISTRY`) or Bacentas (`PASTORAL_CARE`) when supplied;
   * omitted, returns both. Same explicit-`branchId`-filtering rationale as
   * every other Branch-scoped query in this repository/`PersonRepository`
   * (RLS not yet wired). Ordered by name for a stable, predictable list. */
  findByBranch(branchId: string, type?: GroupType): Promise<Group[]> {
    return this.prisma.group.findMany({
      where: { branchId, ...(type ? { type } : {}) },
      orderBy: { name: 'asc' },
    });
  }
}
