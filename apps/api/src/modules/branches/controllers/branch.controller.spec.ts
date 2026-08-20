import type { ActorContext } from '@ecclesia/rbac';

import { BranchController } from './branch.controller';

describe('BranchController', () => {
  const actor: ActorContext = { personId: 'overseer-1', role: 'COUNCIL_OVERSEER', branchId: 'branch-1', councilBranchIds: ['branch-1', 'branch-2'] };

  function buildController() {
    const branchReadService = { listForActor: jest.fn() };
    const controller = new BranchController(branchReadService as never);
    return { controller, branchReadService };
  }

  it('list() delegates to BranchReadService.listForActor with the full ActorContext', async () => {
    const { controller, branchReadService } = buildController();
    branchReadService.listForActor.mockResolvedValue([]);

    await controller.list(actor);

    expect(branchReadService.listForActor).toHaveBeenCalledWith(actor);
  });
});
