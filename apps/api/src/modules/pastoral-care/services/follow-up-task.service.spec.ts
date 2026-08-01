import { ConflictException, NotFoundException } from '@nestjs/common';
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
    dueAt: NOW,
    escalatedAt: null,
    escalatedToPersonId: null,
    createdByPersonId: 'ap-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('FollowUpTaskService', () => {
  const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' };

  function buildService() {
    const followUpTaskRepository = { create: jest.fn(), findById: jest.fn(), update: jest.fn() };
    const personScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', ownerId: 'person-1' }),
    };
    const service = new FollowUpTaskService(followUpTaskRepository as never, personScopeService as never);
    return { service, followUpTaskRepository, personScopeService };
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
  });

  describe('getById', () => {
    it('throws NotFoundException when the task does not exist', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('complete', () => {
    it('moves an OPEN task to COMPLETED', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask({ status: 'OPEN' }));
      followUpTaskRepository.update.mockResolvedValue(buildTask({ status: 'COMPLETED' }));

      const result = await service.complete('ft-1');

      expect(followUpTaskRepository.update).toHaveBeenCalledWith('ft-1', { status: 'COMPLETED' });
      expect(result.status).toBe('COMPLETED');
    });

    it('rejects completing an already-COMPLETED task', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask({ status: 'COMPLETED' }));

      await expect(service.complete('ft-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('escalate (BR-PC-04)', () => {
    it('moves an OPEN task to ESCALATED with the caller-supplied target', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.findById.mockResolvedValue(buildTask({ status: 'OPEN' }));
      followUpTaskRepository.update.mockResolvedValue(buildTask({ status: 'ESCALATED', escalatedToPersonId: 'ap-2' }));

      const result = await service.escalate('ft-1', 'ap-2');

      expect(followUpTaskRepository.update).toHaveBeenCalledWith(
        'ft-1',
        expect.objectContaining({ status: 'ESCALATED', escalatedToPersonId: 'ap-2' }),
      );
      expect(result.escalatedToPersonId).toBe('ap-2');
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
