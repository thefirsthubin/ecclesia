import { TenantReadRepository } from './tenant-read.repository';

describe('[Post-Milestone D — Portal Experiences follow-up] TenantReadRepository', () => {
  function buildRepository() {
    const prisma = { tenant: { findMany: jest.fn() } };
    const repository = new TenantReadRepository(prisma as never);
    return { repository, prisma };
  }

  it('listAll() lists every Tenant, ordered by name', async () => {
    const { repository, prisma } = buildRepository();
    prisma.tenant.findMany.mockResolvedValue([{ id: 'tenant-1', name: 'River of Life' }]);

    const result = await repository.listAll();

    expect(prisma.tenant.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
    expect(result).toEqual([{ id: 'tenant-1', name: 'River of Life' }]);
  });
});
