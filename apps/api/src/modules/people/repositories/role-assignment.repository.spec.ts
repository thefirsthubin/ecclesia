import { RoleAssignmentRepository } from './role-assignment.repository';

describe('RoleAssignmentRepository', () => {
  function buildRepository() {
    const prisma = {
      roleAssignment: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
      user: { findUnique: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
    };
    const repository = new RoleAssignmentRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.roleAssignment.create, omitting effectiveFrom when unset', async () => {
    const { repository, prisma } = buildRepository();
    prisma.roleAssignment.create.mockResolvedValue({ id: 'ra-1' });

    await repository.create({ personId: 'p1', role: 'WORKER', branchId: 'branch-1', scopeGroupIds: [] });

    expect(prisma.roleAssignment.create).toHaveBeenCalledWith({
      data: {
        personId: 'p1',
        role: 'WORKER',
        branchId: 'branch-1',
        groupId: undefined,
        scopeGroupIds: [],
        grantedByUserId: undefined,
      },
    });
  });

  it('findUserIdByPersonId returns undefined when no User row is linked', async () => {
    const { repository, prisma } = buildRepository();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(repository.findUserIdByPersonId('p1')).resolves.toBeUndefined();
  });

  it('findActiveBacentaLeader queries for an active BACENTA_LEADER row scoped to the given Group', async () => {
    const { repository, prisma } = buildRepository();
    const now = new Date('2026-08-01T00:00:00Z');
    prisma.roleAssignment.findFirst.mockResolvedValue({ id: 'ra-prior' });

    const result = await repository.findActiveBacentaLeader('bacenta-1', now);

    expect(prisma.roleAssignment.findFirst).toHaveBeenCalledWith({
      where: {
        groupId: 'bacenta-1',
        role: 'BACENTA_LEADER',
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      },
    });
    expect(result).toEqual({ id: 'ra-prior' });
  });

  it('createWithSuccession closes the prior holder and creates the new one in one transaction', async () => {
    const { repository, prisma } = buildRepository();
    const now = new Date('2026-08-01T00:00:00Z');
    prisma.roleAssignment.create.mockResolvedValue({ id: 'ra-new' });

    const result = await repository.createWithSuccession(
      { personId: 'p2', role: 'BACENTA_LEADER', branchId: 'branch-1', groupId: 'bacenta-1', scopeGroupIds: [] },
      'ra-prior',
      now,
    );

    expect(prisma.roleAssignment.update).toHaveBeenCalledWith({
      where: { id: 'ra-prior' },
      data: { effectiveTo: now },
    });
    expect(prisma.roleAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ personId: 'p2', role: 'BACENTA_LEADER' }) }),
    );
    expect(result).toEqual({ id: 'ra-new' });
  });

  it('createWithSuccession skips the close step when there is no prior holder', async () => {
    const { repository, prisma } = buildRepository();
    const now = new Date('2026-08-01T00:00:00Z');
    prisma.roleAssignment.create.mockResolvedValue({ id: 'ra-new' });

    await repository.createWithSuccession(
      { personId: 'p2', role: 'BACENTA_LEADER', branchId: 'branch-1', groupId: 'bacenta-1', scopeGroupIds: [] },
      undefined,
      now,
    );

    expect(prisma.roleAssignment.update).not.toHaveBeenCalled();
  });

  it('listByPerson() returns every Role Assignment (active and past) for the Person, newest first', async () => {
    const { repository, prisma } = buildRepository();
    prisma.roleAssignment.findMany.mockResolvedValue([{ id: 'ra-2' }, { id: 'ra-1' }]);

    const result = await repository.listByPerson('person-1');

    expect(prisma.roleAssignment.findMany).toHaveBeenCalledWith({
      where: { personId: 'person-1' },
      orderBy: { effectiveFrom: 'desc' },
    });
    expect(result).toEqual([{ id: 'ra-2' }, { id: 'ra-1' }]);
  });
});
