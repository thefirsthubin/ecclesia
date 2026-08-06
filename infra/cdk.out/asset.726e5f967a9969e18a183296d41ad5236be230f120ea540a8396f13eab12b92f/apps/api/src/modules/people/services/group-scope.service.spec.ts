import { NotFoundException } from '@nestjs/common';

import { GroupScopeService } from './group-scope.service';

describe('GroupScopeService', () => {
  function buildService() {
    const groupRepository = { findById: jest.fn() };
    const service = new GroupScopeService(groupRepository as never);
    return { service, groupRepository };
  }

  it('throws NotFoundException when the target Group does not exist', async () => {
    const { service, groupRepository } = buildService();
    groupRepository.findById.mockResolvedValue(null);

    await expect(service.loadResourceContext('missing')).rejects.toThrow(NotFoundException);
  });

  it('reports a PASTORAL_CARE Group’s own id as resource.bacentaId', async () => {
    const { service, groupRepository } = buildService();
    groupRepository.findById.mockResolvedValue({ id: 'bacenta-1', branchId: 'branch-1', type: 'PASTORAL_CARE' });

    const resource = await service.loadResourceContext('bacenta-1');

    expect(resource).toEqual({ branchId: 'branch-1', bacentaId: 'bacenta-1', basontaId: undefined });
  });

  it('reports a MINISTRY Group’s own id as resource.basontaId', async () => {
    const { service, groupRepository } = buildService();
    groupRepository.findById.mockResolvedValue({ id: 'basonta-1', branchId: 'branch-1', type: 'MINISTRY' });

    const resource = await service.loadResourceContext('basonta-1');

    expect(resource).toEqual({ branchId: 'branch-1', bacentaId: undefined, basontaId: 'basonta-1' });
  });
});
