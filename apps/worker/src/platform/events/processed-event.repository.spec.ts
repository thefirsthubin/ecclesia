import { Prisma } from '@prisma/client';

import { ProcessedEventRepository } from './processed-event.repository';

describe('ProcessedEventRepository', () => {
  function buildRepository() {
    const prisma = { processedEvent: { create: jest.fn() } };
    const repository = new ProcessedEventRepository(prisma as never);
    return { repository, prisma };
  }

  it('tryRecord() returns true when the insert succeeds (first delivery)', async () => {
    const { repository, prisma } = buildRepository();
    prisma.processedEvent.create.mockResolvedValue({ id: 'row-1' });

    const result = await repository.tryRecord('insights-consumer', 'event-1', 'branch-1');

    expect(result).toBe(true);
    expect(prisma.processedEvent.create).toHaveBeenCalledWith({
      data: { consumerName: 'insights-consumer', eventId: 'event-1', branchId: 'branch-1' },
    });
  });

  it('tryRecord() returns false on a unique-constraint violation (replay/duplicate delivery)', async () => {
    const { repository, prisma } = buildRepository();
    prisma.processedEvent.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: '5.20.0' }),
    );

    const result = await repository.tryRecord('insights-consumer', 'event-1', 'branch-1');

    expect(result).toBe(false);
  });

  it('tryRecord() rethrows any other error', async () => {
    const { repository, prisma } = buildRepository();
    prisma.processedEvent.create.mockRejectedValue(new Error('connection lost'));

    await expect(repository.tryRecord('insights-consumer', 'event-1', 'branch-1')).rejects.toThrow('connection lost');
  });
});
