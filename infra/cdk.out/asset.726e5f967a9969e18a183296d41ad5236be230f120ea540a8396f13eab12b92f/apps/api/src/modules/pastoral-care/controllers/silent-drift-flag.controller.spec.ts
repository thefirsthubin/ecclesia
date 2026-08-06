import { SilentDriftFlagController } from './silent-drift-flag.controller';

describe('SilentDriftFlagController', () => {
  function buildController() {
    const silentDriftFlagService = { listForGroup: jest.fn() };
    const controller = new SilentDriftFlagController(silentDriftFlagService as never);
    return { controller, silentDriftFlagService };
  }

  it('listForGroup() delegates to SilentDriftFlagService.listForGroup with the parsed status filter', async () => {
    const { controller, silentDriftFlagService } = buildController();

    await controller.listForGroup('bacenta-1', { status: ['FLAGGED', 'ESCALATED'] } as never);

    expect(silentDriftFlagService.listForGroup).toHaveBeenCalledWith('bacenta-1', ['FLAGGED', 'ESCALATED']);
  });
});
