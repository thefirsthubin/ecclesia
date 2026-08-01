import { FinancialTransactionRepository } from './financial-transaction.repository';

describe('FinancialTransactionRepository', () => {
  function buildRepository() {
    const txClient = {
      financialTransaction: { create: jest.fn(), update: jest.fn() },
      financialTransactionEvent: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((fn: (tx: typeof txClient) => unknown) => fn(txClient)),
      financialTransaction: { findUnique: jest.fn(), findMany: jest.fn() },
      financialTransactionEvent: { findFirst: jest.fn() },
      user: { findUnique: jest.fn() },
    };
    const repository = new FinancialTransactionRepository(prisma as never);
    return { repository, prisma, txClient };
  }

  describe('createWithEvent', () => {
    it('creates the transaction and its first event (fromState: null) inside one $transaction', async () => {
      const { repository, prisma, txClient } = buildRepository();
      txClient.financialTransaction.create.mockResolvedValue({ id: 'ft-1' });

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

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(txClient.financialTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ branchId: 'branch-1', type: 'OFFERING', currentState: 'RECORDED' }),
      });
      expect(txClient.financialTransactionEvent.create).toHaveBeenCalledWith({
        data: { transactionId: 'ft-1', fromState: null, toState: 'RECORDED', actorUserId: 'user-1', reason: undefined },
      });
      expect(result).toEqual({ id: 'ft-1' });
    });
  });

  describe('appendEvent', () => {
    it('creates a new event and mirrors toState onto currentState inside one $transaction', async () => {
      const { repository, prisma, txClient } = buildRepository();
      txClient.financialTransaction.update.mockResolvedValue({ id: 'ft-1', currentState: 'VERIFIED' });

      const result = await repository.appendEvent('ft-1', 'RECORDED', 'VERIFIED', 'user-2', undefined);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(txClient.financialTransactionEvent.create).toHaveBeenCalledWith({
        data: { transactionId: 'ft-1', fromState: 'RECORDED', toState: 'VERIFIED', actorUserId: 'user-2', reason: undefined },
      });
      expect(txClient.financialTransaction.update).toHaveBeenCalledWith({
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
});
