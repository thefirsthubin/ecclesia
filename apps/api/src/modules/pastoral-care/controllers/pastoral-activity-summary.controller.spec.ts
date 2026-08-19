import type { ActorContext } from '@ecclesia/rbac';

import { PastoralActivitySummaryController } from './pastoral-activity-summary.controller';

describe('[Milestone C.1.3] PastoralActivitySummaryController', () => {
  const actor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

  it('getSummary() delegates to PastoralActivitySummaryService.getSummary with the current actor and parsed from/to Dates', async () => {
    const pastoralActivitySummaryService = { getSummary: jest.fn() };
    const controller = new PastoralActivitySummaryController(pastoralActivitySummaryService as never);

    await controller.getSummary(actor, { from: '2026-08-01T00:00:00.000Z', to: '2026-08-31T00:00:00.000Z' });

    expect(pastoralActivitySummaryService.getSummary).toHaveBeenCalledWith(
      actor,
      new Date('2026-08-01T00:00:00.000Z'),
      new Date('2026-08-31T00:00:00.000Z'),
    );
  });
});
