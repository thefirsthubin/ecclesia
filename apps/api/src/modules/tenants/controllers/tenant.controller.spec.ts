import { TenantController } from './tenant.controller';

describe('[Post-Milestone D — Portal Experiences follow-up] TenantController', () => {
  function buildController() {
    const tenantReadService = { list: jest.fn() };
    const controller = new TenantController(tenantReadService as never);
    return { controller, tenantReadService };
  }

  it('list() delegates to TenantReadService.list', async () => {
    const { controller, tenantReadService } = buildController();
    tenantReadService.list.mockResolvedValue([]);

    await controller.list();

    expect(tenantReadService.list).toHaveBeenCalledWith();
  });
});
