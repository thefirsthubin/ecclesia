import { NotFoundException } from '@nestjs/common';

import { BranchConfigurationCrudService } from './branch-configuration.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function buildConfiguration(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'config-1',
    branchId: 'branch-1',
    gatheringTypes: [],
    churchPulseWeights: { ATTENDANCE: 0.5, FINANCIAL_GIVING: 0.5 },
    poimenGateEnabled: false,
    followupSlaDefaults: {},
    silentDriftConfig: { n: 3, m: 3 },
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('BranchConfigurationCrudService', () => {
  function buildService() {
    const branchConfigurationRepository = { findByBranch: jest.fn(), create: jest.fn(), update: jest.fn() };
    const service = new BranchConfigurationCrudService(branchConfigurationRepository as never);
    return { service, branchConfigurationRepository };
  }

  describe('getForBranch', () => {
    it('maps the repository row to a response DTO, omitting gatheringTypes/followupSlaDefaults', async () => {
      const { service, branchConfigurationRepository } = buildService();
      branchConfigurationRepository.findByBranch.mockResolvedValue(buildConfiguration());

      const result = await service.getForBranch('branch-1');

      expect(branchConfigurationRepository.findByBranch).toHaveBeenCalledWith('branch-1');
      expect(result).toEqual({
        id: 'config-1',
        branchId: 'branch-1',
        churchPulseWeights: { ATTENDANCE: 0.5, FINANCIAL_GIVING: 0.5 },
        poimenGateEnabled: false,
        silentDriftConfig: { n: 3, m: 3 },
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      });
      expect(result).not.toHaveProperty('gatheringTypes');
      expect(result).not.toHaveProperty('followupSlaDefaults');
    });

    it('throws NotFoundException when no Configuration exists yet for the Branch', async () => {
      const { service, branchConfigurationRepository } = buildService();
      branchConfigurationRepository.findByBranch.mockResolvedValue(null);

      await expect(service.getForBranch('branch-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('defaults omitted fields to the same safe placeholders db/seed.ts uses', async () => {
      const { service, branchConfigurationRepository } = buildService();
      branchConfigurationRepository.create.mockResolvedValue(buildConfiguration({ churchPulseWeights: {}, silentDriftConfig: {} }));

      await service.create('branch-1', {});

      expect(branchConfigurationRepository.create).toHaveBeenCalledWith({
        branchId: 'branch-1',
        churchPulseWeights: {},
        poimenGateEnabled: false,
        silentDriftConfig: {},
      });
    });

    it('passes explicit input through unchanged', async () => {
      const { service, branchConfigurationRepository } = buildService();
      branchConfigurationRepository.create.mockResolvedValue(buildConfiguration());

      await service.create('branch-1', { churchPulseWeights: { ATTENDANCE: 0.5 }, poimenGateEnabled: true, silentDriftConfig: { n: 5, m: 5 } });

      expect(branchConfigurationRepository.create).toHaveBeenCalledWith({
        branchId: 'branch-1',
        churchPulseWeights: { ATTENDANCE: 0.5 },
        poimenGateEnabled: true,
        silentDriftConfig: { n: 5, m: 5 },
      });
    });
  });

  describe('update', () => {
    it('throws NotFoundException when no Configuration exists yet for the Branch', async () => {
      const { service, branchConfigurationRepository } = buildService();
      branchConfigurationRepository.findByBranch.mockResolvedValue(null);

      await expect(service.update('branch-1', { poimenGateEnabled: true })).rejects.toThrow(NotFoundException);
      expect(branchConfigurationRepository.update).not.toHaveBeenCalled();
    });

    it('applies the given fields and returns the mapped DTO', async () => {
      const { service, branchConfigurationRepository } = buildService();
      branchConfigurationRepository.findByBranch.mockResolvedValue(buildConfiguration());
      branchConfigurationRepository.update.mockResolvedValue(buildConfiguration({ poimenGateEnabled: true }));

      const result = await service.update('branch-1', { poimenGateEnabled: true });

      expect(branchConfigurationRepository.update).toHaveBeenCalledWith('branch-1', {
        churchPulseWeights: undefined,
        poimenGateEnabled: true,
        silentDriftConfig: undefined,
      });
      expect(result.poimenGateEnabled).toBe(true);
    });
  });
});
