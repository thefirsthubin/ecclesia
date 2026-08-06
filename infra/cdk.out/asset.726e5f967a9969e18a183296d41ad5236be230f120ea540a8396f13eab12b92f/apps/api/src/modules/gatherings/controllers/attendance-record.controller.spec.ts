import type { ActorContext } from '@ecclesia/rbac';

import { AttendanceRecordController } from './attendance-record.controller';

describe('AttendanceRecordController', () => {
  const actor: ActorContext = { personId: 'usher-1', role: 'BACENTA_LEADER', branchId: 'branch-1' };

  function buildController() {
    const attendanceRecordService = { record: jest.fn(), listByGathering: jest.fn(), checkCompleteness: jest.fn() };
    const controller = new AttendanceRecordController(attendanceRecordService as never);
    return { controller, attendanceRecordService };
  }

  it('record() delegates to AttendanceRecordService.record with the current actor and :gatheringId', async () => {
    const { controller, attendanceRecordService } = buildController();
    const body = { personId: 'person-1', status: 'PRESENT' } as never;

    await controller.record(actor, 'g-1', body);

    expect(attendanceRecordService.record).toHaveBeenCalledWith(actor, 'g-1', body);
  });

  it('listByGathering() delegates to AttendanceRecordService.listByGathering', async () => {
    const { controller, attendanceRecordService } = buildController();

    await controller.listByGathering('g-1');

    expect(attendanceRecordService.listByGathering).toHaveBeenCalledWith('g-1');
  });

  it('checkCompleteness() delegates to AttendanceRecordService.checkCompleteness', async () => {
    const { controller, attendanceRecordService } = buildController();

    await controller.checkCompleteness('g-1');

    expect(attendanceRecordService.checkCompleteness).toHaveBeenCalledWith('g-1');
  });
});
