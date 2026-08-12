import { GroupMembershipRepository } from './group-membership.repository';

describe('GroupMembershipRepository', () => {
  function buildRepository() {
    const prisma = {
      group: { findUnique: jest.fn() },
      groupMembership: { count: jest.fn(), findMany: jest.fn(), updateMany: jest.fn(), create: jest.fn().mockResolvedValue({ id: 'membership-new' }) },
      person: { update: jest.fn() },
    };
    const repository = new GroupMembershipRepository(prisma as never);
    return { repository, prisma };
  }

  /**
   * `[Bug fix, Group Membership Assignment milestone]` `applyChange` no
   * longer opens its own `this.prisma.$transaction(...)` - confirmed live
   * against real Postgres that doing so broke RLS (a second, unscoped
   * transaction that never ran `runInBranchScope`'s `SET LOCAL
   * app.current_branch_id`, so every statement inside it 500'd with
   * "unrecognized configuration parameter"). These tests assert directly
   * against `prisma.X`, not a `tx` stand-in, matching what the fixed
   * implementation actually calls - atomicity now comes from
   * `BranchScopeInterceptor`'s own single request-wide transaction, not a
   * nested one.
   */
  it('applyChange closes prior memberships and creates the new one', async () => {
    const { repository, prisma } = buildRepository();

    const result = await repository.applyChange({
      branchId: 'branch-1',
      personId: 'person-1',
      groupId: 'bacenta-2',
      groupType: 'PASTORAL_CARE',
      membershipIdsToClose: ['membership-1'],
      reason: 'moved house',
    });

    expect(prisma.groupMembership.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['membership-1'] } },
      data: { endedAt: expect.any(Date), reason: 'moved house' },
    });
    expect(prisma.groupMembership.create).toHaveBeenCalledWith({
      data: {
        branchId: 'branch-1',
        personId: 'person-1',
        groupId: 'bacenta-2',
        groupType: 'PASTORAL_CARE',
        startedAt: expect.any(Date),
      },
    });
    expect(result).toEqual({ id: 'membership-new' });
  });

  it('applyChange skips the close step when there is nothing to close', async () => {
    const { repository, prisma } = buildRepository();

    await repository.applyChange({
      branchId: 'branch-1',
      personId: 'person-1',
      groupId: 'basonta-1',
      groupType: 'MINISTRY',
      membershipIdsToClose: [],
    });

    expect(prisma.groupMembership.updateMany).not.toHaveBeenCalled();
    expect(prisma.groupMembership.create).toHaveBeenCalled();
  });

  it('applyChange also updates the Person lifecycle stage when requested (PRD §19.1 step 6)', async () => {
    const { repository, prisma } = buildRepository();

    await repository.applyChange({
      branchId: 'branch-1',
      personId: 'person-1',
      groupId: 'bacenta-1',
      groupType: 'PASTORAL_CARE',
      membershipIdsToClose: [],
      personLifecycleStageUpdate: 'ASSIGNED_TO_BACENTA',
    });

    expect(prisma.person.update).toHaveBeenCalledWith({
      where: { id: 'person-1' },
      data: { lifecycleStage: 'ASSIGNED_TO_BACENTA' },
    });
  });

  it('applyChange does not touch the Person row when no lifecycle update is requested', async () => {
    const { repository, prisma } = buildRepository();

    await repository.applyChange({
      branchId: 'branch-1',
      personId: 'person-1',
      groupId: 'basonta-1',
      groupType: 'MINISTRY',
      membershipIdsToClose: [],
    });

    expect(prisma.person.update).not.toHaveBeenCalled();
  });

  describe('Ministry milestone additions', () => {
    it('countActiveByGroup() counts only un-ended memberships for the Group', async () => {
      const { repository, prisma } = buildRepository();
      prisma.groupMembership.count.mockResolvedValue(5);

      const result = await repository.countActiveByGroup('basonta-1');

      expect(prisma.groupMembership.count).toHaveBeenCalledWith({ where: { groupId: 'basonta-1', endedAt: null } });
      expect(result).toBe(5);
    });

    it('listActiveByGroup() selects only personId/startedAt, ordered oldest-first', async () => {
      const { repository, prisma } = buildRepository();
      prisma.groupMembership.findMany.mockResolvedValue([]);

      await repository.listActiveByGroup('basonta-1');

      expect(prisma.groupMembership.findMany).toHaveBeenCalledWith({
        where: { groupId: 'basonta-1', endedAt: null },
        select: { personId: true, startedAt: true },
        orderBy: { startedAt: 'asc' },
      });
    });

    it('countActiveMinistryMembershipsForPerson() filters to MINISTRY-type, un-ended memberships', async () => {
      const { repository, prisma } = buildRepository();
      prisma.groupMembership.count.mockResolvedValue(2);

      const result = await repository.countActiveMinistryMembershipsForPerson('person-1');

      expect(prisma.groupMembership.count).toHaveBeenCalledWith({
        where: { personId: 'person-1', groupType: 'MINISTRY', endedAt: null },
      });
      expect(result).toBe(2);
    });
  });

  describe('People Web Admin sprint additions (FR-PPL-07)', () => {
    it('listByPerson() returns every membership (active and ended) for the Person, newest first', async () => {
      const { repository, prisma } = buildRepository();
      prisma.groupMembership.findMany.mockResolvedValue([{ id: 'm2' }, { id: 'm1' }]);

      const result = await repository.listByPerson('person-1');

      expect(prisma.groupMembership.findMany).toHaveBeenCalledWith({
        where: { personId: 'person-1' },
        orderBy: { startedAt: 'desc' },
      });
      expect(result).toEqual([{ id: 'm2' }, { id: 'm1' }]);
    });
  });

  describe('countDistinctActiveMinistryMembersByBranch (Resident Pastor Dashboard - Volunteers milestone)', () => {
    it('queries MINISTRY-type, branch-scoped, distinct by personId', async () => {
      const { repository, prisma } = buildRepository();
      prisma.groupMembership.findMany.mockResolvedValue([{ personId: 'p1' }, { personId: 'p2' }]);
      const asOf = new Date('2026-08-01T00:00:00.000Z');

      const result = await repository.countDistinctActiveMinistryMembersByBranch('branch-1', asOf);

      expect(prisma.groupMembership.findMany).toHaveBeenCalledWith({
        where: {
          branchId: 'branch-1',
          groupType: 'MINISTRY',
          startedAt: { lte: asOf },
          OR: [{ endedAt: null }, { endedAt: { gt: asOf } }],
        },
        distinct: ['personId'],
        select: { personId: true },
      });
      expect(result).toBe(2);
    });

    it('counts a Person once even with multiple concurrent MINISTRY memberships (distinct, not a row count)', async () => {
      const { repository, prisma } = buildRepository();
      // `distinct: ['personId']` is asserted above to be part of the real
      // query - this test's mock simulates what Postgres itself would
      // already collapse duplicates down to, confirming the repository
      // trusts that and does not separately re-count rows.
      prisma.groupMembership.findMany.mockResolvedValue([{ personId: 'p1' }]);

      const result = await repository.countDistinctActiveMinistryMembersByBranch('branch-1');

      expect(result).toBe(1);
    });

    it('returns 0, not an error, for a branch with no Ministry memberships', async () => {
      const { repository, prisma } = buildRepository();
      prisma.groupMembership.findMany.mockResolvedValue([]);

      const result = await repository.countDistinctActiveMinistryMembersByBranch('branch-1');

      expect(result).toBe(0);
    });

    it('defaults asOf to the current time when omitted', async () => {
      const { repository, prisma } = buildRepository();
      prisma.groupMembership.findMany.mockResolvedValue([]);
      const before = Date.now();

      await repository.countDistinctActiveMinistryMembersByBranch('branch-1');

      const call = prisma.groupMembership.findMany.mock.calls[0][0];
      expect(call.where.startedAt.lte.getTime()).toBeGreaterThanOrEqual(before);
    });
  });
});
