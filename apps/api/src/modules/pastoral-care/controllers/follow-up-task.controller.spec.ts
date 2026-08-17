import type { ActorContext } from '@ecclesia/rbac';

import { FollowUpTaskController } from './follow-up-task.controller';

describe('FollowUpTaskController', () => {
  const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' };

  function buildController() {
    const followUpTaskService = {
      create: jest.fn(),
      getById: jest.fn(),
      complete: jest.fn(),
      escalate: jest.fn(),
      listForGroup: jest.fn(),
      list: jest.fn(),
      listByPerson: jest.fn(),
    };
    const controller = new FollowUpTaskController(followUpTaskService as never);
    return { controller, followUpTaskService };
  }

  it('create() delegates to FollowUpTaskService.create with the current actor', async () => {
    const { controller, followUpTaskService } = buildController();
    const body = { assignedToPersonId: 'shepherd-1', trigger: 'MANUAL' } as never;

    await controller.create(actor, 'person-1', body);

    expect(followUpTaskService.create).toHaveBeenCalledWith(actor, 'person-1', body);
  });

  it('getById() delegates to FollowUpTaskService.getById', async () => {
    const { controller, followUpTaskService } = buildController();

    await controller.getById('ft-1');

    expect(followUpTaskService.getById).toHaveBeenCalledWith('ft-1');
  });

  it('complete() delegates to FollowUpTaskService.complete', async () => {
    const { controller, followUpTaskService } = buildController();

    await controller.complete('ft-1');

    expect(followUpTaskService.complete).toHaveBeenCalledWith('ft-1');
  });

  it('escalate() delegates to FollowUpTaskService.escalate', async () => {
    const { controller, followUpTaskService } = buildController();
    const body = { escalatedToPersonId: 'ap-2' } as never;

    await controller.escalate('ft-1', body);

    expect(followUpTaskService.escalate).toHaveBeenCalledWith('ft-1', 'ap-2');
  });

  it('listForGroup() delegates to FollowUpTaskService.listForGroup with the parsed status filter', async () => {
    const { controller, followUpTaskService } = buildController();

    await controller.listForGroup('bacenta-1', { status: ['OPEN', 'ESCALATED'] } as never);

    expect(followUpTaskService.listForGroup).toHaveBeenCalledWith('bacenta-1', ['OPEN', 'ESCALATED']);
  });

  it('list() delegates to FollowUpTaskService.list with the current actor and parsed query (Pastoral Care Web Admin sprint)', async () => {
    const { controller, followUpTaskService } = buildController();
    const query = { groupId: 'bacenta-1', status: ['OPEN'] } as never;

    await controller.list(actor, query);

    expect(followUpTaskService.list).toHaveBeenCalledWith(actor, query);
  });

  it('listByPerson() delegates to FollowUpTaskService.listByPerson (Branch Pastor portal, "People -> Pastoral Care" direction)', async () => {
    const { controller, followUpTaskService } = buildController();

    await controller.listByPerson('person-1');

    expect(followUpTaskService.listByPerson).toHaveBeenCalledWith('person-1');
  });
});
