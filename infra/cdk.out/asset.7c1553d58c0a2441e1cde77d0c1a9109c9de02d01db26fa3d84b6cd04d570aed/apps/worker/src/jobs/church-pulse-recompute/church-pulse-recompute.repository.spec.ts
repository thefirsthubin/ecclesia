import { ChurchPulseRecomputeRepository } from './church-pulse-recompute.repository';

describe('ChurchPulseRecomputeRepository', () => {
  function buildRepository() {
    const prisma = {
      group: { findMany: jest.fn() },
      configuration: { findUnique: jest.fn() },
      alert: { findFirst: jest.fn() },
    };
    const repository = new ChurchPulseRecomputeRepository(prisma as never);
    return { repository, prisma };
  }

  it('listActiveBacentaGroups() filters to PASTORAL_CARE + ACTIVE within the Branch', async () => {
    const { repository, prisma } = buildRepository();
    prisma.group.findMany.mockResolvedValue([{ id: 'group-1' }]);

    const result = await repository.listActiveBacentaGroups('branch-1');

    expect(result).toEqual([{ id: 'group-1' }]);
    expect(prisma.group.findMany).toHaveBeenCalledWith({
      where: { branchId: 'branch-1', type: 'PASTORAL_CARE', lifecycleStatus: 'ACTIVE' },
      select: { id: true },
    });
  });

  it('findChurchPulseWeights() returns null when no Configuration row exists', async () => {
    const { repository, prisma } = buildRepository();
    prisma.configuration.findUnique.mockResolvedValue(null);

    const result = await repository.findChurchPulseWeights('branch-1');

    expect(result).toBeNull();
  });

  it('hasOpenAlert() returns true when a matching OPEN alert exists', async () => {
    const { repository, prisma } = buildRepository();
    prisma.alert.findFirst.mockResolvedValue({ id: 'alert-1' });

    const result = await repository.hasOpenAlert('BRANCH', 'branch-1', 'PULSE_DECLINE');

    expect(result).toBe(true);
    expect(prisma.alert.findFirst).toHaveBeenCalledWith({
      where: { scopeType: 'BRANCH', scopeId: 'branch-1', alertType: 'PULSE_DECLINE', status: 'OPEN' },
    });
  });
});
