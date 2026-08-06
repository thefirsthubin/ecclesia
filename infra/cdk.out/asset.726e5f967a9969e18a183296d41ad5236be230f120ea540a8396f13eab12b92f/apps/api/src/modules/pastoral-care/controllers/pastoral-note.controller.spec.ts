import type { ActorContext } from '@ecclesia/rbac';

import { PastoralNoteController } from './pastoral-note.controller';

describe('PastoralNoteController', () => {
  const actor: ActorContext = { personId: 'shepherd-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };

  function buildController() {
    const pastoralNoteService = { create: jest.fn(), listByPerson: jest.fn() };
    const controller = new PastoralNoteController(pastoralNoteService as never);
    return { controller, pastoralNoteService };
  }

  it('create() delegates to PastoralNoteService.create with the current actor', async () => {
    const { controller, pastoralNoteService } = buildController();
    const body = { content: 'Reached out today.' };

    await controller.create(actor, 'person-1', body);

    expect(pastoralNoteService.create).toHaveBeenCalledWith(actor, 'person-1', body);
  });

  it('listByPerson() delegates to PastoralNoteService.listByPerson', async () => {
    const { controller, pastoralNoteService } = buildController();

    await controller.listByPerson('person-1');

    expect(pastoralNoteService.listByPerson).toHaveBeenCalledWith('person-1');
  });
});
