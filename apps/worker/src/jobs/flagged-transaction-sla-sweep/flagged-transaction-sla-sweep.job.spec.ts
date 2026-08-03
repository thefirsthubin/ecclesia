import { FlaggedTransactionSlaSweepJob } from './flagged-transaction-sla-sweep.job';

describe('FlaggedTransactionSlaSweepJob', () => {
  function buildJob() {
    const repository = { listFlaggedWithFlaggedAt: jest.fn() };
    const branchDirectory = { listBranches: jest.fn() };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const publisher = { publish: jest.fn() };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const job = new FlaggedTransactionSlaSweepJob(repository as never, branchDirectory as never, prisma as never, publisher as never, logger as never);
    return { job, repository, branchDirectory, publisher };
  }

  it('publishes a synthetic signal for a transaction flagged past the SLA window, and never mutates it', async () => {
    const { job, repository, branchDirectory, publisher } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    const longAgo = new Date(Date.now() - 100 * 60 * 60 * 1000); // 100h ago, past the 72h default SLA
    repository.listFlaggedWithFlaggedAt.mockResolvedValue([
      { id: 'ft-1', sourceGroupId: 'bacenta-1', giverPersonId: null, flaggedAt: longAgo },
    ]);

    const breachedCount = await job.run();

    expect(breachedCount).toBe(1);
    expect(publisher.publish).toHaveBeenCalledTimes(1);
    const [envelope] = publisher.publish.mock.calls[0];
    expect(envelope).toMatchObject({
      eventType: 'stewardship.flagged_transaction_sla_breached',
      schemaVersion: 1,
      branchId: 'branch-1',
      subjectGroupId: 'bacenta-1',
      payload: {
        financialTransactionId: 'ft-1',
        flaggedAt: longAgo.toISOString(),
        slaHours: 72,
      },
    });
  });

  it('does not publish for a transaction flagged within the SLA window', async () => {
    const { job, repository, branchDirectory, publisher } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    const recently = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1h ago
    repository.listFlaggedWithFlaggedAt.mockResolvedValue([
      { id: 'ft-1', sourceGroupId: 'bacenta-1', giverPersonId: null, flaggedAt: recently },
    ]);

    const breachedCount = await job.run();

    expect(breachedCount).toBe(0);
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('sweeps every branch returned by listBranches()', async () => {
    const { job, repository, branchDirectory } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }, { id: 'branch-2' }]);
    repository.listFlaggedWithFlaggedAt.mockResolvedValue([]);

    await job.run();

    expect(repository.listFlaggedWithFlaggedAt).toHaveBeenCalledWith('branch-1');
    expect(repository.listFlaggedWithFlaggedAt).toHaveBeenCalledWith('branch-2');
  });
});
