import { RosterController } from './roster.controller';

describe('RosterController', () => {
  function buildController() {
    const rosterService = { listRoster: jest.fn(), listOvercommitmentFlags: jest.fn() };
    const controller = new RosterController(rosterService as never);
    return { controller, rosterService };
  }

  it('listRoster() delegates to RosterService.listRoster', async () => {
    const { controller, rosterService } = buildController();

    await controller.listRoster('basonta-1');

    expect(rosterService.listRoster).toHaveBeenCalledWith('basonta-1');
  });

  it('listOvercommitmentFlags() delegates to RosterService.listOvercommitmentFlags', async () => {
    const { controller, rosterService } = buildController();

    await controller.listOvercommitmentFlags('basonta-1');

    expect(rosterService.listOvercommitmentFlags).toHaveBeenCalledWith('basonta-1');
  });
});
