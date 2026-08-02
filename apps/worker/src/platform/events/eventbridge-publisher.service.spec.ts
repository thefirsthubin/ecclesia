import type { EngagementSignalEnvelope } from '@ecclesia/contracts';

import { EventBridgePublisherService } from './eventbridge-publisher.service';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-eventbridge', () => ({
  EventBridgeClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PutEventsCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

describe('EventBridgePublisherService', () => {
  const envelope: EngagementSignalEnvelope = {
    eventId: '11111111-1111-1111-1111-111111111111',
    eventType: 'pastoral_care.silent_drift_flagged',
    schemaVersion: 1,
    branchId: '22222222-2222-2222-2222-222222222222',
    occurredAt: '2026-08-01T00:00:00.000Z',
    payload: { reason: 'no attendance in N weeks' },
  };

  function buildService() {
    const configService = {
      get: jest.fn((key: string) => (key === 'AWS_REGION' ? 'us-east-1' : 'ecclesia-engagement-signals')),
    };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const service = new EventBridgePublisherService(configService as never, logger as never);
    return { service, logger };
  }

  beforeEach(() => {
    mockSend.mockReset();
  });

  it('publish() sends a PutEvents entry shaped from the envelope and logs success', async () => {
    mockSend.mockResolvedValue({ FailedEntryCount: 0 });
    const { service, logger } = buildService();

    await service.publish(envelope);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const [command] = mockSend.mock.calls[0];
    expect(command.input.Entries[0]).toEqual({
      EventBusName: 'ecclesia-engagement-signals',
      Source: 'ecclesia.worker',
      DetailType: envelope.eventType,
      Detail: JSON.stringify(envelope),
    });
    expect(logger.info).toHaveBeenCalled();
  });

  it('publish() throws when EventBridge reports a failed entry', async () => {
    mockSend.mockResolvedValue({
      FailedEntryCount: 1,
      Entries: [{ ErrorCode: 'InternalFailure', ErrorMessage: 'boom' }],
    });
    const { service } = buildService();

    await expect(service.publish(envelope)).rejects.toThrow(/InternalFailure/);
  });
});
