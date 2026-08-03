import { AttendanceCompletenessSweepJob } from './attendance-completeness-sweep.job';

describe('AttendanceCompletenessSweepJob', () => {
  function buildJob() {
    const repository = { listRecentlyEndedGatherings: jest.fn(), hasAttendanceRecorded: jest.fn() };
    const branchDirectory = { listBranches: jest.fn() };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const publisher = { publish: jest.fn() };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const job = new AttendanceCompletenessSweepJob(
      repository as never,
      branchDirectory as never,
      prisma as never,
      publisher as never,
      logger as never,
    );
    return { job, repository, branchDirectory, publisher };
  }

  it('publishes a synthetic signal for a Gathering past its completeness window with no attendance', async () => {
    const { job, repository, branchDirectory, publisher } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.listRecentlyEndedGatherings.mockResolvedValue([
      { id: 'gathering-1', branchId: 'branch-1', ownerGroupId: 'group-1', scheduledEnd: new Date('2026-07-25T00:00:00.000Z') },
    ]);
    repository.hasAttendanceRecorded.mockResolvedValue(false);

    const incompleteCount = await job.run();

    expect(incompleteCount).toBe(1);
    expect(publisher.publish).toHaveBeenCalledTimes(1);
    const [envelope] = publisher.publish.mock.calls[0];
    expect(envelope).toMatchObject({
      eventType: 'gatherings.attendance_incomplete',
      schemaVersion: 1,
      branchId: 'branch-1',
      subjectGroupId: 'group-1',
      payload: { gatheringId: 'gathering-1', scheduledEnd: '2026-07-25T00:00:00.000Z' },
    });
  });

  it('does not publish when attendance has already been recorded', async () => {
    const { job, repository, branchDirectory, publisher } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.listRecentlyEndedGatherings.mockResolvedValue([
      { id: 'gathering-1', branchId: 'branch-1', ownerGroupId: null, scheduledEnd: new Date('2026-07-25T00:00:00.000Z') },
    ]);
    repository.hasAttendanceRecorded.mockResolvedValue(true);

    const incompleteCount = await job.run();

    expect(incompleteCount).toBe(0);
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('does not publish for a Gathering still within its completeness window', async () => {
    const { job, repository, branchDirectory, publisher } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.listRecentlyEndedGatherings.mockResolvedValue([
      { id: 'gathering-1', branchId: 'branch-1', ownerGroupId: null, scheduledEnd: new Date(Date.now() - 60 * 60 * 1000) },
    ]);
    repository.hasAttendanceRecorded.mockResolvedValue(false);

    const incompleteCount = await job.run();

    expect(incompleteCount).toBe(0);
    expect(publisher.publish).not.toHaveBeenCalled();
  });
});
