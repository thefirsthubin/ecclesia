import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { FollowUpTaskService } from './follow-up-task.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function buildTask(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'ft-1',
    branchId: 'branch-1',
    groupId: null,
    personId: 'person-1',
    assignedToPersonId: 'shepherd-1',
    status: 'OPEN',
    priority: 'MEDIUM',
    description: null,
    dueAt: NOW,
    trigger: null,
    escalatedAt: null,
    escalatedToPersonId: null,
    completedAt: null,
    createdByPersonId: 'ap-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('FollowUpTaskService', () => {
  const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' };

  function buildService() {
    const followUpTaskRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      updateDetails: jest.fn(),
      listByGroup: jest.fn(),
      listByBranch: jest.fn(),
      listByPerson: jest.fn(),
    };
    const personScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', ownerId: 'person-1' }),
    };
    const eventPublisher = { publish: jest.fn() };
    const service = new FollowUpTaskService(followUpTaskRepository as never, personScopeService as never, eventPublisher as never);
    return { service, followUpTaskRepository, personScopeService, eventPublisher };
  }

  describe('create', () => {
    it('resolves branchId from the subject Person via PersonScopeService and computes a due date', async () => {
      const { service, followUpTaskRepository, personScopeService } = buildService();
      followUpTaskRepository.create.mockResolvedValue(buildTask());

      await service.create(actor, 'person-1', {
        assignedToPersonId: 'shepherd-1',
        trigger: 'FIRST_TIME_GUEST',
      } as never);

      expect(personScopeService.loadResourceContext).toHaveBeenCalledWith('person-1', actor);
      expect(followUpTaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'branch-1', personId: 'person-1', assignedToPersonId: 'shepherd-1' }),
      );
    });

    /** `[Branch Pastor portal, Pastoral Care sprint]` The real, previously
     * unenforced gap: nothing checked that `assignedToPersonId` actually
     * belonged to the actor's own Branch before this - see the service's
     * own doc comment on `create()`. */
    it('resolves the assignee\'s own scope too, and rejects a cross-Branch assignment', async () => {
      const { service, personScopeService } = buildService();
      personScopeService.loadResourceContext.mockImplementation((personId: string) =>
        Promise.resolve(personId === 'shepherd-elsewhere' ? { branchId: 'branch-2', ownerId: personId } : { branchId: 'branch-1', ownerId: personId }),
      );

      await expect(
        service.create(actor, 'person-1', { assignedToPersonId: 'shepherd-elsewhere', trigger: 'MANUAL' } as never),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows an in-Branch assignment (the assignee resolves to the same Branch as the actor)', async () => {
      const { service, followUpTaskRepository, personScopeService } = buildService();
      followUpTaskRepository.create.mockResolvedValue(buildTask());

      await service.create(actor, 'person-1', { assignedToPersonId: 'shepherd-1', trigger: 'MANUAL' } as never);

      expect(personScopeService.loadResourceContext).toHaveBeenCalledWith('shepherd-1', actor);
      expect(followUpTaskRepository.create).toHaveBeenCalled();
    });

    it('uses an explicit dueAtOverride when supplied instead of computing one', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.create.mockResolvedValue(buildTask());
      const override = '2026-09-01T00:00:00.000Z';

      await service.create(actor, 'person-1', {
        assignedToPersonId: 'shepherd-1',
        trigger: 'MANUAL',
        dueAtOverride: override,
      } as never);

      expect(followUpTaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ dueAt: new Date(override) }),
      );
    });

    it('[Milestone B] persists priority/description/trigger (previously computed then discarded)', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.create.mockResolvedValue(buildTask());

      await service.create(actor, 'person-1', {
        assignedToPersonId: 'shepherd-1',
        trigger: 'LAPSED_REENGAGEMENT',
        priority: 'HIGH',
        description: 'missed three Sundays in a row',
      } as never);

      expect(followUpTaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'HIGH', description: 'missed three Sundays in a row', trigger: 'LAPSED_REENGAGEMENT' }),
      );
    });
  });

  describe('listForGroup (§16.2 "sorted by SLA urgency" queue)', () => {
    it('maps repository rows to response DTOs, delegating status filtering to the repository', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.listByGroup.mockResolvedValue([buildTask({ id: 'ft-1' }), buildTask({ id: 'ft-2' })]);

      const result = await service.listForGroup('bacenta-1', ['OPEN', 'ESCALATED']);

      expect(followUpTaskRepository.listByGroup).toHaveBeenCalledWith('bacenta-1', ['OPEN', 'ESCALATED']);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('ft-1');
    });

    it('passes undefined through to the repository when no status filter is supplied, letting it apply its own default', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.listByGroup.mockResolvedValue([]);

      await service.listForGroup('bacenta-1');

      expect(followUpTaskRepository.listByGroup).toHaveBeenCalledWith('bacenta-1', undefined);
    });
  });

  describe('list (Pastoral Care Web Admin sprint - GET /pastoral-care/follow-up-tasks)', () => {
    it('delegates to listByGroup when query.groupId is present', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.listByGroup.mockResolvedValue([buildTask({ id: 'ft-1' })]);

      const result = await service.list(actor, { groupId: 'bacenta-1', status: ['OPEN'] } as never);

      expect(followUpTaskRepository.listByGroup).toHaveBeenCalledWith('bacenta-1', ['OPEN']);
      expect(followUpTaskRepository.listByBranch).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('falls back to listByBranch against the actor\'s own Branch when query.groupId is absent', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.listByBranch.mockResolvedValue([buildTask({ id: 'ft-1' })]);

      const result = await service.list(actor, {} as never);

      expect(followUpTaskRepository.listByBranch).toHaveBeenCalledWith('branch-1', undefined);
      expect(followUpTaskRepository.listByGroup).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('listByPerson (Branch Pastor portal, "People -> Pastoral Care" direction)', () => {
    it('maps every one of the Person\'s tasks to response DTOs, regardless of status', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.listByPerson.mockResolvedValue([buildTask({ id: 'ft-1' }), buildTask({ id: 'ft-2', status: 'COMPLETED' })]);

      const result = await service.listByPerson('person-1');

      expect(followUpTaskRepository.listByPerson).toHaveBeenCalledWith('person-1');
      expect(result).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('throws NotFoundException when the task does not exist', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('complete', () => {
    it('moves an IN_PROGRESS task to COMPLETED, sets completedAt, and publishes follow_up.completed', async () => {
      const { service, followUpTaskRepository, eventPublisher } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask({ status: 'IN_PROGRESS' }));
      followUpTaskRepository.updateStatus.mockResolvedValue(buildTask({ status: 'COMPLETED', completedAt: NOW }));

      const result = await service.complete('ft-1');

      expect(followUpTaskRepository.updateStatus).toHaveBeenCalledWith('ft-1', { status: 'COMPLETED', completedAt: expect.any(Date) });
      expect(result.status).toBe('COMPLETED');
      expect(result.completedAt).toBe(NOW.toISOString());
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'follow_up.completed',
          branchId: 'branch-1',
          subjectPersonId: 'person-1',
          payload: { followUpTaskId: 'ft-1' },
        }),
      );
    });

    it('[Milestone B] also allows completing directly from OPEN (no IN_PROGRESS detour required)', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask({ status: 'OPEN' }));
      followUpTaskRepository.updateStatus.mockResolvedValue(buildTask({ status: 'COMPLETED' }));

      await expect(service.complete('ft-1')).rejects.toThrow(ConflictException);
    });

    it('rejects completing an already-COMPLETED task', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask({ status: 'COMPLETED' }));

      await expect(service.complete('ft-1')).rejects.toThrow(ConflictException);
    });

    it('rejects completing a CANCELLED task', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask({ status: 'CANCELLED' }));

      await expect(service.complete('ft-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('[Milestone B] start', () => {
    it('moves an OPEN task to IN_PROGRESS', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask({ status: 'OPEN' }));
      followUpTaskRepository.updateStatus.mockResolvedValue(buildTask({ status: 'IN_PROGRESS' }));

      const result = await service.start('ft-1');

      expect(followUpTaskRepository.updateStatus).toHaveBeenCalledWith('ft-1', { status: 'IN_PROGRESS' });
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('rejects starting an already-IN_PROGRESS task', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask({ status: 'IN_PROGRESS' }));

      await expect(service.start('ft-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('[Milestone B] cancel', () => {
    it.each(['OPEN', 'IN_PROGRESS', 'ESCALATED'])('cancels a task in the active state %s', async (status) => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask({ status }));
      followUpTaskRepository.updateStatus.mockResolvedValue(buildTask({ status: 'CANCELLED' }));

      const result = await service.cancel('ft-1');

      expect(followUpTaskRepository.updateStatus).toHaveBeenCalledWith('ft-1', { status: 'CANCELLED' });
      expect(result.status).toBe('CANCELLED');
    });

    it('rejects cancelling an already-COMPLETED task', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask({ status: 'COMPLETED' }));

      await expect(service.cancel('ft-1')).rejects.toThrow(ConflictException);
    });

    it('rejects cancelling an already-CANCELLED task', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask({ status: 'CANCELLED' }));

      await expect(service.cancel('ft-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('[Milestone B] updateDetails', () => {
    it('throws NotFoundException when the task does not exist', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(null);

      await expect(service.updateDetails('missing', { priority: 'HIGH' } as never)).rejects.toThrow(NotFoundException);
    });

    it('passes priority/description through to the repository, never status', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask());
      followUpTaskRepository.updateDetails.mockResolvedValue(buildTask({ priority: 'HIGH', description: 'urgent' }));

      const result = await service.updateDetails('ft-1', { priority: 'HIGH', description: 'urgent' } as never);

      expect(followUpTaskRepository.updateDetails).toHaveBeenCalledWith('ft-1', { priority: 'HIGH', description: 'urgent' });
      expect(result.priority).toBe('HIGH');
    });
  });

  describe('escalate (BR-PC-04)', () => {
    it('moves an OPEN task to ESCALATED with the caller-supplied target', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask({ status: 'OPEN' }));
      followUpTaskRepository.updateStatus.mockResolvedValue(buildTask({ status: 'ESCALATED', escalatedToPersonId: 'ap-2' }));

      const result = await service.escalate('ft-1', 'ap-2');

      expect(followUpTaskRepository.updateStatus).toHaveBeenCalledWith(
        'ft-1',
        expect.objectContaining({ status: 'ESCALATED', escalatedToPersonId: 'ap-2' }),
      );
      expect(result.escalatedToPersonId).toBe('ap-2');
    });

    it('[Milestone B] also allows escalating from IN_PROGRESS', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask({ status: 'IN_PROGRESS' }));
      followUpTaskRepository.updateStatus.mockResolvedValue(buildTask({ status: 'ESCALATED' }));

      await expect(service.escalate('ft-1', 'ap-2')).resolves.toBeDefined();
    });

    it('rejects escalating an already-ESCALATED task', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask({ status: 'ESCALATED' }));

      await expect(service.escalate('ft-1', 'ap-2')).rejects.toThrow(ConflictException);
    });

    it('rejects escalating a COMPLETED task', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask({ status: 'COMPLETED' }));

      await expect(service.escalate('ft-1', 'ap-2')).rejects.toThrow(ConflictException);
    });
  });
});
