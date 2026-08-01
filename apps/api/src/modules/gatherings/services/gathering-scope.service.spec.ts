import { NotFoundException } from '@nestjs/common';

import { GatheringScopeService } from './gathering-scope.service';

describe('GatheringScopeService', () => {
  function buildService() {
    const gatheringRepository = { findById: jest.fn() };
    const service = new GatheringScopeService(gatheringRepository as never);
    return { service, gatheringRepository };
  }

  it('throws NotFoundException when the Gathering does not exist', async () => {
    const { service, gatheringRepository } = buildService();
    gatheringRepository.findById.mockResolvedValue(null);

    await expect(service.loadScope('missing')).rejects.toThrow(NotFoundException);
  });

  it('resolves to { branchId } for an existing Gathering', async () => {
    const { service, gatheringRepository } = buildService();
    gatheringRepository.findById.mockResolvedValue({ id: 'gathering-1', branchId: 'branch-1' });

    const result = await service.loadScope('gathering-1');

    expect(result).toEqual({ branchId: 'branch-1' });
  });
});
