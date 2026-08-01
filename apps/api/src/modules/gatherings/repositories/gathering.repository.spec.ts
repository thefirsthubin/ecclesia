import { GatheringRepository } from './gathering.repository';

describe('GatheringRepository', () => {
  function buildRepository() {
    const prisma = {
      gathering: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    };
    const repository = new GatheringRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.gathering.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.gathering.create.mockResolvedValue({ id: 'g-1' });
    const input = {
      branchId: 'branch-1',
      type: 'SUNDAY_SERVICE',
      scheduledStart: new Date('2026-08-02T09:00:00.000Z'),
      createdByPersonId: 'ap-1',
    };

    const result = await repository.create(input);

    expect(prisma.gathering.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual({ id: 'g-1' });
  });

  it('findById() delegates directly to prisma.gathering.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.gathering.findUnique.mockResolvedValue({ id: 'g-1' });

    const result = await repository.findById('g-1');

    expect(prisma.gathering.findUnique).toHaveBeenCalledWith({ where: { id: 'g-1' } });
    expect(result).toEqual({ id: 'g-1' });
  });

  it('update() delegates directly to prisma.gathering.update', async () => {
    const { repository, prisma } = buildRepository();
    prisma.gathering.update.mockResolvedValue({ id: 'g-1', status: 'CANCELLED' });

    const result = await repository.update('g-1', { status: 'CANCELLED' });

    expect(prisma.gathering.update).toHaveBeenCalledWith({ where: { id: 'g-1' }, data: { status: 'CANCELLED' } });
    expect(result).toEqual({ id: 'g-1', status: 'CANCELLED' });
  });
});
