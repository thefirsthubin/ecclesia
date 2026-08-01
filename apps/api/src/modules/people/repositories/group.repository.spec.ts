import { GroupRepository } from './group.repository';

describe('GroupRepository', () => {
  function buildRepository() {
    const prisma = {
      group: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    };
    const repository = new GroupRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() delegates directly to prisma.group.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.group.create.mockResolvedValue({ id: 'group-1' });
    const input = { branchId: 'branch-1', type: 'PASTORAL_CARE' as const, name: 'Grace Bacenta' };

    const result = await repository.create(input);

    expect(prisma.group.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual({ id: 'group-1' });
  });

  it('findById() delegates directly to prisma.group.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.group.findUnique.mockResolvedValue({ id: 'group-1' });

    const result = await repository.findById('group-1');

    expect(prisma.group.findUnique).toHaveBeenCalledWith({ where: { id: 'group-1' } });
    expect(result).toEqual({ id: 'group-1' });
  });

  it('update() delegates directly to prisma.group.update', async () => {
    const { repository, prisma } = buildRepository();
    prisma.group.update.mockResolvedValue({ id: 'group-1', name: 'Renamed Bacenta' });
    const input = { name: 'Renamed Bacenta' };

    const result = await repository.update('group-1', input);

    expect(prisma.group.update).toHaveBeenCalledWith({ where: { id: 'group-1' }, data: input });
    expect(result).toEqual({ id: 'group-1', name: 'Renamed Bacenta' });
  });
});
