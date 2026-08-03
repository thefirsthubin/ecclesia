import { Injectable } from '@nestjs/common';
import type { Role as PrismaRole, RoleAssignment } from '@prisma/client';

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
   * PRD §17.2's Bacenta Leader row: "Exactly one active Bacenta Leader per
   * Bacenta at a time." **Resolved OQ-05 (§24):** co-leadership is
   * deliberately deferred in v1.0 - single-leader is the only supported
   * model. `now` is passed in (not computed here) so the caller and this
   * lookup agree on the instant "active" is evaluated at, matching
   * `ActorContextResolverService`'s own "active" definition (`effectiveFrom
   * <= now`, `effectiveTo` null or in the future).
   */
  findActiveBacentaLeader(groupId: string, now: Date): Promise<RoleAssignment | null> {
    return this.prisma.roleAssignment.findFirst({
      where: {
        groupId,
        role: 'BACENTA_LEADER',
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      },
    });
  }

  /**
   * PRD §17.2 + §19.4 step 6: granting a new Bacenta Leader for a Bacenta
   * that already has one active must close the prior holder's assignment
   * (`effectiveTo = now`) in the same transaction as creating the new one
   * - the same "close-then-open, atomically" pattern
   * `GroupMembershipRepository.applyChange` already uses for FR-PPL-04's
   * "automatically closing the prior membership" requirement, applied here
   * to Role Assignment succession instead of Group Membership succession.
   * `assignmentIdToClose` is undefined when there is no prior holder to
   * close (a brand-new Bacenta, or one whose leader stepped down without a
   * same-transaction successor).
   */
  async createWithSuccession(
    input: CreateRoleAssignmentRecord,
    assignmentIdToClose: string | undefined,
    now: Date,
  ): Promise<RoleAssignment> {
    return this.prisma.$transaction(async (tx) => {
      if (assignmentIdToClose) {
        await tx.roleAssignment.update({
          where: { id: assignmentIdToClose },
          data: { effectiveTo: now },
        });
      }
      return tx.roleAssignment.create({
        data: {
          personId: input.personId,
          role: input.role as PrismaRole,
          branchId: input.branchId,
          groupId: input.groupId,
          scopeGroupIds: input.scopeGroupIds,
          grantedByUserId: input.grantedByUserId,
          ...(input.effectiveFrom ? { effectiveFrom: input.effectiveFrom } : {}),
        },
      });
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

  /**
   * FR-PPL-07: "a complete, queryable history of a Person's... Role
   * Assignment records, including closed/past ones," newest first.
   */
  listByPerson(personId: string): Promise<RoleAssignment[]> {
    return this.prisma.roleAssignment.findMany({
      where: { personId },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  // `findPoimenStatus` used to live here, querying `prisma.poimenEnrollment`
  // directly - a `pastoral_care`-schema table this module does not own
  // (Blueprint §7.2). That was a module-boundary violation introduced
  // during the People sprint, fixed in the Pastoral Care milestone:
  // `RoleAssignmentService` now injects `PoimenEnrollmentService`
  // (Pastoral Care's exported public service interface) instead. See
  // `PASTORAL_CARE_DESIGN_NOTES.md`.
}
