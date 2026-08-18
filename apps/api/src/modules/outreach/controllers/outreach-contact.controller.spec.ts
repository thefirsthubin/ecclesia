import type { ActorContext } from '@ecclesia/rbac';

import { OutreachContactController } from './outreach-contact.controller';

describe('[Milestone B] OutreachContactController', () => {
  const actor: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };

  function buildController() {
    const outreachContactService = { addContact: jest.fn(), listForOutreach: jest.fn(), updateOutcome: jest.fn(), promote: jest.fn() };
    const controller = new OutreachContactController(outreachContactService as never);
    return { controller, outreachContactService };
  }

  it('addContact() delegates to OutreachContactService.addContact with the outreachId param', async () => {
    const { controller, outreachContactService } = buildController();
    const body = { firstName: 'Kofi' } as never;

    await controller.addContact('outreach-1', body);

    expect(outreachContactService.addContact).toHaveBeenCalledWith('outreach-1', body);
  });

  it('listForOutreach() delegates to OutreachContactService.listForOutreach with the outreachId param', async () => {
    const { controller, outreachContactService } = buildController();

    await controller.listForOutreach('outreach-1');

    expect(outreachContactService.listForOutreach).toHaveBeenCalledWith('outreach-1');
  });

  it('updateOutcome() delegates to OutreachContactService.updateOutcome', async () => {
    const { controller, outreachContactService } = buildController();
    const body = { outcome: 'ATTENDED' } as never;

    await controller.updateOutcome('contact-1', body);

    expect(outreachContactService.updateOutcome).toHaveBeenCalledWith('contact-1', body);
  });

  it('promote() delegates to OutreachContactService.promote with the current actor', async () => {
    const { controller, outreachContactService } = buildController();
    const body = { overrideDuplicateCheck: false } as never;

    await controller.promote(actor, 'contact-1', body);

    expect(outreachContactService.promote).toHaveBeenCalledWith(actor, 'contact-1', body);
  });
});
