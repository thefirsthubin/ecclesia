import { GatheringTypeCategoryMappingRepository } from './gathering-type-category-mapping.repository';

describe('[Milestone C] GatheringTypeCategoryMappingRepository', () => {
  function buildRepository() {
    const prisma = {
      gatheringTypeCategoryMapping: { upsert: jest.fn(), findMany: jest.fn() },
      configuration: { findUnique: jest.fn() },
    };
    const repository = new GatheringTypeCategoryMappingRepository(prisma as never);
    return { repository, prisma };
  }

  it('upsert() keys on the (branchId, gatheringType) unique pair', async () => {
    const { repository, prisma } = buildRepository();
    prisma.gatheringTypeCategoryMapping.upsert.mockResolvedValue({ id: 'mapping-1' });

    const result = await repository.upsert('branch-1', 'Sunday Service', 'SUNDAY');

    expect(prisma.gatheringTypeCategoryMapping.upsert).toHaveBeenCalledWith({
      where: { branchId_gatheringType: { branchId: 'branch-1', gatheringType: 'Sunday Service' } },
      create: { branchId: 'branch-1', gatheringType: 'Sunday Service', category: 'SUNDAY' },
      update: { category: 'SUNDAY' },
    });
    expect(result).toEqual({ id: 'mapping-1' });
  });

  it('listByBranch() filters by branchId, sorted by gatheringType', async () => {
    const { repository, prisma } = buildRepository();
    prisma.gatheringTypeCategoryMapping.findMany.mockResolvedValue([{ id: 'mapping-1' }]);

    const result = await repository.listByBranch('branch-1');

    expect(prisma.gatheringTypeCategoryMapping.findMany).toHaveBeenCalledWith({
      where: { branchId: 'branch-1' },
      orderBy: { gatheringType: 'asc' },
    });
    expect(result).toEqual([{ id: 'mapping-1' }]);
  });

  describe('findConfiguredGatheringTypes()', () => {
    it('returns the Branch\'s configured gatheringTypes', async () => {
      const { repository, prisma } = buildRepository();
      prisma.configuration.findUnique.mockResolvedValue({ gatheringTypes: ['Sunday Service', 'Bacenta Meeting'] });

      const result = await repository.findConfiguredGatheringTypes('branch-1');

      expect(prisma.configuration.findUnique).toHaveBeenCalledWith({
        where: { branchId: 'branch-1' },
        select: { gatheringTypes: true },
      });
      expect(result).toEqual(['Sunday Service', 'Bacenta Meeting']);
    });

    it('returns an empty array when the Branch has no Configuration row', async () => {
      const { repository, prisma } = buildRepository();
      prisma.configuration.findUnique.mockResolvedValue(null);

      const result = await repository.findConfiguredGatheringTypes('branch-1');

      expect(result).toEqual([]);
    });
  });
});
