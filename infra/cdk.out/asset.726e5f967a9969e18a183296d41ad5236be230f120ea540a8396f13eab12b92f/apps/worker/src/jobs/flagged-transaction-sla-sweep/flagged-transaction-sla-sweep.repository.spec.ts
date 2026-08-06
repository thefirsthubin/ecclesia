import { FlaggedTransactionSlaSweepRepository } from './flagged-transaction-sla-sweep.repository';

describe('FlaggedTransactionSlaSweepRepository', () => {
  it('listFlaggedWithFlaggedAt() filters to FLAGGED transactions in the Branch, joining each one\'s most recent FLAGGED event', async () => {
    const flaggedAt = new Date('2026-07-01T00:00:00.000Z');
    const prisma = {
      financialTransaction: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'ft-1',
            sourceGroupId: 'bacenta-1',
            giverPersonId: null,
            events: [{ occurredAt: flaggedAt }],
          },
          // Defensive case: a FLAGGED transaction with no matching event
          // (should never occur in practice - `currentState` mirrors the
          // latest event's `toState` - but filtered out regardless).
          { id: 'ft-2', sourceGroupId: null, giverPersonId: 'person-1', events: [] },
        ]),
      },
    };
    const repository = new FlaggedTransactionSlaSweepRepository(prisma as never);

    const result = await repository.listFlaggedWithFlaggedAt('branch-1');

    expect(prisma.financialTransaction.findMany).toHaveBeenCalledWith({
      where: { branchId: 'branch-1', currentState: 'FLAGGED' },
      include: {
        events: {
          where: { toState: 'FLAGGED' },
          orderBy: { occurredAt: 'desc' },
          take: 1,
        },
      },
    });
    expect(result).toEqual([{ id: 'ft-1', sourceGroupId: 'bacenta-1', giverPersonId: null, flaggedAt }]);
  });
});
