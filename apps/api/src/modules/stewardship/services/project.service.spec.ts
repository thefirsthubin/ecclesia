import { NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { ProjectService } from './project.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function buildProject(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'proj-1',
    branchId: 'branch-1',
    name: 'Building Fund',
    description: null,
    targetAmountMinor: 100000000n,
    currency: 'GHS',
    status: 'ACTIVE',
    createdByPersonId: 'pastor-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('ProjectService', () => {
  const actor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

  function buildService() {
    const projectRepository = { create: jest.fn(), findById: jest.fn() };
    const pledgeRepository = { sumByProject: jest.fn() };
    const service = new ProjectService(projectRepository as never, pledgeRepository as never);
    return { service, projectRepository, pledgeRepository };
  }

  describe('create', () => {
    it('creates the Project scoped to the actor\'s own Branch, converting targetAmountMinor to BigInt', async () => {
      const { service, projectRepository } = buildService();
      projectRepository.create.mockResolvedValue(buildProject());

      await service.create(actor, { name: 'Building Fund', targetAmountMinor: '100000000' } as never);

      expect(projectRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'branch-1', name: 'Building Fund', targetAmountMinor: 100000000n, createdByPersonId: 'pastor-1' }),
      );
    });

    it('returns targetAmountMinor as a string on the response DTO', async () => {
      const { service, projectRepository } = buildService();
      projectRepository.create.mockResolvedValue(buildProject());

      const result = await service.create(actor, { name: 'Building Fund', targetAmountMinor: '100000000' } as never);

      expect(result.targetAmountMinor).toBe('100000000');
    });
  });

  describe('getById', () => {
    it('throws NotFoundException when the Project does not exist', async () => {
      const { service, projectRepository } = buildService();
      projectRepository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
