import type { ActorContext } from '@ecclesia/rbac';

import { CounsellingSessionController, CounsellingSessionStatusController } from './counselling-session.controller';

describe('[Milestone B] CounsellingSessionController', () => {
  const actor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

  function buildController() {
    const counsellingSessionService = { create: jest.fn(), listByPerson: jest.fn(), updateStatus: jest.fn() };
    const controller = new CounsellingSessionController(counsellingSessionService as never);
    return { controller, counsellingSessionService };
  }

  it('create() delegates to CounsellingSessionService.create with the current actor', async () => {
    const { controller, counsellingSessionService } = buildController();
    const body = { scheduledAt: '2026-08-20T10:00:00.000Z' } as never;

    await controller.create(actor, 'person-1', body);

    expect(counsellingSessionService.create).toHaveBeenCalledWith(actor, 'person-1', body);
  });

  it('listByPerson() delegates to CounsellingSessionService.listByPerson', async () => {
    const { controller, counsellingSessionService } = buildController();

    await controller.listByPerson('person-1');

    expect(counsellingSessionService.listByPerson).toHaveBeenCalledWith('person-1');
  });
});

describe('[Milestone B] CounsellingSessionStatusController', () => {
  it('updateStatus() delegates to CounsellingSessionService.updateStatus', async () => {
    const counsellingSessionService = { create: jest.fn(), listByPerson: jest.fn(), updateStatus: jest.fn() };
    const controller = new CounsellingSessionStatusController(counsellingSessionService as never);
    const body = { status: 'COMPLETED' } as never;

    await controller.updateStatus('session-1', body);

    expect(counsellingSessionService.updateStatus).toHaveBeenCalledWith('session-1', body);
  });
});
