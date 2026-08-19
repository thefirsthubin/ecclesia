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
        priority: undefined,
        description: undefined,
        trigger: undefined,
      },
    });
    expect(result).toEqual({ id: 'ft-1' });
  });

  it('[Milestone B] create() passes priority/description/trigger through when given', async () => {
    const { repository, prisma } = buildRepository();
    prisma.followUpTask.create.mockResolvedValue({ id: 'ft-1' });

    await repository.create({
      branchId: 'branch-1',
      personId: 'person-1',
      assignedToPersonId: 'shepherd-1',
      priority: 'HIGH',
      description: 'missed three Sundays',
      trigger: 'LAPSED_REENGAGEMENT',
    });

    expect(prisma.followUpTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ priority: 'HIGH', description: 'missed three Sundays', trigger: 'LAPSED_REENGAGEMENT' }),
    });
  });

  it('findById() delegates directly to prisma.followUpTask.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.followUpTask.findUnique.mockResolvedValue({ id: 'ft-1' });

    const result = await repository.findById('ft-1');

    expect(prisma.followUpTask.findUnique).toHaveBeenCalledWith({ where: { id: 'ft-1' } });
    expect(result).toEqual({ id: 'ft-1' });
  });

  it('updateStatus() delegates directly to prisma.followUpTask.update', async () => {
    const { repository, prisma } = buildRepository();
    prisma.followUpTask.update.mockResolvedValue({ id: 'ft-1', status: 'COMPLETED' });

    const result = await repository.updateStatus('ft-1', { status: 'COMPLETED' });

    expect(prisma.followUpTask.update).toHaveBeenCalledWith({ where: { id: 'ft-1' }, data: { status: 'COMPLETED' } });
    expect(result).toEqual({ id: 'ft-1', status: 'COMPLETED' });
  });

  it('[Milestone B] updateStatus() also passes completedAt through when given', async () => {
    const { repository, prisma } = buildRepository();
    prisma.followUpTask.update.mockResolvedValue({ id: 'ft-1', status: 'COMPLETED' });
    const completedAt = new Date('2026-08-18T00:00:00.000Z');

    await repository.updateStatus('ft-1', { status: 'COMPLETED', completedAt });

    expect(prisma.followUpTask.update).toHaveBeenCalledWith({ where: { id: 'ft-1' }, data: { status: 'COMPLETED', completedAt } });
  });

  describe('[Milestone B, Slice 7] listByBranchWithDueAtInRange', () => {
    it('filters by branchId, the default open statuses, and a dueAt window', async () => {
      const { repository, prisma } = buildRepository();
      prisma.followUpTask.findMany.mockResolvedValue([{ id: 'ft-1' }]);
      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-08-31T00:00:00.000Z');

      const result = await repository.listByBranchWithDueAtInRange('branch-1', from, to);

      expect(prisma.followUpTask.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1', status: { in: ['OPEN', 'ESCALATED'] }, dueAt: { gte: from, lte: to } },
        orderBy: { dueAt: 'asc' },
      });
      expect(result).toEqual([{ id: 'ft-1' }]);
    });
  });

  it('[Milestone B] updateDetails() delegates directly to prisma.followUpTask.update', async () => {
    const { repository, prisma } = buildRepository();
    prisma.followUpTask.update.mockResolvedValue({ id: 'ft-1', priority: 'HIGH', description: 'urgent' });

    const result = await repository.updateDetails('ft-1', { priority: 'HIGH', description: 'urgent' });

    expect(prisma.followUpTask.update).toHaveBeenCalledWith({ where: { id: 'ft-1' }, data: { priority: 'HIGH', description: 'urgent' } });
    expect(result).toEqual({ id: 'ft-1', priority: 'HIGH', description: 'urgent' });
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

  describe('listByPerson (Branch Pastor portal, Pastoral Care sprint)', () => {
    it('queries every status for the Person, newest first - a history view, not the open-only queue', async () => {
      const { repository, prisma } = buildRepository();
      prisma.followUpTask.findMany.mockResolvedValue([{ id: 'ft-1' }]);

      const result = await repository.listByPerson('person-1');

      expect(prisma.followUpTask.findMany).toHaveBeenCalledWith({
        where: { personId: 'person-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([{ id: 'ft-1' }]);
    });
  });

  describe('[Milestone C] listByGroups', () => {
    it('filters by groupId IN the given set, defaulting to the two still-open statuses', async () => {
      const { repository, prisma } = buildRepository();
      prisma.followUpTask.findMany.mockResolvedValue([{ id: 'ft-1' }]);

      const result = await repository.listByGroups(['bacenta-1', 'bacenta-2']);

      expect(prisma.followUpTask.findMany).toHaveBeenCalledWith({
        where: { groupId: { in: ['bacenta-1', 'bacenta-2'] }, status: { in: ['OPEN', 'ESCALATED'] } },
        orderBy: [{ dueAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
      });
      expect(result).toEqual([{ id: 'ft-1' }]);
    });

    it('returns an empty array without querying when given an empty group set', async () => {
      const { repository, prisma } = buildRepository();

      const result = await repository.listByGroups([]);

      expect(prisma.followUpTask.findMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('[Milestone C] listByGroupsWithDueAtInRange', () => {
    it('filters by groupId IN the given set, the default open statuses, and a dueAt window', async () => {
      const { repository, prisma } = buildRepository();
      prisma.followUpTask.findMany.mockResolvedValue([{ id: 'ft-1' }]);
      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-08-31T00:00:00.000Z');

      const result = await repository.listByGroupsWithDueAtInRange(['bacenta-1'], from, to);

      expect(prisma.followUpTask.findMany).toHaveBeenCalledWith({
        where: { groupId: { in: ['bacenta-1'] }, status: { in: ['OPEN', 'ESCALATED'] }, dueAt: { gte: from, lte: to } },
        orderBy: { dueAt: 'asc' },
      });
      expect(result).toEqual([{ id: 'ft-1' }]);
    });
  });
});
