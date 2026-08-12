import { SilentDriftFlagController } from './silent-drift-flag.controller';

const actor = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } as never;

describe('SilentDriftFlagController', () => {
  function buildController() {
    const silentDriftFlagService = { listForGroup: jest.fn(), list: jest.fn() };
    const controller = new SilentDriftFlagController(silentDriftFlagService as never);
    return { controller, silentDriftFlagService };
  }

  it('listForGroup() delegates to SilentDriftFlagService.listForGroup with the parsed status filter', async () => {
    const { controller, silentDriftFlagService } = buildController();

    await controller.listForGroup('bacenta-1', { status: ['FLAGGED', 'ESCALATED'] } as never);

    expect(silentDriftFlagService.listForGroup).toHaveBeenCalledWith('bacenta-1', ['FLAGGED', 'ESCALATED']);
  });

  /** `[Silent-Drift Detection Branch-wide milestone]` */
  it('list() delegates to SilentDriftFlagService.list with the current actor and parsed query', async () => {
    const { controller, silentDriftFlagService } = buildController();
    const query = { groupId: 'bacenta-1', status: ['FLAGGED'] } as never;

    await controller.list(actor, query);

    expect(silentDriftFlagService.list).toHaveBeenCalledWith(actor, query);
  });
});
