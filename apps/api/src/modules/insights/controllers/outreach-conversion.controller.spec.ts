import type { ActorContext } from '@ecclesia/rbac';

import { OutreachConversionController } from './outreach-conversion.controller';

describe('[Milestone C.1.2] OutreachConversionController', () => {
  const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' };

  it('getConversion() delegates to OutreachConversionService.getConversion with the actor and parsed query', async () => {
    const outreachConversionService = { getConversion: jest.fn() };
    const controller = new OutreachConversionController(outreachConversionService as never);
    const query = { council: false } as never;

    await controller.getConversion(actor, query);

    expect(outreachConversionService.getConversion).toHaveBeenCalledWith(actor, query);
  });
});
