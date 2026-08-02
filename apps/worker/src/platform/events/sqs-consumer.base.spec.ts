import type { EngagementSignalEnvelope } from '@ecclesia/contracts';

import { SqsConsumerBase } from './sqs-consumer.base';

class TestConsumer extends SqsConsumerBase {
  handled: EngagementSignalEnvelope[] = [];
  shouldThrow = false;

  constructor(sqsClient: unknown, processedEventRepository: unknown, logger: unknown) {
    super(sqsClient as never, 'https://sqs.example/queue', 'test-consumer', processedEventRepository as never, logger as never);
  }

  protected async handle(envelope: EngagementSignalEnvelope): Promise<void> {
    if (this.shouldThrow) {
      throw new Error('handler failed');
    }
    this.handled.push(envelope);
  }
}

describe('SqsConsumerBase', () => {
  const validEnvelope: EngagementSignalEnvelope = {
    eventId: '11111111-1111-1111-1111-111111111111',
    eventType: 'pastoral_care.silent_drift_flagged',
    schemaVersion: 1,
    branchId: '22222222-2222-2222-2222-222222222222',
    occurredAt: '2026-08-01T00:00:00.000Z',
    payload: {},
  };

  function buildConsumer() {
    const sqsClient = { send: jest.fn() };
    const processedEventRepository = { tryRecord: jest.fn() };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const consumer = new TestConsumer(sqsClient, processedEventRepository, logger);
    return { consumer, sqsClient, processedEventRepository, logger };
  }

  it('pollOnce() processes a valid, new message and deletes it', async () => {
    const { consumer, sqsClient, processedEventRepository } = buildConsumer();
    sqsClient.send
      .mockResolvedValueOnce({
        Messages: [{ Body: JSON.stringify(validEnvelope), ReceiptHandle: 'receipt-1' }],
      })
      .mockResolvedValueOnce({});
    processedEventRepository.tryRecord.mockResolvedValue(true);

    const count = await consumer.pollOnce();

    expect(count).toBe(1);
    expect(consumer.handled).toEqual([validEnvelope]);
    expect(processedEventRepository.tryRecord).toHaveBeenCalledWith('test-consumer', validEnvelope.eventId, validEnvelope.branchId);
    expect(sqsClient.send).toHaveBeenCalledTimes(2);
  });

  it('pollOnce() skips handle() and still deletes on a duplicate delivery', async () => {
    const { consumer, sqsClient, processedEventRepository } = buildConsumer();
    sqsClient.send
      .mockResolvedValueOnce({
        Messages: [{ Body: JSON.stringify(validEnvelope), ReceiptHandle: 'receipt-1' }],
      })
      .mockResolvedValueOnce({});
    processedEventRepository.tryRecord.mockResolvedValue(false);

    await consumer.pollOnce();

    expect(consumer.handled).toEqual([]);
    expect(sqsClient.send).toHaveBeenCalledTimes(2);
  });

  it('pollOnce() deletes a malformed message without calling handle() or the idempotency check', async () => {
    const { consumer, sqsClient, processedEventRepository } = buildConsumer();
    sqsClient.send
      .mockResolvedValueOnce({
        Messages: [{ Body: JSON.stringify({ not: 'an envelope' }), ReceiptHandle: 'receipt-1' }],
      })
      .mockResolvedValueOnce({});

    await consumer.pollOnce();

    expect(consumer.handled).toEqual([]);
    expect(processedEventRepository.tryRecord).not.toHaveBeenCalled();
    expect(sqsClient.send).toHaveBeenCalledTimes(2);
  });

  it('pollOnce() does not delete the message when handle() throws (left for SQS redelivery)', async () => {
    const { consumer, sqsClient, processedEventRepository } = buildConsumer();
    consumer.shouldThrow = true;
    sqsClient.send.mockResolvedValueOnce({
      Messages: [{ Body: JSON.stringify(validEnvelope), ReceiptHandle: 'receipt-1' }],
    });
    processedEventRepository.tryRecord.mockResolvedValue(true);

    await consumer.pollOnce();

    expect(sqsClient.send).toHaveBeenCalledTimes(1);
  });

  it('pollOnce() returns 0 on an empty poll', async () => {
    const { consumer, sqsClient } = buildConsumer();
    sqsClient.send.mockResolvedValueOnce({ Messages: [] });

    const count = await consumer.pollOnce();

    expect(count).toBe(0);
  });
});
