import { Injectable } from '@nestjs/common';
import type { Group, GroupMembership } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface ApplyGroupMembershipChangeInput {
  branchId: string;
  personId: string;
  groupId: string;
  groupType: 'PASTORAL_CARE' | 'MINISTRY';
  membershipIdsToClose: string[];
  reason?: string;
  /**
   * PRD §19.1 step 6: "system transitions lifecycle_stage to
   * AssignedToBacenta and opens a GROUP_MEMBERSHIP" - one system action,
   * not two. When set, `PersonService`'s caller (`GroupMembershipService`)
   * has already determined this specific transition applies
   * (`requiresGroupMembershipToTransition`); this repository performs it
   * in the same transaction as the membership change, not as a separate
   * follow-up write.
   */
  personLifecycleStageUpdate?: string;
}

/**
 * Prisma-backed persistence for `people.groups` / `people.group_memberships`
 * (Blueprint §6.4/§7.2). See `PersonRepository`'s doc comment for why
 * every query below filters explicitly by `branchId` rather than relying
 * on Row-Level Security alone.
 */
@Injectable()
export class GroupMembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  findGroupById(groupId: string): Promise<Group | null> {
    return this.prisma.group.findUnique({ where: { id: groupId } });
  }

  /**
   * BR-PPL-01/FR-PPL-04: closing the prior active Bacenta membership and
   * opening the new one happen in one transaction, so a failure partway
   * through never leaves a Person with zero *or* two active Bacenta
   * memberships. `db/schema.prisma`'s `one_active_bacenta_per_person`
   * partial unique index (Blueprint §7.5) is the database-level backstop
   * if this invariant is ever violated by a bug elsewhere.
   */
  async applyChange(input: ApplyGroupMembershipChangeInput): Promise<GroupMembership> {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      if (input.membershipIdsToClose.length > 0) {
        await tx.groupMembership.updateMany({
          where: { id: { in: input.membershipIdsToClose } },
          data: { endedAt: now, reason: input.reason },
        });
      }
      const membership = await tx.groupMembership.create({
        data: {
          branchId: input.branchId,
          personId: input.personId,
          groupId: input.groupId,
          groupType: input.groupType,
          startedAt: now,
        },
      });
      if (input.personLifecycleStageUpdate) {
        await tx.person.update({
          where: { id: input.personId },
          data: { lifecycleStage: input.personLifecycleStageUpdate as never },
        });
      }
      return membership;
    });
  }

  /** Ministry milestone (FR-MIN-03): "rostered workers" for a Basonta -
   * see `GroupRosterService`'s own doc comment for why this lives here
   * rather than as a new Ministry-owned query. */
  countActiveByGroup(groupId: string): Promise<number> {
    return this.prisma.groupMembership.count({ where: { groupId, endedAt: null } });
  }

  async listActiveByGroup(groupId: string): Promise<Pick<GroupMembership, 'personId' | 'startedAt'>[]> {
    return this.prisma.groupMembership.findMany({
      where: { groupId, endedAt: null },
      select: { personId: true, startedAt: true },
      orderBy: { startedAt: 'asc' },
    });
  }

  /** Ministry milestone (FR-MIN-04): a Person's concurrent active
   * MINISTRY-type memberships, the computable proxy for "overcommitment"
   * - see `libs/domain/ministry`'s `overcommitment.ts` doc comment. */
  countActiveMinistryMembershipsForPerson(personId: string): Promise<number> {
    return this.prisma.groupMembership.count({ where: { personId, groupType: 'MINISTRY', endedAt: null } });
  }

  /**
   * FR-PPL-07: "a complete, queryable history... including closed/past
   * ones" - unlike `findActiveGroupMemberships` (`PersonRepository`,
   * active-only, no dates, used only for scope resolution),
   * this returns every membership a Person has ever held, newest first.
   */
  listByPerson(personId: string): Promise<GroupMembership[]> {
    return this.prisma.groupMembership.findMany({
      where: { personId },
      orderBy: { startedAt: 'desc' },
    });
  }
}
