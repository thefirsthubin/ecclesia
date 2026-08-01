import { Injectable } from '@nestjs/common';
import type { FollowUpTask, FollowUpTaskStatus } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateFollowUpTaskRecord {
  branchId: string;
  personId: string;
  assignedToPersonId: string;
  groupId?: string;
  dueAt?: Date;
  createdByPersonId?: string;
}

export interface UpdateFollowUpTaskRecord {
  status: FollowUpTaskStatus;
  escalatedAt?: Date;
  escalatedToPersonId?: string;
}

/**
 * Prisma-backed persistence for `pastoral_care.follow_up_tasks`
 * (FR-PC-03/04). Schema-scoped per Blueprint §6.4/§7.2, same rule as
 * `PoimenEnrollmentRepository`.
 */
@Injectable()
export class FollowUpTaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateFollowUpTaskRecord): Promise<FollowUpTask> {
    return this.prisma.followUpTask.create({
      data: {
        branchId: input.branchId,
        personId: input.personId,
        assignedToPersonId: input.assignedToPersonId,
        groupId: input.groupId,
        dueAt: input.dueAt,
        createdByPersonId: input.createdByPersonId,
      },
    });
  }

  findById(id: string): Promise<FollowUpTask | null> {
    return this.prisma.followUpTask.findUnique({ where: { id } });
  }

  update(id: string, input: UpdateFollowUpTaskRecord): Promise<FollowUpTask> {
    return this.prisma.followUpTask.update({ where: { id }, data: input });
  }
}
