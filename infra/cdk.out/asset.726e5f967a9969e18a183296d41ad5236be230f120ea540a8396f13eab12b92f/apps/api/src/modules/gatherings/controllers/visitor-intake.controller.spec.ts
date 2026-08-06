import type { ActorContext } from '@ecclesia/rbac';

import { VisitorIntakeController } from './visitor-intake.controller';

describe('VisitorIntakeController', () => {
  const actor: ActorContext = { personId: 'usher-1', role: 'BACENTA_LEADER', branchId: 'branch-1' };

  function buildController() {
    const visitorIntakeService = { submit: jest.fn() };
    const controller = new VisitorIntakeController(visitorIntakeService as never);
    return { controller, visitorIntakeService };
  }

  it('submit() delegates to VisitorIntakeService.submit with the current actor', async () => {
    const { controller, visitorIntakeService } = buildController();
    const body = { firstName: 'Jane', lastName: 'Doe', firstTimeGuest: true } as never;

    await controller.submit(actor, body);

    expect(visitorIntakeService.submit).toHaveBeenCalledWith(actor, body);
  });
});
