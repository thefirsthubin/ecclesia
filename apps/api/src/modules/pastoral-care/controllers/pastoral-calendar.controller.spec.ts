import type { ActorContext } from '@ecclesia/rbac';

import { PastoralCalendarController } from './pastoral-calendar.controller';

describe('[Milestone B] PastoralCalendarController', () => {
  const actor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

  it('getCalendar() delegates to PastoralCalendarService.getCalendar with the current actor and parsed from/to Dates', async () => {
    const pastoralCalendarService = { getCalendar: jest.fn() };
    const controller = new PastoralCalendarController(pastoralCalendarService as never);

    await controller.getCalendar(actor, { from: '2026-08-01T00:00:00.000Z', to: '2026-08-31T00:00:00.000Z' });

    expect(pastoralCalendarService.getCalendar).toHaveBeenCalledWith(
      actor,
      new Date('2026-08-01T00:00:00.000Z'),
      new Date('2026-08-31T00:00:00.000Z'),
    );
  });
});
