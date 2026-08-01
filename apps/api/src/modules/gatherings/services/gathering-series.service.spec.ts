import { NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { GatheringSeriesService } from './gathering-series.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function buildSeries(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'series-1',
    branchId: 'branch-1',
    groupId: null,
    type: 'BACENTA_MEETING',
    recurrenceRule: null,
    startDate: NOW,
    endDate: null,
    createdByPersonId: 'ap-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('GatheringSeriesService', () => {
  const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' };

  function buildService() {
    const gatheringSeriesRepository = { create: jest.fn(), findById: jest.fn() };
    const service = new GatheringSeriesService(gatheringSeriesRepository as never);
    return { service, gatheringSeriesRepository };
  }

  describe('create', () => {
    it('creates the series scoped to the actor\'s own Branch', async () => {
      const { service, gatheringSeriesRepository } = buildService();
      gatheringSeriesRepository.create.mockResolvedValue(buildSeries());

      await service.create(actor, { type: 'BACENTA_MEETING', startDate: '2026-08-01' } as never);

      expect(gatheringSeriesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'branch-1', type: 'BACENTA_MEETING', createdByPersonId: 'ap-1' }),
      );
    });

    it('does not auto-generate any Gathering instances from the series', async () => {
      const { service, gatheringSeriesRepository } = buildService();
      gatheringSeriesRepository.create.mockResolvedValue(buildSeries());

      const result = await service.create(actor, { type: 'BACENTA_MEETING', startDate: '2026-08-01' } as never);

      expect(result.id).toBe('series-1');
      expect(gatheringSeriesRepository.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('getById', () => {
    it('throws NotFoundException when the series does not exist', async () => {
      const { service, gatheringSeriesRepository } = buildService();
      gatheringSeriesRepository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns the mapped response DTO when found', async () => {
      const { service, gatheringSeriesRepository } = buildService();
      gatheringSeriesRepository.findById.mockResolvedValue(buildSeries());

      const result = await service.getById('series-1');

      expect(result).toMatchObject({ id: 'series-1', branchId: 'branch-1', type: 'BACENTA_MEETING' });
    });
  });
});
