import { FinancialTransactionRepository } from './financial-transaction.repository';

describe('FinancialTransactionRepository', () => {
  function buildRepository() {
    const prisma = {
      financialTransaction: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), groupBy: jest.fn(), aggregate: jest.fn() },
      financialTransactionEvent: { create: jest.fn(), findFirst: jest.fn() },
      user: { findUnique: jest.fn() },
    };
    const repository = new FinancialTransactionRepository(prisma as never);
    return { repository, prisma };
  }

  /**
   * `[Bug fix, Stewardship/Role Assignment RLS audit]` `createWithEvent`/
   * `appendEvent` no longer open their own `this.prisma.$transaction(...)`
   * - confirmed live against real Postgres that doing so broke RLS (a
   * second, unscoped transaction that never ran `runInBranchScope`'s `SET
   * LOCAL app.current_branch_id`, so every statement inside it 500'd with
   * "unrecognized configuration parameter"). These tests assert directly
   * against `prisma.X`, not a `tx` stand-in, matching what the fixed
   * implementation actually calls - atomicity now comes from
   * `BranchScopeInterceptor`'s own single request-wide transaction, not a
   * nested one.
   */
  describe('createWithEvent', () => {
    it('creates the transaction and its first event (fromState: null)', async () => {
      const { repository, prisma } = buildRepository();
      prisma.financialTransaction.create.mockResolvedValue({ id: 'ft-1' });

      const input = {
        branchId: 'branch-1',
        type: 'OFFERING' as const,
        sourceGroupId: 'bacenta-1',
        amountMinor: 5000n,
        currency: 'GHS',
        initialState: 'RECORDED',
        actorUserId: 'user-1',
      };

      const result = await repository.createWithEvent(input);

      expect(prisma.financialTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ branchId: 'branch-1', type: 'OFFERING', currentState: 'RECORDED' }),
      });
      expect(prisma.financialTransactionEvent.create).toHaveBeenCalledWith({
        data: { transactionId: 'ft-1', fromState: null, toState: 'RECORDED', actorUserId: 'user-1', reason: undefined },
      });
      expect(result).toEqual({ id: 'ft-1' });
    });
  });

  describe('appendEvent', () => {
    it('creates a new event and mirrors toState onto currentState', async () => {
      const { repository, prisma } = buildRepository();
      prisma.financialTransaction.update.mockResolvedValue({ id: 'ft-1', currentState: 'VERIFIED' });

      const result = await repository.appendEvent('ft-1', 'RECORDED', 'VERIFIED', 'user-2', undefined);

      expect(prisma.financialTransactionEvent.create).toHaveBeenCalledWith({
        data: { transactionId: 'ft-1', fromState: 'RECORDED', toState: 'VERIFIED', actorUserId: 'user-2', reason: undefined },
      });
      expect(prisma.financialTransaction.update).toHaveBeenCalledWith({
        where: { id: 'ft-1' },
        data: { currentState: 'VERIFIED' },
      });
      expect(result).toEqual({ id: 'ft-1', currentState: 'VERIFIED' });
    });
  });

  it('findById() delegates directly to prisma.financialTransaction.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.financialTransaction.findUnique.mockResolvedValue({ id: 'ft-1' });

    const result = await repository.findById('ft-1');

    expect(prisma.financialTransaction.findUnique).toHaveBeenCalledWith({ where: { id: 'ft-1' } });
    expect(result).toEqual({ id: 'ft-1' });
  });

  it('findManyByBranch() filters by branchId and, when given, currentState', async () => {
    const { repository, prisma } = buildRepository();
    prisma.financialTransaction.findMany.mockResolvedValue([]);

    await repository.findManyByBranch('branch-1', 'FLAGGED');

    expect(prisma.financialTransaction.findMany).toHaveBeenCalledWith({
      where: { branchId: 'branch-1', currentState: 'FLAGGED' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findManyByBranch() also filters by type when given (Stewardship Web Admin sprint)', async () => {
    const { repository, prisma } = buildRepository();
    prisma.financialTransaction.findMany.mockResolvedValue([]);

    await repository.findManyByBranch('branch-1', 'REQUESTED', 'EXPENSE');

    expect(prisma.financialTransaction.findMany).toHaveBeenCalledWith({
      where: { branchId: 'branch-1', currentState: 'REQUESTED', type: 'EXPENSE' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('[Stewardship gaps sprint] findManyByBranch() also filters by sourceGroupId when given', async () => {
    const { repository, prisma } = buildRepository();
    prisma.financialTransaction.findMany.mockResolvedValue([]);

    await repository.findManyByBranch('branch-1', 'RECORDED', undefined, 'bacenta-1');

    expect(prisma.financialTransaction.findMany).toHaveBeenCalledWith({
      where: { branchId: 'branch-1', currentState: 'RECORDED', sourceGroupId: 'bacenta-1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('[Stewardship gaps sprint] sumVerifiedAmountByGroupForWeek() groups by sourceGroupId, filters VERIFIED/RECONCILED within the window, and defaults a null sum to 0n', async () => {
    const { repository, prisma } = buildRepository();
    prisma.financialTransaction.groupBy.mockResolvedValue([
      { sourceGroupId: 'bacenta-1', _sum: { amountMinor: 5000n } },
      { sourceGroupId: null, _sum: { amountMinor: 100n } },
      { sourceGroupId: 'bacenta-2', _sum: { amountMinor: null } },
    ]);
    const weekStart = new Date('2026-08-03T00:00:00.000Z');
    const weekEnd = new Date('2026-08-10T00:00:00.000Z');

    const result = await repository.sumVerifiedAmountByGroupForWeek('branch-1', weekStart, weekEnd);

    expect(prisma.financialTransaction.groupBy).toHaveBeenCalledWith({
      by: ['sourceGroupId'],
      where: {
        branchId: 'branch-1',
        sourceGroupId: { not: null },
        currentState: { in: ['VERIFIED', 'RECONCILED'] },
        createdAt: { gte: weekStart, lt: weekEnd },
      },
      _sum: { amountMinor: true },
    });
    // The `sourceGroupId: null` row is filtered out (it should never occur
    // given the `where` clause above already excludes it, but the
    // repository's own defensive filter is exercised here regardless).
    expect(result).toEqual([
      { sourceGroupId: 'bacenta-1', totalAmountMinor: 5000n },
      { sourceGroupId: 'bacenta-2', totalAmountMinor: 0n },
    ]);
  });

  it('findFirstEventByToState() orders by occurredAt ascending to find the first entry into that state', async () => {
    const { repository, prisma } = buildRepository();
    prisma.financialTransactionEvent.findFirst.mockResolvedValue({ id: 'evt-1' });

    const result = await repository.findFirstEventByToState('ft-1', 'RECORDED');

    expect(prisma.financialTransactionEvent.findFirst).toHaveBeenCalledWith({
      where: { transactionId: 'ft-1', toState: 'RECORDED' },
      orderBy: { occurredAt: 'asc' },
    });
    expect(result).toEqual({ id: 'evt-1' });
  });

  describe('findRecordedByPersonId', () => {
    it('returns undefined when no RECORDED event exists', async () => {
      const { repository, prisma } = buildRepository();
      prisma.financialTransactionEvent.findFirst.mockResolvedValue(null);

      const result = await repository.findRecordedByPersonId('ft-1');

      expect(result).toBeUndefined();
    });

    it('composes findFirstEventByToState + findPersonIdByUserId', async () => {
      const { repository, prisma } = buildRepository();
      prisma.financialTransactionEvent.findFirst.mockResolvedValue({ id: 'evt-1', actorUserId: 'user-1' });
      prisma.user.findUnique.mockResolvedValue({ personId: 'person-1' });

      const result = await repository.findRecordedByPersonId('ft-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' }, select: { personId: true } });
      expect(result).toBe('person-1');
    });
  });

  it('findUserIdByPersonId() delegates to prisma.user.findUnique keyed by personId', async () => {
    const { repository, prisma } = buildRepository();
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

    const result = await repository.findUserIdByPersonId('person-1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { personId: 'person-1' }, select: { id: true } });
    expect(result).toBe('user-1');
  });

  describe('sumVerifiedAmountForBranch', () => {
    it('sums amountMinor for VERIFIED/RECONCILED transactions, scoped to the branch and the [from, to) window', async () => {
      const { repository, prisma } = buildRepository();
      prisma.financialTransaction.aggregate.mockResolvedValue({ _sum: { amountMinor: 2450000n } });
      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-09-01T00:00:00.000Z');

      const result = await repository.sumVerifiedAmountForBranch('branch-1', from, to);

      expect(prisma.financialTransaction.aggregate).toHaveBeenCalledWith({
        where: {
          branchId: 'branch-1',
          currentState: { in: ['VERIFIED', 'RECONCILED'] },
          createdAt: { gte: from, lt: to },
        },
        _sum: { amountMinor: true },
      });
      expect(result).toBe(2450000n);
    });

    it('does not filter by sourceGroupId - unlike sumVerifiedAmountByGroupForWeek, individual gifts count toward a Branch-wide total', async () => {
      const { repository, prisma } = buildRepository();
      prisma.financialTransaction.aggregate.mockResolvedValue({ _sum: { amountMinor: 1000n } });

      await repository.sumVerifiedAmountForBranch('branch-1', new Date(), new Date());

      const call = prisma.financialTransaction.aggregate.mock.calls[0][0];
      expect(call.where).not.toHaveProperty('sourceGroupId');
    });

    it('returns 0n, not null/undefined, when nothing is verified in the window', async () => {
      const { repository, prisma } = buildRepository();
      prisma.financialTransaction.aggregate.mockResolvedValue({ _sum: { amountMinor: null } });

      const result = await repository.sumVerifiedAmountForBranch('branch-1', new Date(), new Date());

      expect(result).toBe(0n);
    });
  });
});
