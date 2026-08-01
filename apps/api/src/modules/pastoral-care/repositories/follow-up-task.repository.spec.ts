import { FollowUpTaskRepository } from './follow-up-task.repository';

describe('FollowUpTaskRepository', () => {
  function buildRepository() {
    const prisma = {
      followUpTask: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
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
});
