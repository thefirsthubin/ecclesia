import type { ActorContext } from '@ecclesia/rbac';

import { PrayerNoteController, PrayerNoteStatusController } from './prayer-note.controller';

describe('[Milestone B] PrayerNoteController', () => {
  const actor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

  function buildController() {
    const prayerNoteService = { create: jest.fn(), listByPerson: jest.fn(), updateStatus: jest.fn() };
    const controller = new PrayerNoteController(prayerNoteService as never);
    return { controller, prayerNoteService };
  }

  it('create() delegates to PrayerNoteService.create with the current actor', async () => {
    const { controller, prayerNoteService } = buildController();
    const body = { content: 'Praying for healing' } as never;

    await controller.create(actor, 'person-1', body);

    expect(prayerNoteService.create).toHaveBeenCalledWith(actor, 'person-1', body);
  });

  it('listByPerson() delegates to PrayerNoteService.listByPerson with the current actor (author-only filtering happens inside the service)', async () => {
    const { controller, prayerNoteService } = buildController();

    await controller.listByPerson(actor, 'person-1');

    expect(prayerNoteService.listByPerson).toHaveBeenCalledWith(actor, 'person-1');
  });
});

describe('[Milestone B] PrayerNoteStatusController', () => {
  const actor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

  it('updateStatus() delegates to PrayerNoteService.updateStatus with the current actor', async () => {
    const prayerNoteService = { create: jest.fn(), listByPerson: jest.fn(), updateStatus: jest.fn() };
    const controller = new PrayerNoteStatusController(prayerNoteService as never);
    const body = { status: 'RESOLVED' } as never;

    await controller.updateStatus(actor, 'note-1', body);

    expect(prayerNoteService.updateStatus).toHaveBeenCalledWith(actor, 'note-1', body);
  });
});
