import type { ActorContext } from '@ecclesia/rbac';

import { RoleAssignmentController } from './role-assignment.controller';

describe('RoleAssignmentController', () => {
  it('grant() delegates to RoleAssignmentService.grant with the current actor and personId param', async () => {
    const roleAssignmentService = { grant: jest.fn(), listForPerson: jest.fn() };
    const controller = new RoleAssignmentController(roleAssignmentService as never);
    const actor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
    const body = { role: 'WORKER', scopeGroupIds: [] } as never;

    await controller.grant(actor, 'person-1', body);

    expect(roleAssignmentService.grant).toHaveBeenCalledWith(actor, 'person-1', body);
  });

  it('listForPerson() delegates to RoleAssignmentService.listForPerson with the personId param', async () => {
    const roleAssignmentService = { grant: jest.fn(), listForPerson: jest.fn() };
    const controller = new RoleAssignmentController(roleAssignmentService as never);

    await controller.listForPerson('person-1');

    expect(roleAssignmentService.listForPerson).toHaveBeenCalledWith('person-1');
  });
});
