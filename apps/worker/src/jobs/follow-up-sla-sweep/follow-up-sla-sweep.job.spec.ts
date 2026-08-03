import { FollowUpSlaSweepJob } from './follow-up-sla-sweep.job';

describe('FollowUpSlaSweepJob', () => {
  function buildJob() {
    const repository = { listOpenTasksWithDueDate: jest.fn() };
    const branchDirectory = { listBranches: jest.fn() };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const publisher = { publish: jest.fn() };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const job = new FollowUpSlaSweepJob(repository as never, branchDirectory as never, prisma as never, publisher as never, logger as never);
    return { job, repository, branchDirectory, publisher };
  }

  it('publishes a synthetic signal for a task past its dueAt, and never mutates the task', async () => {
    const { job, repository, branchDirectory, publisher } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.listOpenTasksWithDueDate.mockResolvedValue([
      {
        id: 'task-1',
        branchId: 'branch-1',
        personId: 'person-1',
        groupId: 'group-1',
        assignedToPersonId: 'shepherd-1',
        status: 'OPEN',
        dueAt: new Date('2026-07-01T00:00:00.000Z'),
      },
    ]);

    const breachedCount = await job.run();

    expect(breachedCount).toBe(1);
    expect(publisher.publish).toHaveBeenCalledTimes(1);
    const [envelope] = publisher.publish.mock.calls[0];
    expect(envelope).toMatchObject({
      eventType: 'pastoral_care.follow_up_task_sla_breached',
      schemaVersion: 1,
      branchId: 'branch-1',
      subjectPersonId: 'person-1',
      subjectGroupId: 'group-1',
      payload: {
        followUpTaskId: 'task-1',
        assignedToPersonId: 'shepherd-1',
        dueAt: '2026-07-01T00:00:00.000Z',
      },
    });
  });

  it('does not publish for a task not yet past its dueAt', async () => {
    const { job, repository, branchDirectory, publisher } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    repository.listOpenTasksWithDueDate.mockResolvedValue([
      { id: 'task-1', branchId: 'branch-1', personId: 'person-1', groupId: null, assignedToPersonId: 'shepherd-1', status: 'OPEN', dueAt: farFuture },
    ]);

    const breachedCount = await job.run();

    expect(breachedCount).toBe(0);
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('sweeps every branch returned by listBranches()', async () => {
    const { job, repository, branchDirectory } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }, { id: 'branch-2' }]);
    repository.listOpenTasksWithDueDate.mockResolvedValue([]);

    await job.run();

    expect(repository.listOpenTasksWithDueDate).toHaveBeenCalledWith('branch-1');
    expect(repository.listOpenTasksWithDueDate).toHaveBeenCalledWith('branch-2');
  });
});
