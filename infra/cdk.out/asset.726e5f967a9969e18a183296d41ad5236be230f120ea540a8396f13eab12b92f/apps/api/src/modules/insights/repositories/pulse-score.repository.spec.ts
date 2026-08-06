import { PulseScoreRepository } from './pulse-score.repository';

describe('PulseScoreRepository', () => {
  function buildRepository() {
    const prisma = {
      pulseScore: { upsert: jest.fn(), findUnique: jest.fn() },
      configuration: { findUnique: jest.fn() },
    };
    const repository = new PulseScoreRepository(prisma as never);
    return { repository, prisma };
  }

  it('upsert() keys on the scopeType/scopeId compound unique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.pulseScore.upsert.mockResolvedValue({ id: 'score-1' });
    const input = {
      branchId: 'branch-1',
      scopeType: 'BRANCH' as const,
      scopeId: 'branch-1',
      score: 72.5,
      computedAt: new Date('2026-08-01T00:00:00.000Z'),
    };

    const result = await repository.upsert(input);

    expect(prisma.pulseScore.upsert).toHaveBeenCalledWith({
      where: { scopeType_scopeId: { scopeType: 'BRANCH', scopeId: 'branch-1' } },
      create: input,
      update: { score: 72.5, computedAt: input.computedAt },
    });
    expect(result).toEqual({ id: 'score-1' });
  });

  it('findByScope() delegates to prisma.pulseScore.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.pulseScore.findUnique.mockResolvedValue({ id: 'score-1' });

    const result = await repository.findByScope('GROUP', 'group-1');

    expect(prisma.pulseScore.findUnique).toHaveBeenCalledWith({
      where: { scopeType_scopeId: { scopeType: 'GROUP', scopeId: 'group-1' } },
    });
    expect(result).toEqual({ id: 'score-1' });
  });

  it('findChurchPulseWeights() returns the parsed Json field when present', async () => {
    const { repository, prisma } = buildRepository();
    prisma.configuration.findUnique.mockResolvedValue({ churchPulseWeights: { ATTENDANCE: 0.5 } });

    const result = await repository.findChurchPulseWeights('branch-1');

    expect(prisma.configuration.findUnique).toHaveBeenCalledWith({
      where: { branchId: 'branch-1' },
      select: { churchPulseWeights: true },
    });
    expect(result).toEqual({ ATTENDANCE: 0.5 });
  });

  it('findChurchPulseWeights() returns null when the Branch has no configurations row yet', async () => {
    const { repository, prisma } = buildRepository();
    prisma.configuration.findUnique.mockResolvedValue(null);

    const result = await repository.findChurchPulseWeights('branch-1');

    expect(result).toBeNull();
  });
});
