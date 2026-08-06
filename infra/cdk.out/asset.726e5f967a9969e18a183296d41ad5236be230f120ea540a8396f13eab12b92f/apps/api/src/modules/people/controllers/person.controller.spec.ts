import type { ActorContext } from '@ecclesia/rbac';

import { PersonController } from './person.controller';

describe('PersonController', () => {
  const actor: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };

  function buildController() {
    const personService = {
      create: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
      transitionLifecycleStage: jest.fn(),
      list: jest.fn(),
    };
    const controller = new PersonController(personService as never);
    return { controller, personService };
  }

  it('create() delegates to PersonService.create with the current actor', async () => {
    const { controller, personService } = buildController();
    const body = { firstName: 'Ama', lastName: 'Owusu', overrideDuplicateCheck: false } as never;

    await controller.create(actor, body);

    expect(personService.create).toHaveBeenCalledWith(actor, body);
  });

  it('getById() delegates to PersonService.getById', async () => {
    const { controller, personService } = buildController();

    await controller.getById('person-1');

    expect(personService.getById).toHaveBeenCalledWith('person-1');
  });

  it('update() delegates to PersonService.update', async () => {
    const { controller, personService } = buildController();
    const body = { phone: '+233555000111' } as never;

    await controller.update('person-1', body);

    expect(personService.update).toHaveBeenCalledWith('person-1', body);
  });

  it('transitionLifecycleStage() delegates to PersonService.transitionLifecycleStage', async () => {
    const { controller, personService } = buildController();
    const body = { toStage: 'MEMBER' } as never;

    await controller.transitionLifecycleStage('person-1', body);

    expect(personService.transitionLifecycleStage).toHaveBeenCalledWith('person-1', body);
  });

  it('list() delegates to PersonService.list with the current actor and query', async () => {
    const { controller, personService } = buildController();
    const query = { search: 'Owusu' } as never;

    await controller.list(actor, query);

    expect(personService.list).toHaveBeenCalledWith(actor, query);
  });
});
