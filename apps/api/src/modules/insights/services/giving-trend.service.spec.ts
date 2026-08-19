import type { ActorContext } from '@ecclesia/rbac';

import { GivingTrendService } from './giving-trend.service';

function row(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'txn-1',
    type: 'OFFERING',
    amountMinor: 1000n,
    sourceGroupId: null,
    gatheringId: null,
    createdAt: new Date('2026-08-10T00:00:00.000Z'),
    gathering: null,
    ...overrides,
  };
}

describe('[Milestone C] GivingTrendService', () => {
  function buildService() {
    const financialTransactionService = { listVerifiedForTrend: jest.fn().mockResolvedValue([]) };
    const gatheringTypeCategoryService = { typesForCategory: jest.fn() };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const service = new GivingTrendService(financialTransactionService as never, gatheringTypeCategoryService as never, prisma as never);
    return { service, financialTransactionService, gatheringTypeCategoryService, prisma };
  }

  const branchActor: ActorContext = { personId: 'treasurer-1', role: 'TREASURER', branchId: 'branch-1' };

  it('excludes EXPENSE from the default type filter', async () => {
    const { service, financialTransactionService } = buildService();

    await service.getTrend(branchActor, { granularity: 'month', count: 3, council: false } as never);

    const types = financialTransactionService.listVerifiedForTrend.mock.calls[0][3];
    expect(types).not.toContain('EXPENSE');
    expect(types).toEqual(expect.arrayContaining(['OFFERING', 'TITHE', 'SPECIAL_OFFERING', 'PLEDGE', 'DONATION']));
  });

  it('sums verified amounts into the correct bucket by resolved date, using createdAt when there is no gatheringId', async () => {
    const { service, financialTransactionService } = buildService();
    financialTransactionService.listVerifiedForTrend.mockResolvedValue([
      row({ amountMinor: 500n, createdAt: new Date('2026-06-15T00:00:00.000Z') }),
      row({ amountMinor: 700n, createdAt: new Date('2026-08-15T00:00:00.000Z') }),
    ]);

    const result = await service.getTrend(branchActor, {
      granularity: 'month',
      count: 3,
      endingAt: '2026-08-17T00:00:00.000Z',
      council: false,
    } as never);

    expect('buckets' in result).toBe(true);
    if (!('buckets' in result)) throw new Error('expected a single-branch result');
    expect(result.buckets.map((b) => b.totalAmountMinor)).toEqual(['500', '0', '700']);
  });

  it('[Phase 3] uses Gathering.scheduledStart, not createdAt, as the date when gatheringId is set', async () => {
    const { service, financialTransactionService } = buildService();
    financialTransactionService.listVerifiedForTrend.mockResolvedValue([
      row({
        amountMinor: 900n,
        gatheringId: 'gathering-1',
        createdAt: new Date('2026-09-01T00:00:00.000Z'), // entered late, next month
        gathering: { scheduledStart: new Date('2026-08-16T10:00:00.000Z'), type: 'Sunday Service' }, // actual service date
      }),
    ]);

    const result = await service.getTrend(branchActor, {
      granularity: 'month',
      count: 3,
      endingAt: '2026-08-17T00:00:00.000Z',
      council: false,
    } as never);

    if (!('buckets' in result)) throw new Error('expected a single-branch result');
    // Falls in the August bucket (the Gathering's own date), not any
    // bucket derived from createdAt (which is outside this 3-month window entirely).
    expect(result.buckets[2].totalAmountMinor).toBe('900');
    expect(result.buckets.reduce((sum, b) => sum + Number(b.totalAmountMinor), 0)).toBe(900);
  });

  it('[Phase 1 decision #5] reports rows with neither gatheringId nor sourceGroupId as unattributedAmountMinor, never guessed into a bucket', async () => {
    const { service, financialTransactionService } = buildService();
    financialTransactionService.listVerifiedForTrend.mockResolvedValue([
      row({ amountMinor: 300n, sourceGroupId: null, gatheringId: null }),
      row({ amountMinor: 200n, sourceGroupId: 'bacenta-1' }),
    ]);

    const result = await service.getTrend(branchActor, { granularity: 'month', count: 1, council: false } as never);

    if (!('buckets' in result)) throw new Error('expected a single-branch result');
    expect(result.unattributedAmountMinor).toBe('300');
  });

  it('[gatheringCategory filter] only includes rows whose Gathering.type is mapped to the requested category, and reports unmapped types encountered', async () => {
    const { service, financialTransactionService, gatheringTypeCategoryService } = buildService();
    gatheringTypeCategoryService.typesForCategory.mockResolvedValue(['Sunday Service']);
    financialTransactionService.listVerifiedForTrend.mockResolvedValue([
      row({ amountMinor: 100n, gatheringId: 'g1', gathering: { scheduledStart: new Date('2026-08-16T00:00:00.000Z'), type: 'Sunday Service' } }),
      row({ amountMinor: 250n, gatheringId: 'g2', gathering: { scheduledStart: new Date('2026-08-16T00:00:00.000Z'), type: 'Wednesday Bible Study' } }),
    ]);

    const result = await service.getTrend(branchActor, {
      granularity: 'month',
      count: 1,
      endingAt: '2026-08-17T00:00:00.000Z',
      gatheringCategory: 'SUNDAY',
      council: false,
    } as never);

    if (!('buckets' in result)) throw new Error('expected a single-branch result');
    expect(result.buckets[0].totalAmountMinor).toBe('100');
    expect(result.unmappedGatheringTypes).toEqual(['Wednesday Bible Study']);
  });

  it('narrows to the actor\'s own single group for an OWN_GROUP-scoped actor', async () => {
    const { service, financialTransactionService } = buildService();
    const bacentaLeader: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };

    await service.getTrend(bacentaLeader, { granularity: 'month', count: 1, council: false } as never);

    expect(financialTransactionService.listVerifiedForTrend).toHaveBeenCalledWith(
      'branch-1',
      expect.any(Date),
      expect.any(Date),
      expect.any(Array),
      ['bacenta-1'],
    );
  });

  it('narrows to the actor\'s whole cluster for a CLUSTER-scoped actor', async () => {
    const { service, financialTransactionService } = buildService();
    const assistantPastor: ActorContext = {
      personId: 'ap-1',
      role: 'ASSISTANT_PASTOR',
      branchId: 'branch-1',
      clusterBacentaIds: ['bacenta-1', 'bacenta-2'],
    };

    await service.getTrend(assistantPastor, { granularity: 'month', count: 1, council: false } as never);

    expect(financialTransactionService.listVerifiedForTrend).toHaveBeenCalledWith(
      'branch-1',
      expect.any(Date),
      expect.any(Date),
      expect.any(Array),
      ['bacenta-1', 'bacenta-2'],
    );
  });

  it('[Council] loops across every Branch in the actor\'s Council, via runInBranchScope per Branch', async () => {
    const { service, financialTransactionService, prisma } = buildService();
    const residentPastor: ActorContext = {
      personId: 'rp-1',
      role: 'RESIDENT_PASTOR',
      branchId: 'branch-1',
      councilBranchIds: ['branch-1', 'branch-2'],
    };
    financialTransactionService.listVerifiedForTrend.mockResolvedValue([]);

    const result = await service.getTrend(residentPastor, { granularity: 'month', count: 1, council: true } as never);

    expect(prisma.runInBranchScope).toHaveBeenCalledTimes(2);
    expect(prisma.runInBranchScope).toHaveBeenNthCalledWith(1, 'branch-1', expect.any(Function));
    expect(prisma.runInBranchScope).toHaveBeenNthCalledWith(2, 'branch-2', expect.any(Function));
    expect('councilBranches' in result).toBe(true);
    if (!('councilBranches' in result)) throw new Error('expected a council result');
    expect(result.councilBranches).toHaveLength(2);
    expect(result.councilBranches.map((b) => b.branchId)).toEqual(['branch-1', 'branch-2']);
  });

  it('rejects a Council-scoped request from an actor with no councilBranchIds', async () => {
    const { service } = buildService();

    await expect(service.getTrend(branchActor, { granularity: 'month', count: 1, council: true } as never)).rejects.toThrow();
  });

  it('rejects supplying both council and groupId', async () => {
    const { service } = buildService();

    await expect(
      service.getTrend(branchActor, { granularity: 'month', count: 1, council: true, groupId: 'bacenta-1' } as never),
    ).rejects.toThrow();
  });
});
