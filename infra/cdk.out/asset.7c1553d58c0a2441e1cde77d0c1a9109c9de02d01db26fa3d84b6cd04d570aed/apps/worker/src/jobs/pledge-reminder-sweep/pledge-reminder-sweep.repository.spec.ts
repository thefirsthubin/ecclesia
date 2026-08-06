import { PledgeReminderSweepRepository } from './pledge-reminder-sweep.repository';

describe('PledgeReminderSweepRepository', () => {
  it('listReminderCandidates() filters to opted-in, not-yet-reminded, unfulfilled Pledges older than the given date', async () => {
    const prisma = { pledge: { findMany: jest.fn().mockResolvedValue([]) } };
    const repository = new PledgeReminderSweepRepository(prisma as never);
    const olderThan = new Date('2026-07-18T00:00:00.000Z');

    await repository.listReminderCandidates('branch-1', olderThan);

    expect(prisma.pledge.findMany).toHaveBeenCalledWith({
      where: {
        branchId: 'branch-1',
        reminderOptIn: true,
        reminderSentAt: null,
        fulfilledTransactionId: null,
        pledgedAt: { lte: olderThan },
      },
    });
  });

  it('markReminderSent() sets reminderSentAt on the Pledge', async () => {
    const prisma = { pledge: { update: jest.fn().mockResolvedValue({ id: 'pledge-1' }) } };
    const repository = new PledgeReminderSweepRepository(prisma as never);
    const sentAt = new Date('2026-08-01T00:00:00.000Z');

    const result = await repository.markReminderSent('pledge-1', sentAt);

    expect(prisma.pledge.update).toHaveBeenCalledWith({
      where: { id: 'pledge-1' },
      data: { reminderSentAt: sentAt },
    });
    expect(result).toEqual({ id: 'pledge-1' });
  });
});
