import type { ActorContext } from '@ecclesia/rbac';

import { AttendanceTrendService } from './attendance-trend.service';

function row(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'ar-1',
    recordedAt: new Date('2026-08-10T00:00:00.000Z'),
    gatheringId: 'gathering-1',
    gathering: { ownerGroupId: null, type: 'Sunday Service' },
    ...overrides,
  };
}

describe('[Milestone C] AttendanceTrendService', () => {
  function buildService() {
    const attendanceRecordService = { listPresentForTrend: jest.fn().mockResolvedValue([]) };
    const gatheringTypeCategoryService = { typesForCategory: jest.fn() };
    const groupMembershipService = { listActivePersonIdsForGroups: jest.fn().mockResolvedValue([]) };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const service = new AttendanceTrendService(
      attendanceRecordService as never,
      gatheringTypeCategoryService as never,
      groupMembershipService as never,
      prisma as never,
    );
    return { service, attendanceRecordService, gatheringTypeCategoryService, groupMembershipService, prisma };
  }

  const branchActor: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };

  it('buckets present rows by recordedAt', async () => {
    const { service, attendanceRecordService } = buildService();
    attendanceRecordService.listPresentForTrend.mockResolvedValue([
      row({ recordedAt: new Date('2026-06-15T00:00:00.000Z') }),
      row({ recordedAt: new Date('2026-08-15T00:00:00.000Z') }),
      row({ recordedAt: new Date('2026-08-16T00:00:00.000Z') }),
    ]);

    const result = await service.getTrend(branchActor, {
      granularity: 'month',
      count: 3,
      endingAt: '2026-08-17T00:00:00.000Z',
      council: false,
    } as never);

    if (!('buckets' in result)) throw new Error('expected a single-branch result');
    expect(result.buckets.map((b) => b.presentCount)).toEqual([1, 0, 2]);
  });

  it('groups by owning Group for byGroup, excluding rows with no ownerGroupId (Branch-wide gatherings)', async () => {
    const { service, attendanceRecordService } = buildService();
    attendanceRecordService.listPresentForTrend.mockResolvedValue([
      row({ gathering: { ownerGroupId: 'bacenta-1', type: 'Bacenta Meeting' } }),
      row({ gathering: { ownerGroupId: 'bacenta-1', type: 'Bacenta Meeting' } }),
      row({ gathering: { ownerGroupId: null, type: 'Sunday Service' } }),
    ]);

    const result = await service.getTrend(branchActor, { granularity: 'month', count: 1, council: false } as never);

    if (!('byGroup' in result)) throw new Error('expected a single-branch result');
    expect(result.byGroup).toEqual([{ groupId: 'bacenta-1', presentCount: 2 }]);
  });

  it('[gatheringCategory filter] only includes rows whose Gathering.type is mapped to the requested category, reporting unmapped types', async () => {
    const { service, attendanceRecordService, gatheringTypeCategoryService } = buildService();
    gatheringTypeCategoryService.typesForCategory.mockResolvedValue(['Sunday Service']);
    attendanceRecordService.listPresentForTrend.mockResolvedValue([
      row({ gathering: { ownerGroupId: null, type: 'Sunday Service' } }),
      row({ gathering: { ownerGroupId: null, type: 'Wednesday Bible Study' } }),
    ]);

    const result = await service.getTrend(branchActor, { granularity: 'month', count: 1, gatheringCategory: 'SUNDAY', council: false } as never);

    if (!('buckets' in result)) throw new Error('expected a single-branch result');
    expect(result.buckets[0].presentCount).toBe(1);
    expect(result.unmappedGatheringTypes).toEqual(['Wednesday Bible Study']);
  });

  it('narrows to the actor\'s own single group for an OWN_GROUP-scoped actor', async () => {
    const { service, attendanceRecordService, groupMembershipService } = buildService();
    const bacentaLeader: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };
    groupMembershipService.listActivePersonIdsForGroups.mockResolvedValue(['person-1', 'person-2']);

    await service.getTrend(bacentaLeader, { granularity: 'month', count: 1, council: false } as never);

    expect(groupMembershipService.listActivePersonIdsForGroups).toHaveBeenCalledWith(['bacenta-1']);
    expect(attendanceRecordService.listPresentForTrend).toHaveBeenCalledWith(
      'branch-1',
      expect.any(Date),
      expect.any(Date),
      undefined,
      ['bacenta-1'],
      ['person-1', 'person-2'],
    );
  });

  it('[C.1.4 - Attendance Scope Correction] a Branch-wide service attended by a member of the actor\'s own scope counts toward a cluster-scoped result', async () => {
    const { service, attendanceRecordService, groupMembershipService } = buildService();
    const assistantPastor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1', clusterBacentaIds: ['bacenta-1', 'bacenta-2'] };
    groupMembershipService.listActivePersonIdsForGroups.mockResolvedValue(['person-1']);
    // Simulates the repository already having applied the OR(ownerGroupId, personId)
    // filter - this row is a Branch-wide Sunday service (ownerGroupId: null)
    // attended by person-1, one of the cluster's own members.
    attendanceRecordService.listPresentForTrend.mockResolvedValue([
      row({ gathering: { ownerGroupId: null, type: 'Sunday Service' } }),
    ]);

    const result = await service.getTrend(assistantPastor, { granularity: 'month', count: 1, endingAt: '2026-08-17T00:00:00.000Z', council: false } as never);

    expect(groupMembershipService.listActivePersonIdsForGroups).toHaveBeenCalledWith(['bacenta-1', 'bacenta-2']);
    expect(attendanceRecordService.listPresentForTrend).toHaveBeenCalledWith(
      'branch-1',
      expect.any(Date),
      expect.any(Date),
      undefined,
      ['bacenta-1', 'bacenta-2'],
      ['person-1'],
    );
    if (!('buckets' in result)) throw new Error('expected a single-branch result');
    expect(result.buckets[0].presentCount).toBe(1);
  });

  it('does not resolve a roster at all for a BRANCH-scoped actor (no groupIds to narrow by)', async () => {
    const { service, groupMembershipService } = buildService();

    await service.getTrend(branchActor, { granularity: 'month', count: 1, council: false } as never);

    expect(groupMembershipService.listActivePersonIdsForGroups).not.toHaveBeenCalled();
  });

  it('[Council] loops across every Branch in the actor\'s Council', async () => {
    const { service, attendanceRecordService, prisma } = buildService();
    const residentPastor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1', councilBranchIds: ['branch-1', 'branch-2'] };
    attendanceRecordService.listPresentForTrend.mockResolvedValue([]);

    const result = await service.getTrend(residentPastor, { granularity: 'month', count: 1, council: true } as never);

    expect(prisma.runInBranchScope).toHaveBeenCalledTimes(2);
    if (!('councilBranches' in result)) throw new Error('expected a council result');
    expect(result.councilBranches.map((b) => b.branchId)).toEqual(['branch-1', 'branch-2']);
  });

  it('rejects a Council-scoped request from an actor with no councilBranchIds', async () => {
    const { service } = buildService();

    await expect(service.getTrend(branchActor, { granularity: 'month', count: 1, council: true } as never)).rejects.toThrow();
  });
});
