import { TenantReadService } from './tenant-read.service';

describe('[Post-Milestone D — Portal Experiences follow-up] TenantReadService', () => {
  function buildService() {
    const repository = { listAll: jest.fn() };
    const service = new TenantReadService(repository as never);
    return { service, repository };
  }

  it('lists every Tenant, mapped to the response shape', async () => {
    const { service, repository } = buildService();
    repository.listAll.mockResolvedValue([
      { id: 'tenant-1', name: 'River of Life', createdAt: new Date('2026-08-01T00:00:00.000Z'), updatedAt: new Date('2026-08-01T00:00:00.000Z') },
    ]);

    const result = await service.list();

    expect(result).toEqual([{ id: 'tenant-1', name: 'River of Life', createdAt: '2026-08-01T00:00:00.000Z' }]);
  });

  it('returns an empty array when no Tenants exist', async () => {
    const { service, repository } = buildService();
    repository.listAll.mockResolvedValue([]);

    const result = await service.list();

    expect(result).toEqual([]);
  });
});
