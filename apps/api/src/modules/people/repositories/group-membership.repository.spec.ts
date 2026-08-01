import { GroupMembershipRepository } from './group-membership.repository';

describe('GroupMembershipRepository', () => {
  function buildRepository() {
    const tx = {
      groupMembership: { updateMany: jest.fn(), create: jest.fn().mockResolvedValue({ id: 'membership-new' }) },
      person: { update: jest.fn() },
    };
    const prisma = {
      group: { findUnique: jest.fn() },
      groupMembership: { count: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx)),
    };
    const repository = new GroupMembershipRepository(prisma as never);
    return { repository, prisma, tx };
  }

  it('applyChange closes prior memberships and creates the new one inside one transaction', async () => {
    const { repository, tx } = buildRepository();

    const result = await repository.applyChange({
      branchId: 'branch-1',
      personId: 'person-1',
      groupId: 'bacenta-2',
      groupType: 'PASTORAL_CARE',
      membershipIdsToClose: ['membership-1'],
      reason: 'moved house',
    });

    expect(tx.groupMembership.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['membership-1'] } },
      data: { endedAt: expect.any(Date), reason: 'moved house' },
    });
    expect(tx.groupMembership.create).toHaveBeenCalledWith({
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
    const { repository, tx } = buildRepository();

    await repository.applyChange({
      branchId: 'branch-1',
      personId: 'person-1',
      groupId: 'basonta-1',
      groupType: 'MINISTRY',
      membershipIdsToClose: [],
    });

    expect(tx.groupMembership.updateMany).not.toHaveBeenCalled();
    expect(tx.groupMembership.create).toHaveBeenCalled();
  });

  it('applyChange also updates the Person lifecycle stage in the same transaction when requested (PRD §19.1 step 6)', async () => {
    const { repository, tx } = buildRepository();

    await repository.applyChange({
      branchId: 'branch-1',
      personId: 'person-1',
      groupId: 'bacenta-1',
      groupType: 'PASTORAL_CARE',
      membershipIdsToClose: [],
      personLifecycleStageUpdate: 'ASSIGNED_TO_BACENTA',
    });

    expect(tx.person.update).toHaveBeenCalledWith({
      where: { id: 'person-1' },
      data: { lifecycleStage: 'ASSIGNED_TO_BACENTA' },
    });
  });

  it('applyChange does not touch the Person row when no lifecycle update is requested', async () => {
    const { repository, tx } = buildRepository();

    await repository.applyChange({
      branchId: 'branch-1',
      personId: 'person-1',
      groupId: 'basonta-1',
      groupType: 'MINISTRY',
      membershipIdsToClose: [],
    });

    expect(tx.person.update).not.toHaveBeenCalled();
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
});
