import { PledgeReminderSweepJob } from './pledge-reminder-sweep.job';

describe('PledgeReminderSweepJob', () => {
  function buildJob() {
    const repository = { listReminderCandidates: jest.fn(), markReminderSent: jest.fn() };
    const branchDirectory = { listBranches: jest.fn() };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const publisher = { publish: jest.fn() };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const job = new PledgeReminderSweepJob(repository as never, branchDirectory as never, prisma as never, publisher as never, logger as never);
    return { job, repository, branchDirectory, publisher };
  }

  it('publishes a synthetic signal and marks reminderSentAt for each eligible Pledge', async () => {
    const { job, repository, branchDirectory, publisher } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    const pledgedAt = new Date('2026-07-01T00:00:00.000Z');
    repository.listReminderCandidates.mockResolvedValue([
      { id: 'pledge-1', projectId: 'project-1', personId: 'person-1', pledgedAmountMinor: 10000n, pledgedAt },
    ]);

    const remindedCount = await job.run();

    expect(remindedCount).toBe(1);
    expect(publisher.publish).toHaveBeenCalledTimes(1);
    const [envelope] = publisher.publish.mock.calls[0];
    expect(envelope).toMatchObject({
      eventType: 'stewardship.pledge_reminder_due',
      schemaVersion: 1,
      branchId: 'branch-1',
      subjectPersonId: 'person-1',
      payload: {
        pledgeId: 'pledge-1',
        projectId: 'project-1',
        pledgedAmountMinor: '10000',
        pledgedAt: pledgedAt.toISOString(),
      },
    });
    expect(repository.markReminderSent).toHaveBeenCalledWith('pledge-1', expect.any(Date));
  });

  it('does not publish or mutate anything when no Pledges are eligible', async () => {
    const { job, repository, branchDirectory, publisher } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.listReminderCandidates.mockResolvedValue([]);

    const remindedCount = await job.run();

    expect(remindedCount).toBe(0);
    expect(publisher.publish).not.toHaveBeenCalled();
    expect(repository.markReminderSent).not.toHaveBeenCalled();
  });

  it('sweeps every branch returned by listBranches(), using a lookback of DEFAULT_PLEDGE_REMINDER_DELAY_DAYS', async () => {
    const { job, repository, branchDirectory } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }, { id: 'branch-2' }]);
    repository.listReminderCandidates.mockResolvedValue([]);

    await job.run();

    expect(repository.listReminderCandidates).toHaveBeenCalledWith('branch-1', expect.any(Date));
    expect(repository.listReminderCandidates).toHaveBeenCalledWith('branch-2', expect.any(Date));
  });
});
