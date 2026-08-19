import type { ActorContext } from '@ecclesia/rbac';

import { AttendanceTrendController } from './attendance-trend.controller';

describe('[Milestone C] AttendanceTrendController', () => {
  const actor: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };

  it('getAttendanceTrend() delegates to AttendanceTrendService.getTrend with the actor and parsed query', async () => {
    const attendanceTrendService = { getTrend: jest.fn() };
    const controller = new AttendanceTrendController(attendanceTrendService as never);
    const query = { granularity: 'week', count: 8, council: false } as never;

    await controller.getAttendanceTrend(actor, query);

    expect(attendanceTrendService.getTrend).toHaveBeenCalledWith(actor, query);
  });
});
