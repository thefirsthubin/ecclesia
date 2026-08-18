import type { ActorContext } from '@ecclesia/rbac';

import { MemberInteractionService } from './member-interaction.service';

const NOW = new Date('2026-08-18T00:00:00.000Z');

function buildInteraction(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'interaction-1',
    branchId: 'branch-1',
    personId: 'person-1',
    pastorPersonId: 'pastor-1',
    type: 'CALL',
    occurredAt: NOW,
    scheduledAt: null,
    briefNote: null,
    createdAt: NOW,
    ...overrides,
  };
}

describe('[Milestone B] MemberInteractionService', () => {
  const actor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

  function buildService() {
    const memberInteractionRepository = {
      create: jest.fn(),
      listByPerson: jest.fn(),
      listScheduledInRange: jest.fn(),
    };
    const personScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', ownerId: 'person-1' }),
    };
    const service = new MemberInteractionService(memberInteractionRepository as never, personScopeService as never);
    return { service, memberInteractionRepository, personScopeService };
  }

  describe('create', () => {
    it('sets pastorPersonId to the acting Person - never client-supplied', async () => {
      const { service, memberInteractionRepository } = buildService();
      memberInteractionRepository.create.mockResolvedValue(buildInteraction());

      await service.create(actor, 'person-1', { type: 'CALL', occurredAt: NOW.toISOString() } as never);

      expect(memberInteractionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ pastorPersonId: 'pastor-1', personId: 'person-1', type: 'CALL' }),
      );
    });

    it('passes scheduledAt through when given', async () => {
      const { service, memberInteractionRepository } = buildService();
      memberInteractionRepository.create.mockResolvedValue(buildInteraction());
      const scheduledAt = '2026-09-01T10:00:00.000Z';

      await service.create(actor, 'person-1', { type: 'MEETING', occurredAt: NOW.toISOString(), scheduledAt } as never);

      expect(memberInteractionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ scheduledAt: new Date(scheduledAt) }),
      );
    });
  });

  describe('listByPerson', () => {
    it('maps repository rows to response DTOs', async () => {
      const { service, memberInteractionRepository } = buildService();
      memberInteractionRepository.listByPerson.mockResolvedValue([buildInteraction()]);

      const result = await service.listByPerson('person-1');

      expect(memberInteractionRepository.listByPerson).toHaveBeenCalledWith('person-1');
      expect(result).toHaveLength(1);
    });
  });
});
