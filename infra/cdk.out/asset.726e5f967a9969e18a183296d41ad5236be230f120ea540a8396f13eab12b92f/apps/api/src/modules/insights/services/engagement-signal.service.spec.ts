import { EngagementSignalService } from './engagement-signal.service';

describe('EngagementSignalService', () => {
  function buildService() {
    const engagementSignalRepository = { create: jest.fn() };
    const service = new EngagementSignalService(engagementSignalRepository as never);
    return { service, engagementSignalRepository };
  }

  it('record() converts occurredAt to a Date and passes payload/personId/groupId through', async () => {
    const { service, engagementSignalRepository } = buildService();
    engagementSignalRepository.create.mockResolvedValue({ id: 'signal-1' });

    await service.record({
      branchId: 'branch-1',
      personId: 'person-1',
      groupId: 'group-1',
      signalType: 'ATTENDANCE',
      payload: { gatheringId: 'gathering-1' },
      occurredAt: '2026-08-01T00:00:00.000Z',
    });

    expect(engagementSignalRepository.create).toHaveBeenCalledWith({
      branchId: 'branch-1',
      personId: 'person-1',
      groupId: 'group-1',
      signalType: 'ATTENDANCE',
      payload: { gatheringId: 'gathering-1' },
      occurredAt: new Date('2026-08-01T00:00:00.000Z'),
    });
  });
});
