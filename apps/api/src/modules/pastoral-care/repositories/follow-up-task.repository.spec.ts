import { FollowUpTaskRepository } from './follow-up-task.repository';

describe('FollowUpTaskRepository', () => {
  function buildRepository() {
    const prisma = {
      followUpTask: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    };
    const repository = new FollowUpTaskRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.followUpTask.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.followUpTask.create.mockResolvedValue({ id: 'ft-1' });
    const input = { branchId: 'branch-1', personId: 'person-1', assignedToPersonId: 'shepherd-1' };

    const result = await repository.create(input);

    expect(prisma.followUpTask.create).toHaveBeenCalledWith({
      data: {
        branchId: 'branch-1',
        personId: 'person-1',
        assignedToPersonId: 'shepherd-1',
        groupId: undefined,
        dueAt: undefined,
        createdByPersonId: undefined,
      },
    });
    expect(result).toEqual({ id: 'ft-1' });
  });

  it('findById() delegates directly to prisma.followUpTask.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.followUpTask.findUnique.mockResolvedValue({ id: 'ft-1' });

    const result = await repository.findById('ft-1');

    expect(prisma.followUpTask.findUnique).toHaveBeenCalledWith({ where: { id: 'ft-1' } });
    expect(result).toEqual({ id: 'ft-1' });
  });

  it('update() delegates directly to prisma.followUpTask.update', async () => {
    const { repository, prisma } = buildRepository();
    prisma.followUpTask.update.mockResolvedValue({ id: 'ft-1', status: 'COMPLETED' });

    const result = await repository.update('ft-1', { status: 'COMPLETED' });

    expect(prisma.followUpTask.update).toHaveBeenCalledWith({ where: { id: 'ft-1' }, data: { status: 'COMPLETED' } });
    expect(result).toEqual({ id: 'ft-1', status: 'COMPLETED' });
  });

  describe('listByGroup', () => {
    it('defaults to the two still-open statuses, sorted by dueAt ascending with nulls last', async () => {
      const { repository, prisma } = buildRepository();
      prisma.followUpTask.findMany.mockResolvedValue([{ id: 'ft-1' }]);

      const result = await repository.listByGroup('bacenta-1');

      expect(prisma.followUpTask.findMany).toHaveBeenCalledWith({
        where: { groupId: 'bacenta-1', status: { in: ['OPEN', 'ESCALATED'] } },
        orderBy: [{ dueAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
      });
      expect(result).toEqual([{ id: 'ft-1' }]);
    });

    it('honors an explicit status filter instead of the default', async () => {
      const { repository, prisma } = buildRepository();
      prisma.followUpTask.findMany.mockResolvedValue([]);

      await repository.listByGroup('bacenta-1', ['COMPLETED']);

      expect(prisma.followUpTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { groupId: 'bacenta-1', status: { in: ['COMPLETED'] } } }),
      );
    });
  });

  describe('listByBranch (Pastoral Care Web Admin sprint)', () => {
    it('defaults to the two still-open statuses, sorted by dueAt ascending with nulls last', async () => {
      const { repository, prisma } = buildRepository();
      prisma.followUpTask.findMany.mockResolvedValue([{ id: 'ft-1' }]);

      const result = await repository.listByBranch('branch-1');

      expect(prisma.followUpTask.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1', status: { in: ['OPEN', 'ESCALATED'] } },
        orderBy: [{ dueAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
      });
      expect(result).toEqual([{ id: 'ft-1' }]);
    });

    it('honors an explicit status filter instead of the default', async () => {
      const { repository, prisma } = buildRepository();
      prisma.followUpTask.findMany.mockResolvedValue([]);

      await repository.listByBranch('branch-1', ['COMPLETED']);

      expect(prisma.followUpTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { branchId: 'branch-1', status: { in: ['COMPLETED'] } } }),
      );
    });
  });
});
