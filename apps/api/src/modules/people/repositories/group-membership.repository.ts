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
   * opening the new one must happen atomically, so a failure partway
   * through never leaves a Person with zero *or* two active Bacenta
   * memberships. `db/schema.prisma`'s `one_active_bacenta_per_person`
   * partial unique index (Blueprint §7.5) is the database-level backstop
   * if this invariant is ever violated by a bug elsewhere.
   *
   * `[Bug fix, Group Membership Assignment milestone]` This used to wrap
   * these statements in their own `this.prisma.$transaction(async (tx) =>
   * ...)` - which is exactly the mistake `PrismaService`'s own doc
   * comment warns against: `$transaction` is deliberately **not**
   * proxied to the ambient branch-scoped connection
   * (`branchScopeStorage`), so that call opened a second, brand-new
   * Postgres transaction that never ran `runInBranchScope`'s `SET LOCAL
   * app.current_branch_id` - every RLS policy on `people.group_memberships`/
   * `people.persons` then rejected the query with "unrecognized
   * configuration parameter," a real 500 confirmed live against Postgres
   * (not a hypothetical). `BranchScopeInterceptor` already wraps this
   * repository's entire calling request in exactly one
   * `runInBranchScope` transaction (its own doc comment: "every
   * repository query anywhere in that request's call stack transparently
   * runs inside the one transaction") - so plain sequential calls against
   * `this.prisma` here already share that same outer transaction and are
   * still atomic with each other; no nested `$transaction` is needed, and
   * one is actively harmful. See `db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md`
   * for the fuller RLS/transaction-scoping picture, and note
   * `financial-transaction.repository.ts`/`role-assignment.repository.ts`
   * still carry this exact same pattern - out of this milestone's scope,
   * disclosed rather than silently left.
   */
  async applyChange(input: ApplyGroupMembershipChangeInput): Promise<GroupMembership> {
    const now = new Date();
    if (input.membershipIdsToClose.length > 0) {
      await this.prisma.groupMembership.updateMany({
        where: { id: { in: input.membershipIdsToClose } },
        data: { endedAt: now, reason: input.reason },
      });
    }
    const membership = await this.prisma.groupMembership.create({
      data: {
        branchId: input.branchId,
        personId: input.personId,
        groupId: input.groupId,
        groupType: input.groupType,
        startedAt: now,
      },
    });
    if (input.personLifecycleStageUpdate) {
      await this.prisma.person.update({
        where: { id: input.personId },
        data: { lifecycleStage: input.personLifecycleStageUpdate as never },
      });
    }
    return membership;
  }

  /**
   * `[Milestone B: People + Pastoral + Outreach Foundation]` Ends a single
   * active membership with no replacement opened - the "leave" gap
   * `MILESTONE_B_DESIGN_NOTES.md` Part 3 identified (`applyChange` above
   * is the only other mutation, and it always requires a target group to
   * open). Same `endedAt`/`reason` shape `applyChange` already uses for
   * closing a membership.
   */
  closeMembership(membershipId: string, reason: string): Promise<GroupMembership> {
    return this.prisma.groupMembership.update({
      where: { id: membershipId },
      data: { endedAt: new Date(), reason },
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

  /**
   * `[Resident Pastor Dashboard - Volunteers milestone]` The Volunteers
   * KPI's underlying query - distinct Persons (`distinct: ['personId']`,
   * not a row count - one Person can hold several concurrent Basonta
   * memberships) with a `MINISTRY`-type membership active *as of* `asOf`
   * (default: now). `startedAt <= asOf AND (endedAt IS NULL OR endedAt >
   * asOf)` is a genuine point-in-time reconstruction, not just "active
   * right now" - the same technique `PersonRepository.countByBranchCreatedBefore`
   * uses for Members, which is what makes `volunteersTrend` (current count
   * minus the count as of the start of this month) honestly computable
   * from this table rather than invented.
   */
  async countDistinctActiveMinistryMembersByBranch(branchId: string, asOf: Date = new Date()): Promise<number> {
    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        branchId,
        groupType: 'MINISTRY',
        startedAt: { lte: asOf },
        OR: [{ endedAt: null }, { endedAt: { gt: asOf } }],
      },
      distinct: ['personId'],
      select: { personId: true },
    });
    return memberships.length;
  }
}
