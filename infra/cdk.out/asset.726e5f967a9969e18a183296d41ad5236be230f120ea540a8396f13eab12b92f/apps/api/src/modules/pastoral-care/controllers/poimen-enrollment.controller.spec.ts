import type { ActorContext } from '@ecclesia/rbac';

import { PoimenEnrollmentController } from './poimen-enrollment.controller';

describe('PoimenEnrollmentController', () => {
  const actor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

  function buildController() {
    const poimenEnrollmentService = { enroll: jest.fn(), getByPersonId: jest.fn(), updateStatus: jest.fn() };
    const controller = new PoimenEnrollmentController(poimenEnrollmentService as never);
    return { controller, poimenEnrollmentService };
  }

  it('enroll() delegates to PoimenEnrollmentService.enroll with the current actor', async () => {
    const { controller, poimenEnrollmentService } = buildController();

    await controller.enroll(actor, 'person-1');

    expect(poimenEnrollmentService.enroll).toHaveBeenCalledWith(actor, 'person-1');
  });

  it('getByPersonId() delegates to PoimenEnrollmentService.getByPersonId', async () => {
    const { controller, poimenEnrollmentService } = buildController();

    await controller.getByPersonId('person-1');

    expect(poimenEnrollmentService.getByPersonId).toHaveBeenCalledWith('person-1');
  });

  it('updateStatus() delegates to PoimenEnrollmentService.updateStatus', async () => {
    const { controller, poimenEnrollmentService } = buildController();
    const body = { status: 'IN_PROGRESS' } as never;

    await controller.updateStatus('person-1', body);

    expect(poimenEnrollmentService.updateStatus).toHaveBeenCalledWith('person-1', 'IN_PROGRESS');
  });
});
