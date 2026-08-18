import { NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { CounsellingSessionService } from './counselling-session.service';

const NOW = new Date('2026-08-20T10:00:00.000Z');

function buildSession(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'session-1',
    branchId: 'branch-1',
    personId: 'person-1',
    counsellorPersonId: 'pastor-1',
    scheduledAt: NOW,
    status: 'SCHEDULED',
    briefNote: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('[Milestone B] CounsellingSessionService', () => {
  const actor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

  function buildService() {
    const counsellingSessionRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      listByPerson: jest.fn(),
      updateStatus: jest.fn(),
    };
    const personScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', ownerId: 'person-1' }),
    };
    const service = new CounsellingSessionService(counsellingSessionRepository as never, personScopeService as never);
    return { service, counsellingSessionRepository, personScopeService };
  }

  describe('create', () => {
    it('sets counsellorPersonId to the acting Person - never client-supplied', async () => {
      const { service, counsellingSessionRepository } = buildService();
      counsellingSessionRepository.create.mockResolvedValue(buildSession());

      await service.create(actor, 'person-1', { scheduledAt: NOW.toISOString() } as never);

      expect(counsellingSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ counsellorPersonId: 'pastor-1', personId: 'person-1' }),
      );
    });

    it('resolves branchId from the subject Person via PersonScopeService', async () => {
      const { service, counsellingSessionRepository, personScopeService } = buildService();
      counsellingSessionRepository.create.mockResolvedValue(buildSession());

      await service.create(actor, 'person-1', { scheduledAt: NOW.toISOString() } as never);

      expect(personScopeService.loadResourceContext).toHaveBeenCalledWith('person-1', actor);
    });
  });

  describe('listByPerson - organizational scope (NOT author-filtered, unlike PrayerNote)', () => {
    it('lists every session for the Person regardless of which pastor counselled them', async () => {
      const { service, counsellingSessionRepository } = buildService();
      counsellingSessionRepository.listByPerson.mockResolvedValue([
        buildSession({ counsellorPersonId: 'pastor-1' }),
        buildSession({ id: 'session-2', counsellorPersonId: 'pastor-2' }),
      ]);

      const result = await service.listByPerson('person-1');

      expect(counsellingSessionRepository.listByPerson).toHaveBeenCalledWith('person-1');
      expect(result).toHaveLength(2);
    });
  });

  describe('updateStatus', () => {
    it('throws NotFoundException when the session does not exist', async () => {
      const { service, counsellingSessionRepository } = buildService();
      counsellingSessionRepository.findById.mockResolvedValue(null);

      await expect(service.updateStatus('missing', { status: 'COMPLETED' } as never)).rejects.toThrow(NotFoundException);
    });

    it('delegates to the repository', async () => {
      const { service, counsellingSessionRepository } = buildService();
      counsellingSessionRepository.findById.mockResolvedValue(buildSession());
      counsellingSessionRepository.updateStatus.mockResolvedValue(buildSession({ status: 'COMPLETED' }));

      const result = await service.updateStatus('session-1', { status: 'COMPLETED' } as never);

      expect(counsellingSessionRepository.updateStatus).toHaveBeenCalledWith('session-1', 'COMPLETED');
      expect(result.status).toBe('COMPLETED');
    });
  });
});
