import { SilentDriftSweepJob } from './silent-drift-sweep.job';

describe('SilentDriftSweepJob', () => {
  function buildJob() {
    const repository = {
      listBranches: jest.fn(),
      getThresholds: jest.fn(),
      listActiveBacentaMemberships: jest.fn(),
      listRecentMainServiceGatheringIds: jest.fn(),
      listRecentBacentaGatheringIds: jest.fn(),
      countPresentAttendance: jest.fn(),
      findOpenFlag: jest.fn(),
      createFlag: jest.fn(),
    };
    const publisher = { publish: jest.fn() };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const job = new SilentDriftSweepJob(repository as never, publisher as never, logger as never);
    return { job, repository, publisher };
  }

  it('flags a person who cleared attendance but missed Bacenta, writes the flag, and publishes a synthetic signal', async () => {
    const { job, repository, publisher } = buildJob();
    repository.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.getThresholds.mockResolvedValue({ n: 3, m: 3 });
    repository.listActiveBacentaMemberships.mockResolvedValue([{ personId: 'person-1', groupId: 'group-1' }]);
    repository.listRecentMainServiceGatheringIds.mockResolvedValue(['g-1', 'g-2', 'g-3']);
    repository.listRecentBacentaGatheringIds.mockResolvedValue(['b-1', 'b-2', 'b-3']);
    repository.countPresentAttendance.mockResolvedValueOnce(3).mockResolvedValueOnce(0);
    repository.findOpenFlag.mockResolvedValue(null);
    repository.createFlag.mockResolvedValue({
      id: 'flag-1',
      attendanceMissedCount: 0,
      attendanceThreshold: 3,
      bacentaMissedCount: 3,
      bacentaThreshold: 3,
    });

    const flaggedCount = await job.run();

    expect(flaggedCount).toBe(1);
    expect(repository.createFlag).toHaveBeenCalledWith({
      branchId: 'branch-1',
      groupId: 'group-1',
      personId: 'person-1',
      attendanceMissedCount: 0,
      attendanceThreshold: 3,
      bacentaMissedCount: 3,
      bacentaThreshold: 3,
    });
    expect(publisher.publish).toHaveBeenCalledTimes(1);
    const [envelope] = publisher.publish.mock.calls[0];
    expect(envelope).toMatchObject({
      eventType: 'pastoral_care.silent_drift_flagged',
      schemaVersion: 1,
      branchId: 'branch-1',
      subjectPersonId: 'person-1',
      subjectGroupId: 'group-1',
      payload: {
        silentDriftFlagId: 'flag-1',
        attendanceMissedCount: 0,
        attendanceThreshold: 3,
        bacentaMissedCount: 3,
        bacentaThreshold: 3,
      },
    });
    expect(typeof envelope.eventId).toBe('string');
  });

  it('does not create a duplicate flag or publish when an open flag already exists', async () => {
    const { job, repository, publisher } = buildJob();
    repository.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.getThresholds.mockResolvedValue({ n: 3, m: 3 });
    repository.listActiveBacentaMemberships.mockResolvedValue([{ personId: 'person-1', groupId: 'group-1' }]);
    repository.listRecentMainServiceGatheringIds.mockResolvedValue(['g-1', 'g-2', 'g-3']);
    repository.listRecentBacentaGatheringIds.mockResolvedValue(['b-1', 'b-2', 'b-3']);
    repository.countPresentAttendance.mockResolvedValueOnce(3).mockResolvedValueOnce(0);
    repository.findOpenFlag.mockResolvedValue({ id: 'existing-flag' });

    const flaggedCount = await job.run();

    expect(flaggedCount).toBe(0);
    expect(repository.createFlag).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('does not flag a person who is healthy on both counts', async () => {
    const { job, repository, publisher } = buildJob();
    repository.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.getThresholds.mockResolvedValue({ n: 3, m: 3 });
    repository.listActiveBacentaMemberships.mockResolvedValue([{ personId: 'person-1', groupId: 'group-1' }]);
    repository.listRecentMainServiceGatheringIds.mockResolvedValue(['g-1', 'g-2', 'g-3']);
    repository.listRecentBacentaGatheringIds.mockResolvedValue(['b-1', 'b-2', 'b-3']);
    repository.countPresentAttendance.mockResolvedValueOnce(3).mockResolvedValueOnce(3);

    const flaggedCount = await job.run();

    expect(flaggedCount).toBe(0);
    expect(repository.findOpenFlag).not.toHaveBeenCalled();
    expect(repository.createFlag).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('sweeps every branch returned by listBranches()', async () => {
    const { job, repository } = buildJob();
    repository.listBranches.mockResolvedValue([{ id: 'branch-1' }, { id: 'branch-2' }]);
    repository.getThresholds.mockResolvedValue({ n: 3, m: 3 });
    repository.listActiveBacentaMemberships.mockResolvedValue([]);
    repository.listRecentMainServiceGatheringIds.mockResolvedValue([]);

    await job.run();

    expect(repository.listActiveBacentaMemberships).toHaveBeenCalledWith('branch-1');
    expect(repository.listActiveBacentaMemberships).toHaveBeenCalledWith('branch-2');
  });
});
