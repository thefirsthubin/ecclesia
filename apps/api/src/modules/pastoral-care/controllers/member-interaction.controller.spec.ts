import type { ActorContext } from '@ecclesia/rbac';

import { MemberInteractionController } from './member-interaction.controller';

describe('[Milestone B] MemberInteractionController', () => {
  const actor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

  function buildController() {
    const memberInteractionService = { create: jest.fn(), listByPerson: jest.fn() };
    const controller = new MemberInteractionController(memberInteractionService as never);
    return { controller, memberInteractionService };
  }

  it('create() delegates to MemberInteractionService.create with the current actor', async () => {
    const { controller, memberInteractionService } = buildController();
    const body = { type: 'CALL', occurredAt: '2026-08-18T00:00:00.000Z' } as never;

    await controller.create(actor, 'person-1', body);

    expect(memberInteractionService.create).toHaveBeenCalledWith(actor, 'person-1', body);
  });

  it('listByPerson() delegates to MemberInteractionService.listByPerson', async () => {
    const { controller, memberInteractionService } = buildController();

    await controller.listByPerson('person-1');

    expect(memberInteractionService.listByPerson).toHaveBeenCalledWith('person-1');
  });
});
