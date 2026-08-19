import { GatheringTypeCategoryService } from './gathering-type-category.service';

const NOW = new Date('2026-08-18T00:00:00.000Z');

describe('[Milestone C] GatheringTypeCategoryService', () => {
  function buildService() {
    const repository = {
      upsert: jest.fn(),
      listByBranch: jest.fn(),
      findConfiguredGatheringTypes: jest.fn(),
    };
    const service = new GatheringTypeCategoryService(repository as never);
    return { service, repository };
  }

  it('upsertMapping() delegates to the repository and maps the response', async () => {
    const { service, repository } = buildService();
    repository.upsert.mockResolvedValue({
      id: 'mapping-1',
      branchId: 'branch-1',
      gatheringType: 'Sunday Service',
      category: 'SUNDAY',
      createdAt: NOW,
      updatedAt: NOW,
    });

    const result = await service.upsertMapping('branch-1', { gatheringType: 'Sunday Service', category: 'SUNDAY' });

    expect(repository.upsert).toHaveBeenCalledWith('branch-1', 'Sunday Service', 'SUNDAY');
    expect(result).toEqual({
      id: 'mapping-1',
      branchId: 'branch-1',
      gatheringType: 'Sunday Service',
      category: 'SUNDAY',
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    });
  });

  describe('listMappings()', () => {
    it('reports configured types with no mapping row as unmappedTypes, never guessing a category for them', async () => {
      const { service, repository } = buildService();
      repository.listByBranch.mockResolvedValue([
        { id: 'm1', branchId: 'branch-1', gatheringType: 'Sunday Service', category: 'SUNDAY', createdAt: NOW, updatedAt: NOW },
      ]);
      repository.findConfiguredGatheringTypes.mockResolvedValue(['Sunday Service', 'Wednesday Bible Study', 'Ladies Fellowship']);

      const result = await service.listMappings('branch-1');

      expect(result.mappings).toHaveLength(1);
      expect(result.mappings[0].gatheringType).toBe('Sunday Service');
      expect(result.unmappedTypes).toEqual(['Wednesday Bible Study', 'Ladies Fellowship']);
    });

    it('returns an empty unmappedTypes array when every configured type is mapped', async () => {
      const { service, repository } = buildService();
      repository.listByBranch.mockResolvedValue([
        { id: 'm1', branchId: 'branch-1', gatheringType: 'Sunday Service', category: 'SUNDAY', createdAt: NOW, updatedAt: NOW },
      ]);
      repository.findConfiguredGatheringTypes.mockResolvedValue(['Sunday Service']);

      const result = await service.listMappings('branch-1');

      expect(result.unmappedTypes).toEqual([]);
    });
  });

  describe('typesForCategory()', () => {
    it('returns only the gatheringType strings mapped to the requested category', async () => {
      const { service, repository } = buildService();
      repository.listByBranch.mockResolvedValue([
        { id: 'm1', branchId: 'branch-1', gatheringType: 'Sunday Service', category: 'SUNDAY', createdAt: NOW, updatedAt: NOW },
        { id: 'm2', branchId: 'branch-1', gatheringType: 'Sunday Evening', category: 'SUNDAY', createdAt: NOW, updatedAt: NOW },
        { id: 'm3', branchId: 'branch-1', gatheringType: 'Bacenta Meeting', category: 'BACENTA_MEETING', createdAt: NOW, updatedAt: NOW },
      ]);

      const result = await service.typesForCategory('branch-1', 'SUNDAY');

      expect(result).toEqual(['Sunday Service', 'Sunday Evening']);
    });

    it('returns an empty array, never a guess, when nothing is mapped to that category', async () => {
      const { service, repository } = buildService();
      repository.listByBranch.mockResolvedValue([]);

      const result = await service.typesForCategory('branch-1', 'MIDWEEK');

      expect(result).toEqual([]);
    });
  });
});
