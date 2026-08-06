import { GatheringSeriesRepository } from './gathering-series.repository';

describe('GatheringSeriesRepository', () => {
  function buildRepository() {
    const prisma = {
      gatheringSeries: { create: jest.fn(), findUnique: jest.fn() },
    };
    const repository = new GatheringSeriesRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.gatheringSeries.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.gatheringSeries.create.mockResolvedValue({ id: 'series-1' });
    const input = {
      branchId: 'branch-1',
      type: 'BACENTA_MEETING',
      startDate: new Date('2026-01-01'),
      createdByPersonId: 'ap-1',
    };

    const result = await repository.create(input);

    expect(prisma.gatheringSeries.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual({ id: 'series-1' });
  });

  it('findById() delegates directly to prisma.gatheringSeries.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.gatheringSeries.findUnique.mockResolvedValue({ id: 'series-1' });

    const result = await repository.findById('series-1');

    expect(prisma.gatheringSeries.findUnique).toHaveBeenCalledWith({ where: { id: 'series-1' } });
    expect(result).toEqual({ id: 'series-1' });
  });
});
