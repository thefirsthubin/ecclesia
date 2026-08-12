import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { BranchConfigurationRepository } from './branch-configuration.repository';

describe('BranchConfigurationRepository', () => {
  function buildRepository() {
    const prisma = {
      configuration: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    };
    const repository = new BranchConfigurationRepository(prisma as never);
    return { repository, prisma };
  }

  it('findByBranch() delegates directly to prisma.configuration.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.configuration.findUnique.mockResolvedValue({ id: 'config-1' });

    const result = await repository.findByBranch('branch-1');

    expect(prisma.configuration.findUnique).toHaveBeenCalledWith({ where: { branchId: 'branch-1' } });
    expect(result).toEqual({ id: 'config-1' });
  });

  it('create() writes the safe seed-matching defaults for the fields this milestone does not expose', async () => {
    const { repository, prisma } = buildRepository();
    prisma.configuration.create.mockResolvedValue({ id: 'config-1' });

    await repository.create({
      branchId: 'branch-1',
      churchPulseWeights: { ATTENDANCE: 0.5 },
      poimenGateEnabled: true,
      silentDriftConfig: { n: 4, m: 4 },
    });

    expect(prisma.configuration.create).toHaveBeenCalledWith({
      data: {
        branchId: 'branch-1',
        gatheringTypes: [],
        churchPulseWeights: { ATTENDANCE: 0.5 },
        poimenGateEnabled: true,
        followupSlaDefaults: {},
        silentDriftConfig: { n: 4, m: 4 },
      },
    });
  });

  it('create() rejects with ConflictException on a duplicate-Branch (P2002) constraint violation', async () => {
    const { repository, prisma } = buildRepository();
    prisma.configuration.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '5.0.0' }),
    );

    await expect(
      repository.create({ branchId: 'branch-1', churchPulseWeights: {}, poimenGateEnabled: false, silentDriftConfig: {} }),
    ).rejects.toThrow(ConflictException);
  });

  it('update() delegates directly to prisma.configuration.update, keyed on branchId', async () => {
    const { repository, prisma } = buildRepository();
    prisma.configuration.update.mockResolvedValue({ id: 'config-1', poimenGateEnabled: true });

    const result = await repository.update('branch-1', { poimenGateEnabled: true });

    expect(prisma.configuration.update).toHaveBeenCalledWith({ where: { branchId: 'branch-1' }, data: { poimenGateEnabled: true } });
    expect(result).toEqual({ id: 'config-1', poimenGateEnabled: true });
  });
});
