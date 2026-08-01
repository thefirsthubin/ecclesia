import { ConflictException, NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { GatheringService } from './gathering.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function buildGathering(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'g-1',
    branchId: 'branch-1',
    ownerGroupId: null,
    seriesId: null,
    type: 'SUNDAY_SERVICE',
    scheduledStart: NOW,
    scheduledEnd: null,
    venue: null,
    status: 'SCHEDULED',
    config: null,
    createdByPersonId: 'ap-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('GatheringService', () => {
  const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' };

  function buildService() {
    const gatheringRepository = { create: jest.fn(), findById: jest.fn(), update: jest.fn() };
    const service = new GatheringService(gatheringRepository as never);
    return { service, gatheringRepository };
  }

  describe('create', () => {
    it('creates the Gathering scoped to the actor\'s own Branch', async () => {
      const { service, gatheringRepository } = buildService();
      gatheringRepository.create.mockResolvedValue(buildGathering());

      await service.create(actor, { type: 'SUNDAY_SERVICE', scheduledStart: NOW.toISOString() } as never);

      expect(gatheringRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'branch-1', type: 'SUNDAY_SERVICE', createdByPersonId: 'ap-1' }),
      );
    });
  });

  describe('getById', () => {
    it('throws NotFoundException when the Gathering does not exist', async () => {
      const { service, gatheringRepository } = buildService();
      gatheringRepository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the Gathering does not exist', async () => {
      const { service, gatheringRepository } = buildService();
      gatheringRepository.findById.mockResolvedValue(null);

      await expect(service.update('missing', {} as never)).rejects.toThrow(NotFoundException);
    });

    it('allows SCHEDULED -> CANCELLED, a modeled forward-only transition', async () => {
      const { service, gatheringRepository } = buildService();
      gatheringRepository.findById.mockResolvedValue(buildGathering({ status: 'SCHEDULED' }));
      gatheringRepository.update.mockResolvedValue(buildGathering({ status: 'CANCELLED' }));

      const result = await service.update('g-1', { status: 'CANCELLED' } as never);

      expect(gatheringRepository.update).toHaveBeenCalledWith('g-1', expect.objectContaining({ status: 'CANCELLED' }));
      expect(result.status).toBe('CANCELLED');
    });

    it('rejects a transition out of a terminal status (CANCELLED -> COMPLETED)', async () => {
      const { service, gatheringRepository } = buildService();
      gatheringRepository.findById.mockResolvedValue(buildGathering({ status: 'CANCELLED' }));

      await expect(service.update('g-1', { status: 'COMPLETED' } as never)).rejects.toThrow(ConflictException);
      expect(gatheringRepository.update).not.toHaveBeenCalled();
    });

    it('never alters the seriesId - a single instance update stays scoped to its own row', async () => {
      const { service, gatheringRepository } = buildService();
      gatheringRepository.findById.mockResolvedValue(buildGathering({ seriesId: 'series-1', status: 'SCHEDULED' }));
      gatheringRepository.update.mockResolvedValue(buildGathering({ seriesId: 'series-1', status: 'CANCELLED' }));

      const result = await service.update('g-1', { status: 'CANCELLED' } as never);

      expect(result.seriesId).toBe('series-1');
    });
  });
});
