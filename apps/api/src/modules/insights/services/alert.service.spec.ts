import { NotFoundException } from '@nestjs/common';

import { AlertService } from './alert.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function historyPoint(score: number, computedAt: Date) {
  return { score: { toNumber: () => score }, computedAt };
}

function buildAlert(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'alert-1',
    branchId: 'branch-1',
    scopeType: 'GROUP',
    scopeId: 'group-1',
    alertType: 'PULSE_DECLINE',
    message: 'declined',
    status: 'OPEN',
    resolvedByPersonId: null,
    resolvedAt: null,
    triggeredAt: NOW,
    ...overrides,
  };
}

describe('AlertService', () => {
  function buildService() {
    const alertRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      hasOpenAlert: jest.fn(),
      listByScope: jest.fn(),
      resolve: jest.fn(),
    };
    const pulseScoreHistoryRepository = { findRecentByScope: jest.fn() };
    const service = new AlertService(alertRepository as never, pulseScoreHistoryRepository as never);
    return { service, alertRepository, pulseScoreHistoryRepository };
  }

  describe('evaluateAndCreateIfNeeded', () => {
    it('does not create an alert when the trend has not declined', async () => {
      const { service, pulseScoreHistoryRepository, alertRepository } = buildService();
      pulseScoreHistoryRepository.findRecentByScope.mockResolvedValue([
        historyPoint(70, new Date('2026-07-11T00:00:00.000Z')),
        historyPoint(72, NOW),
      ]);

      await service.evaluateAndCreateIfNeeded('branch-1', 'GROUP', 'group-1', NOW);

      expect(alertRepository.create).not.toHaveBeenCalled();
    });

    it('creates a PULSE_DECLINE alert when the trend has declined and none is already open', async () => {
      const { service, pulseScoreHistoryRepository, alertRepository } = buildService();
      pulseScoreHistoryRepository.findRecentByScope.mockResolvedValue([
        historyPoint(75, new Date('2026-07-11T00:00:00.000Z')),
        historyPoint(60, NOW),
      ]);
      alertRepository.hasOpenAlert.mockResolvedValue(false);

      await service.evaluateAndCreateIfNeeded('branch-1', 'GROUP', 'group-1', NOW);

      expect(alertRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'branch-1', scopeType: 'GROUP', scopeId: 'group-1', alertType: 'PULSE_DECLINE' }),
      );
    });

    it('does not create a duplicate alert when one is already OPEN for this scope', async () => {
      const { service, pulseScoreHistoryRepository, alertRepository } = buildService();
      pulseScoreHistoryRepository.findRecentByScope.mockResolvedValue([
        historyPoint(75, new Date('2026-07-11T00:00:00.000Z')),
        historyPoint(60, NOW),
      ]);
      alertRepository.hasOpenAlert.mockResolvedValue(true);

      await service.evaluateAndCreateIfNeeded('branch-1', 'GROUP', 'group-1', NOW);

      expect(alertRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('listForScope', () => {
    it('maps repository rows onto response DTOs', async () => {
      const { service, alertRepository } = buildService();
      alertRepository.listByScope.mockResolvedValue([buildAlert()]);

      const result = await service.listForScope('GROUP', 'group-1');

      expect(result).toEqual([
        expect.objectContaining({ id: 'alert-1', status: 'OPEN', resolvedAt: null, triggeredAt: NOW.toISOString() }),
      ]);
    });
  });

  describe('getById', () => {
    it('throws NotFoundException when the Alert does not exist', async () => {
      const { service, alertRepository } = buildService();
      alertRepository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolve', () => {
    it('throws NotFoundException when the Alert does not exist', async () => {
      const { service, alertRepository } = buildService();
      alertRepository.findById.mockResolvedValue(null);

      await expect(service.resolve('person-1', 'missing', { status: 'ACTED' })).rejects.toThrow(NotFoundException);
    });

    it('attributes resolution to the acting Person, never a client-supplied resolver', async () => {
      const { service, alertRepository } = buildService();
      alertRepository.findById.mockResolvedValue(buildAlert());
      alertRepository.resolve.mockResolvedValue(buildAlert({ status: 'ACTED', resolvedByPersonId: 'person-1', resolvedAt: NOW }));

      const result = await service.resolve('person-1', 'alert-1', { status: 'ACTED' });

      expect(alertRepository.resolve).toHaveBeenCalledWith(
        'alert-1',
        expect.objectContaining({ status: 'ACTED', resolvedByPersonId: 'person-1' }),
      );
      expect(result.status).toBe('ACTED');
    });
  });
});
