import { NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { OutreachService } from './outreach.service';

const NOW = new Date('2026-08-15T09:00:00.000Z');

function buildOutreach(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'outreach-1',
    branchId: 'branch-1',
    groupId: 'bacenta-1',
    occurredAt: NOW,
    location: 'Osu Estate',
    leaderPersonId: 'leader-1',
    notes: null,
    createdByPersonId: 'leader-1',
    createdAt: NOW,
    ...overrides,
  };
}

describe('[Milestone B] OutreachService', () => {
  const actor: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };

  function buildService() {
    const outreachRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      listByGroup: jest.fn(),
      listByBranch: jest.fn(),
      countByBranch: jest.fn(),
      countByGroups: jest.fn(),
    };
    const service = new OutreachService(outreachRepository as never);
    return { service, outreachRepository };
  }

  describe('create', () => {
    it('scopes the new Outreach to the actor\'s own Branch', async () => {
      const { service, outreachRepository } = buildService();
      outreachRepository.create.mockResolvedValue(buildOutreach());

      await service.create(actor, {
        groupId: 'bacenta-1',
        occurredAt: NOW.toISOString(),
        leaderPersonId: 'leader-1',
      } as never);

      expect(outreachRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'branch-1', groupId: 'bacenta-1', leaderPersonId: 'leader-1', createdByPersonId: 'leader-1' }),
      );
    });
  });

  describe('list', () => {
    it('delegates to listByGroup when query.groupId is present', async () => {
      const { service, outreachRepository } = buildService();
      outreachRepository.listByGroup.mockResolvedValue([buildOutreach()]);

      const result = await service.list(actor, { groupId: 'bacenta-1' } as never);

      expect(outreachRepository.listByGroup).toHaveBeenCalledWith('bacenta-1', undefined, undefined);
      expect(outreachRepository.listByBranch).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('falls back to listByBranch against the actor\'s own Branch when query.groupId is absent', async () => {
      const { service, outreachRepository } = buildService();
      outreachRepository.listByBranch.mockResolvedValue([buildOutreach()]);

      const result = await service.list(actor, {} as never);

      expect(outreachRepository.listByBranch).toHaveBeenCalledWith('branch-1', undefined, undefined);
      expect(outreachRepository.listByGroup).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('parses from/to into Dates when given', async () => {
      const { service, outreachRepository } = buildService();
      outreachRepository.listByBranch.mockResolvedValue([]);
      const from = '2026-08-01T00:00:00.000Z';
      const to = '2026-08-31T00:00:00.000Z';

      await service.list(actor, { from, to } as never);

      expect(outreachRepository.listByBranch).toHaveBeenCalledWith('branch-1', new Date(from), new Date(to));
    });
  });

  describe('getById', () => {
    it('throws NotFoundException when the Outreach does not exist', async () => {
      const { service, outreachRepository } = buildService();
      outreachRepository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });

    it('maps a found row to a response DTO', async () => {
      const { service, outreachRepository } = buildService();
      outreachRepository.findById.mockResolvedValue(buildOutreach());

      const result = await service.getById('outreach-1');

      expect(result.id).toBe('outreach-1');
      expect(result.occurredAt).toBe(NOW.toISOString());
    });
  });

  describe('[Milestone C.1.2] countByBranch / countByGroups', () => {
    it('countByBranch() delegates directly to the repository', async () => {
      const { service, outreachRepository } = buildService();
      outreachRepository.countByBranch.mockResolvedValue(5);
      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-08-31T00:00:00.000Z');

      const result = await service.countByBranch('branch-1', from, to);

      expect(outreachRepository.countByBranch).toHaveBeenCalledWith('branch-1', from, to);
      expect(result).toBe(5);
    });

    it('countByGroups() delegates directly to the repository', async () => {
      const { service, outreachRepository } = buildService();
      outreachRepository.countByGroups.mockResolvedValue(2);

      const result = await service.countByGroups(['bacenta-1']);

      expect(outreachRepository.countByGroups).toHaveBeenCalledWith(['bacenta-1'], undefined, undefined);
      expect(result).toBe(2);
    });
  });
});
