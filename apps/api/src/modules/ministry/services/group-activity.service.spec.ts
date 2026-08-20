import { GroupActivityService } from './group-activity.service';

describe('[Post-Milestone D — Portal Experiences follow-up] GroupActivityService', () => {
  function buildService() {
    const groupMembershipService = { listRecentByGroup: jest.fn().mockResolvedValue([]) };
    const gatheringScopeService = { listGatheringsForGroup: jest.fn().mockResolvedValue([]) };
    const staffingTargetRepository = { listByGroupWithCreatedInRange: jest.fn().mockResolvedValue([]) };
    const service = new GroupActivityService(groupMembershipService as never, gatheringScopeService as never, staffingTargetRepository as never);
    return { service, groupMembershipService, gatheringScopeService, staffingTargetRepository };
  }

  const from = new Date('2026-08-01T00:00:00.000Z');
  const to = new Date('2026-08-31T00:00:00.000Z');

  it('fetches all three sources for the given group and window', async () => {
    const { service, groupMembershipService, gatheringScopeService, staffingTargetRepository } = buildService();

    await service.getActivity('group-1', from, to);

    expect(groupMembershipService.listRecentByGroup).toHaveBeenCalledWith('group-1', from, to);
    expect(gatheringScopeService.listGatheringsForGroup).toHaveBeenCalledWith('group-1', from, to);
    expect(staffingTargetRepository.listByGroupWithCreatedInRange).toHaveBeenCalledWith('group-1', from, to);
  });

  it('maps membership changes, gatherings, and staffing target changes into the response shape', async () => {
    const { service, groupMembershipService, gatheringScopeService, staffingTargetRepository } = buildService();
    groupMembershipService.listRecentByGroup.mockResolvedValue([
      { personId: 'person-1', startedAt: new Date('2026-08-05T00:00:00.000Z'), endedAt: null, reason: null },
      { personId: 'person-2', startedAt: new Date('2026-08-02T00:00:00.000Z'), endedAt: new Date('2026-08-10T00:00:00.000Z'), reason: 'moved house' },
    ]);
    gatheringScopeService.listGatheringsForGroup.mockResolvedValue([
      { id: 'gathering-1', type: 'BASONTA_MEETING', scheduledStart: new Date('2026-08-03T09:00:00.000Z') },
    ]);
    staffingTargetRepository.listByGroupWithCreatedInRange.mockResolvedValue([
      { id: 'target-1', gatheringId: 'gathering-1', targetCount: 10, createdAt: new Date('2026-08-04T00:00:00.000Z') },
    ]);

    const result = await service.getActivity('group-1', from, to);

    expect(result).toEqual({
      from: from.toISOString(),
      to: to.toISOString(),
      membershipChanges: [
        { personId: 'person-1', startedAt: '2026-08-05T00:00:00.000Z', endedAt: null, reason: null },
        { personId: 'person-2', startedAt: '2026-08-02T00:00:00.000Z', endedAt: '2026-08-10T00:00:00.000Z', reason: 'moved house' },
      ],
      staffingTargetChanges: [{ id: 'target-1', gatheringId: 'gathering-1', targetCount: 10, createdAt: '2026-08-04T00:00:00.000Z' }],
      gatherings: [{ id: 'gathering-1', type: 'BASONTA_MEETING', scheduledStart: '2026-08-03T09:00:00.000Z' }],
    });
  });
});
