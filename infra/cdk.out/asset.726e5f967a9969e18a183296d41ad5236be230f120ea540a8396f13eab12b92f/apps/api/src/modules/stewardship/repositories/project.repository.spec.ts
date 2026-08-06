import { ProjectRepository } from './project.repository';

describe('ProjectRepository', () => {
  function buildRepository() {
    const prisma = {
      project: { create: jest.fn(), findUnique: jest.fn() },
    };
    const repository = new ProjectRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.project.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.project.create.mockResolvedValue({ id: 'proj-1' });
    const input = {
      branchId: 'branch-1',
      name: 'Building Fund',
      targetAmountMinor: 100000000n,
      currency: 'GHS',
      createdByPersonId: 'pastor-1',
    };

    const result = await repository.create(input);

    expect(prisma.project.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual({ id: 'proj-1' });
  });

  it('findById() delegates directly to prisma.project.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.project.findUnique.mockResolvedValue({ id: 'proj-1' });

    const result = await repository.findById('proj-1');

    expect(prisma.project.findUnique).toHaveBeenCalledWith({ where: { id: 'proj-1' } });
    expect(result).toEqual({ id: 'proj-1' });
  });
});
