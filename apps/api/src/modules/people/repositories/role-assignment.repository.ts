import { Injectable } from '@nestjs/common';
import type { PoimenStatus, Role as PrismaRole, RoleAssignment } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateRoleAssignmentRecord {
  personId: string;
  role: string;
  branchId: string;
  groupId?: string;
  scopeGroupIds: string[];
  grantedByUserId?: string;
  effectiveFrom?: Date;
}

/**
 * Prisma-backed persistence for `people.role_assignments`. See
 * `PersonRepository`'s doc comment for the explicit-`branchId`-filtering
 * rationale (RLS session variable not wired yet).
 */
@Injectable()
export class RoleAssignmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateRoleAssignmentRecord): Promise<RoleAssignment> {
    return this.prisma.roleAssignment.create({
      data: {
        personId: input.personId,
        // Cast to Prisma's generated `Role` enum type (not `never`) - see
        // `PersonRepository.updateLifecycleStage`'s comment for why this
        // still catches a genuine Prisma/`libs/rbac` role-catalog drift.
        role: input.role as PrismaRole,
        branchId: input.branchId,
        groupId: input.groupId,
        scopeGroupIds: input.scopeGroupIds,
        grantedByUserId: input.grantedByUserId,
        ...(input.effectiveFrom ? { effectiveFrom: input.effectiveFrom } : {}),
      },
    });
  }

  /**
   * `people.role_assignments.granted_by_user_id` references
   * `platform.users`, but `ActorContext` (Sprint 1.4) only carries
   * `personId` - this reverse lookup is the narrow, single-write-path
   * version of the same Person->User join Sprint 1.4's
   * `AUTH_DESIGN_NOTES.md` flags as a *systemic* follow-up for
   * denial-audit-logging generically; scoped to just this one field, it
   * is an ordinary implementation detail, not a design gap.
   */
  async findUserIdByPersonId(personId: string): Promise<string | undefined> {
    const user = await this.prisma.user.findUnique({ where: { personId }, select: { id: true } });
    return user?.id;
  }

  async findPoimenStatus(personId: string): Promise<PoimenStatus | undefined> {
    const enrollment = await this.prisma.poimenEnrollment.findUnique({ where: { personId }, select: { status: true } });
    return enrollment?.status;
  }
}
