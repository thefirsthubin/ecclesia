import type { ActorContext } from '@ecclesia/rbac';

import { WorkerAvailabilityController } from './worker-availability.controller';

describe('WorkerAvailabilityController', () => {
  const actor: ActorContext = { personId: 'person-1', role: 'WORKER', branchId: 'branch-1' };

  function buildController() {
    const workerAvailabilityService = { create: jest.fn(), listForActor: jest.fn() };
    const controller = new WorkerAvailabilityController(workerAvailabilityService as never);
    return { controller, workerAvailabilityService };
  }

  it('create() delegates to WorkerAvailabilityService.create with the current actor', async () => {
    const { controller, workerAvailabilityService } = buildController();
    const body = { unavailableFrom: '2026-09-01', unavailableTo: '2026-09-14' } as never;

    await controller.create(actor, body);

    expect(workerAvailabilityService.create).toHaveBeenCalledWith(actor, body);
  });

  it('listMine() delegates to WorkerAvailabilityService.listForActor with the current actor', async () => {
    const { controller, workerAvailabilityService } = buildController();

    await controller.listMine(actor);

    expect(workerAvailabilityService.listForActor).toHaveBeenCalledWith(actor);
  });
});
