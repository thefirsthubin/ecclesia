import type { ActorContext } from '@ecclesia/rbac';

import { GatheringTypeCategoryMappingController } from './gathering-type-category-mapping.controller';

describe('[Milestone C] GatheringTypeCategoryMappingController', () => {
  const actor: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };

  function buildController() {
    const gatheringTypeCategoryService = { listMappings: jest.fn(), upsertMapping: jest.fn() };
    const controller = new GatheringTypeCategoryMappingController(gatheringTypeCategoryService as never);
    return { controller, gatheringTypeCategoryService };
  }

  it('list() delegates to listMappings with the actor\'s own Branch', async () => {
    const { controller, gatheringTypeCategoryService } = buildController();

    await controller.list(actor);

    expect(gatheringTypeCategoryService.listMappings).toHaveBeenCalledWith('branch-1');
  });

  it('upsert() delegates to upsertMapping with the actor\'s own Branch and the parsed body', async () => {
    const { controller, gatheringTypeCategoryService } = buildController();
    const body = { gatheringType: 'Sunday Service', category: 'SUNDAY' } as never;

    await controller.upsert(actor, body);

    expect(gatheringTypeCategoryService.upsertMapping).toHaveBeenCalledWith('branch-1', body);
  });
});
