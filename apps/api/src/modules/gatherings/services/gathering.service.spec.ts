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
    preacherPersonId: null,
    message: null,
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
    const gatheringRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      listByGroupAndRange: jest.fn(),
      listByBranchAndRange: jest.fn(),
    };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const service = new GatheringService(gatheringRepository as never, prisma as never);
    return { service, gatheringRepository, prisma };
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

    it('[Milestone A] passes preacherPersonId/message through when given', async () => {
      const { service, gatheringRepository } = buildService();
      gatheringRepository.create.mockResolvedValue(buildGathering({ preacherPersonId: 'rp-1', message: 'Faith Over Fear' }));

      const result = await service.create(actor, {
        type: 'SUNDAY_SERVICE',
        scheduledStart: NOW.toISOString(),
        preacherPersonId: 'rp-1',
        message: 'Faith Over Fear',
      } as never);

      expect(gatheringRepository.create).toHaveBeenCalledWith(expect.objectContaining({ preacherPersonId: 'rp-1', message: 'Faith Over Fear' }));
      expect(result.preacherPersonId).toBe('rp-1');
      expect(result.message).toBe('Faith Over Fear');
    });
  });

  describe('list (Shepherd Dashboard sprint + Gatherings Web Admin sprint)', () => {
    it('defaults to a "now through +30 days" window when from/to are not supplied', async () => {
      const { service, gatheringRepository } = buildService();
      gatheringRepository.listByGroupAndRange.mockResolvedValue([buildGathering()]);

      await service.list(actor, { ownerGroupId: 'bacenta-1' } as never);

      const [groupId, from, to] = gatheringRepository.listByGroupAndRange.mock.calls[0];
      expect(groupId).toBe('bacenta-1');
      expect(to.getTime() - from.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it('uses an explicit from/to window when supplied', async () => {
      const { service, gatheringRepository } = buildService();
      gatheringRepository.listByGroupAndRange.mockResolvedValue([]);
      const from = '2026-08-01T00:00:00.000Z';
      const to = '2026-08-08T00:00:00.000Z';

      await service.list(actor, { ownerGroupId: 'bacenta-1', from, to } as never);

      expect(gatheringRepository.listByGroupAndRange).toHaveBeenCalledWith('bacenta-1', new Date(from), new Date(to), undefined);
    });

    it('maps repository rows to response DTOs', async () => {
      const { service, gatheringRepository } = buildService();
      gatheringRepository.listByGroupAndRange.mockResolvedValue([buildGathering({ id: 'g-2' })]);

      const result = await service.list(actor, { ownerGroupId: 'bacenta-1' } as never);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('g-2');
    });

    it('passes the type filter through to listByGroupAndRange when ownerGroupId is present', async () => {
      const { service, gatheringRepository } = buildService();
      gatheringRepository.listByGroupAndRange.mockResolvedValue([]);

      await service.list(actor, { ownerGroupId: 'bacenta-1', type: 'BACENTA_MEETING' } as never);

      expect(gatheringRepository.listByGroupAndRange).toHaveBeenCalledWith(
        'bacenta-1',
        expect.any(Date),
        expect.any(Date),
        'BACENTA_MEETING',
      );
    });

    it('falls back to listByBranchAndRange against the actor\'s own Branch when ownerGroupId is absent (Gatherings Web Admin sprint)', async () => {
      const { service, gatheringRepository } = buildService();
      gatheringRepository.listByBranchAndRange.mockResolvedValue([buildGathering()]);

      const result = await service.list(actor, {} as never);

      expect(gatheringRepository.listByBranchAndRange).toHaveBeenCalledWith('branch-1', expect.any(Date), expect.any(Date), undefined);
      expect(gatheringRepository.listByGroupAndRange).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  /** `[Post-Milestone D — Portal Experiences follow-up]` `council=true` -
   * every real Branch in the actor's own Council, one `runInBranchScope`
   * call per Branch, results flattened into one array (every row already
   * carries its own `branchId`). */
  describe('list (council=true)', () => {
    const overseer: ActorContext = { personId: 'overseer-1', role: 'COUNCIL_OVERSEER', branchId: 'branch-1', councilBranchIds: ['branch-1', 'branch-2'] };

    it('lists across every Branch in the Council, one runInBranchScope call per Branch, flattened into one array', async () => {
      const { service, gatheringRepository, prisma } = buildService();
      gatheringRepository.listByBranchAndRange.mockImplementation((branchId: string) => Promise.resolve([buildGathering({ id: `g-${branchId}`, branchId })]));

      const result = await service.list(overseer, { council: true } as never);

      expect(prisma.runInBranchScope).toHaveBeenCalledTimes(2);
      expect(prisma.runInBranchScope).toHaveBeenNthCalledWith(1, 'branch-1', expect.any(Function));
      expect(prisma.runInBranchScope).toHaveBeenNthCalledWith(2, 'branch-2', expect.any(Function));
      expect(result.map((g) => g.id)).toEqual(['g-branch-1', 'g-branch-2']);
    });

    it('rejects with a BadRequestException when both council and ownerGroupId are supplied', async () => {
      const { service } = buildService();

      await expect(service.list(overseer, { council: true, ownerGroupId: 'bacenta-1' } as never)).rejects.toThrow('Supply at most one of council or ownerGroupId, not both');
    });

    it('rejects with a BadRequestException when the actor has no Council scope', async () => {
      const { service } = buildService();
      const admin: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };

      await expect(service.list(admin, { council: true } as never)).rejects.toThrow('This actor has no Council scope to aggregate across');
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

    it('[Milestone A] passes preacherPersonId/message through when given', async () => {
      const { service, gatheringRepository } = buildService();
      gatheringRepository.findById.mockResolvedValue(buildGathering());
      gatheringRepository.update.mockResolvedValue(buildGathering({ preacherPersonId: 'rp-1', message: 'Faith Over Fear' }));

      await service.update('g-1', { preacherPersonId: 'rp-1', message: 'Faith Over Fear' } as never);

      expect(gatheringRepository.update).toHaveBeenCalledWith('g-1', expect.objectContaining({ preacherPersonId: 'rp-1', message: 'Faith Over Fear' }));
    });
  });
});
