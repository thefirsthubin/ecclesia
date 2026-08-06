import { BranchConfigurationService } from './branch-configuration.service';

describe('BranchConfigurationService', () => {
  function buildService(configurationFindUnique: jest.Mock) {
    const prisma = { configuration: { findUnique: configurationFindUnique } };
    const logger = { warn: jest.fn(), info: jest.fn(), error: jest.fn() };
    const service = new BranchConfigurationService(prisma as never, logger as never);
    return { service, logger };
  }

  it('returns poimenGateEnabled from the Configuration row when one exists', async () => {
    const { service } = buildService(jest.fn().mockResolvedValue({ poimenGateEnabled: true }));
    const result = await service.loadForBranch('branch-1');
    expect(result).toEqual({ poimenGateEnabled: true });
  });

  it('defaults poimenGateEnabled to false and warns when no Configuration row exists (PRD §24 OQ-02 default)', async () => {
    const { service, logger } = buildService(jest.fn().mockResolvedValue(null));
    const result = await service.loadForBranch('branch-2');
    expect(result).toEqual({ poimenGateEnabled: false });
    expect(logger.warn).toHaveBeenCalled();
  });
});
