import { parseCommand, runCommand } from './command';
import { AuditConsumer } from './consumers/audit/audit.consumer';
import { InsightsConsumer } from './consumers/insights/insights.consumer';
import { NotificationConsumer } from './consumers/notification/notification.consumer';
import { AttendanceCompletenessSweepJob } from './jobs/attendance-completeness-sweep/attendance-completeness-sweep.job';
import { ChurchPulseRecomputeJob } from './jobs/church-pulse-recompute/church-pulse-recompute.job';
import { FlaggedTransactionSlaSweepJob } from './jobs/flagged-transaction-sla-sweep/flagged-transaction-sla-sweep.job';
import { FollowUpSlaSweepJob } from './jobs/follow-up-sla-sweep/follow-up-sla-sweep.job';
import { PledgeReminderSweepJob } from './jobs/pledge-reminder-sweep/pledge-reminder-sweep.job';
import { SilentDriftSweepJob } from './jobs/silent-drift-sweep/silent-drift-sweep.job';

describe('parseCommand()', () => {
  it.each([
    'consume:insights',
    'consume:notification',
    'consume:audit',
    'sweep:silent-drift',
    'sweep:church-pulse-recompute',
    'sweep:follow-up-sla',
    'sweep:attendance-completeness',
    'sweep:flagged-transaction-sla',
    'sweep:pledge-reminder',
  ] as const)('accepts %s', (command) => {
    expect(parseCommand(['node', 'main.js', command])).toBe(command);
  });

  it('throws on a missing command', () => {
    expect(() => parseCommand(['node', 'main.js'])).toThrow(/Unknown or missing worker command/);
  });

  it('throws on an unrecognized command', () => {
    expect(() => parseCommand(['node', 'main.js', 'not-a-real-command'])).toThrow(/Unknown or missing worker command/);
  });
});

describe('runCommand()', () => {
  function buildAppMock(token: unknown, resolved: unknown) {
    const log = jest.fn();
    const app = {
      get: jest.fn((requested: unknown) => (requested === token ? resolved : { log })),
    } as never;
    return { app, log };
  }

  describe('consume:* commands - resolve the consumer and call run() with an AbortSignal', () => {
    it.each([
      ['consume:insights', InsightsConsumer],
      ['consume:notification', NotificationConsumer],
      ['consume:audit', AuditConsumer],
    ] as const)('%s', async (command, consumerType) => {
      const run = jest.fn().mockResolvedValue(undefined);
      const { app } = buildAppMock(consumerType, { run });

      await runCommand(command, app);

      expect((app as { get: jest.Mock }).get).toHaveBeenCalledWith(consumerType);
      expect(run).toHaveBeenCalledWith(expect.any(AbortSignal));
    });
  });

  describe('sweep:* commands - resolve the job, call run() once, and log the result', () => {
    it.each([
      ['sweep:silent-drift', SilentDriftSweepJob, 3, 'flagged 3 Person(s)'],
      ['sweep:church-pulse-recompute', ChurchPulseRecomputeJob, 5, 'recomputed 5 scope(s)'],
      ['sweep:follow-up-sla', FollowUpSlaSweepJob, 2, 'signaled 2 breach(es)'],
      ['sweep:attendance-completeness', AttendanceCompletenessSweepJob, 1, 'signaled 1 incomplete Gathering(s)'],
      ['sweep:flagged-transaction-sla', FlaggedTransactionSlaSweepJob, 4, 'signaled 4 breach(es)'],
      ['sweep:pledge-reminder', PledgeReminderSweepJob, 6, 'signaled 6 reminder(s)'],
    ] as const)('%s', async (command, jobType, count, expectedLogFragment) => {
      const run = jest.fn().mockResolvedValue(count);
      const { app, log } = buildAppMock(jobType, { run });

      await runCommand(command, app);

      expect((app as { get: jest.Mock }).get).toHaveBeenCalledWith(jobType);
      expect(run).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith(expect.stringContaining(expectedLogFragment));
    });
  });
});
