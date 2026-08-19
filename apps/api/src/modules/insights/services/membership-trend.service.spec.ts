import type { ActorContext } from '@ecclesia/rbac';

import { MembershipTrendService } from './membership-trend.service';

const NOW = new Date('2026-08-17T00:00:00.000Z');

describe('[Milestone C] MembershipTrendService', () => {
  function buildService() {
    const personService = {
      countByBranch: jest.fn().mockResolvedValue(0),
      countByBranchAndLifecycleStage: jest.fn().mockResolvedValue(0),
      countByBranchCreatedBefore: jest.fn().mockResolvedValue(0),
      countWithoutActiveBacenta: jest.fn().mockResolvedValue(0),
      findIdsByBranchAndLifecycleStage: jest.fn().mockResolvedValue([]),
      getByIds: jest.fn().mockResolvedValue([]),
    };
    const groupMembershipService = {
      listActivePersonIdsForGroups: jest.fn().mockResolvedValue([]),
      countDistinctActiveByGroupType: jest.fn().mockResolvedValue(0),
    };
    const attendanceRecordService = { listDistinctPresentPersonIds: jest.fn().mockResolvedValue([]) };
    const gatheringTypeCategoryService = { typesForCategory: jest.fn().mockResolvedValue(['Sunday Service']) };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const service = new MembershipTrendService(
      personService as never,
      groupMembershipService as never,
      attendanceRecordService as never,
      gatheringTypeCategoryService as never,
      prisma as never,
    );
    return { service, personService, groupMembershipService, attendanceRecordService, gatheringTypeCategoryService, prisma };
  }

  const branchActor: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };

  it('[Phase 1 decision #2] activeMembersCount is the intersection of MEMBER-lifecycle ids and Sunday-present ids; inactiveMembersCount is the complement within MEMBER', async () => {
    const { service, personService, attendanceRecordService } = buildService();
    personService.countByBranchAndLifecycleStage.mockImplementation((_branchId: string, stage: string) => (stage === 'MEMBER' ? 5 : 0));
    personService.findIdsByBranchAndLifecycleStage.mockImplementation((_branchId: string, stage: string) =>
      stage === 'MEMBER' ? ['m1', 'm2', 'm3', 'm4', 'm5'] : [],
    );
    attendanceRecordService.listDistinctPresentPersonIds.mockResolvedValue(['m1', 'm2']);

    const result = await service.getTrend(branchActor, { granularity: 'month', count: 1, endingAt: NOW.toISOString(), council: false } as never);

    if (!('snapshot' in result)) throw new Error('expected a single-branch result');
    expect(result.snapshot.membersCount).toBe(5);
    expect(result.snapshot.activeMembersCount).toBe(2);
    expect(result.snapshot.inactiveMembersCount).toBe(3);
    expect(result.snapshot.activeMemberWindowWeeks).toBe(8);
  });

  it('queries the trailing 8-week window ending "now" for Sunday attendance', async () => {
    const { service, attendanceRecordService } = buildService();

    await service.getTrend(branchActor, { granularity: 'month', count: 1, endingAt: NOW.toISOString(), council: false } as never);

    const [, from, to] = attendanceRecordService.listDistinctPresentPersonIds.mock.calls[0];
    expect((to.getTime() - from.getTime()) / (7 * 24 * 60 * 60 * 1000)).toBeCloseTo(8, 5);
  });

  it('never queries attendance at all when the Branch has no SUNDAY-mapped gathering types (never guesses)', async () => {
    const { service, attendanceRecordService, gatheringTypeCategoryService } = buildService();
    gatheringTypeCategoryService.typesForCategory.mockResolvedValue([]);

    const result = await service.getTrend(branchActor, { granularity: 'month', count: 1, council: false } as never);

    expect(attendanceRecordService.listDistinctPresentPersonIds).not.toHaveBeenCalled();
    if (!('snapshot' in result)) throw new Error('expected a single-branch result');
    expect(result.snapshot.activeMembersCount).toBe(0);
  });

  it('[group-scoped] narrows registeredPeopleCount/membersCount/activeMembersCount to the group\'s own current roster', async () => {
    const { service, personService, groupMembershipService, attendanceRecordService } = buildService();
    groupMembershipService.listActivePersonIdsForGroups.mockResolvedValue(['p1', 'p2', 'p3']);
    personService.findIdsByBranchAndLifecycleStage.mockImplementation((_branchId: string, stage: string) =>
      stage === 'MEMBER' ? ['p1', 'p2', 'other-branch-member'] : [],
    );
    attendanceRecordService.listDistinctPresentPersonIds.mockResolvedValue(['p1']);
    const bacentaLeader: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };

    const result = await service.getTrend(bacentaLeader, { granularity: 'month', count: 1, council: false } as never);

    if (!('snapshot' in result)) throw new Error('expected a single-branch result');
    expect(result.snapshot.registeredPeopleCount).toBe(3);
    // Only p1/p2 are both in-roster AND MEMBER - "other-branch-member" is excluded.
    expect(result.snapshot.membersCount).toBe(2);
    expect(result.snapshot.activeMembersCount).toBe(1);
    // Not meaningful once scoped to one Bacenta's own roster.
    expect(result.snapshot.peopleWithoutBacentaCount).toBe(0);
  });

  it('[Council] loops across every Branch in the actor\'s Council', async () => {
    const { service, prisma } = buildService();
    const residentPastor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1', councilBranchIds: ['branch-1', 'branch-2'] };

    const result = await service.getTrend(residentPastor, { granularity: 'month', count: 1, council: true } as never);

    expect(prisma.runInBranchScope).toHaveBeenCalledTimes(2);
    if (!('councilBranches' in result)) throw new Error('expected a council result');
    expect(result.councilBranches.map((b) => b.branchId)).toEqual(['branch-1', 'branch-2']);
  });

  it('rejects a Council-scoped request from an actor with no councilBranchIds', async () => {
    const { service } = buildService();

    await expect(service.getTrend(branchActor, { granularity: 'month', count: 1, council: true } as never)).rejects.toThrow();
  });

  it('the cumulative series is honest as-of-each-bucket-end (registeredPeopleSeries never exceeds the current total)', async () => {
    const { service, personService } = buildService();
    personService.countByBranchCreatedBefore.mockImplementation((_branchId: string, cutoff: Date) =>
      cutoff.getTime() <= new Date('2026-08-01T00:00:00.000Z').getTime() ? 10 : 15,
    );
    personService.countByBranch.mockResolvedValue(15);

    const result = await service.getTrend(branchActor, {
      granularity: 'month',
      count: 2,
      endingAt: '2026-08-17T00:00:00.000Z',
      council: false,
    } as never);

    if (!('registeredPeopleSeries' in result)) throw new Error('expected a single-branch result');
    expect(result.registeredPeopleSeries.map((p) => p.value)).toEqual([10, 15]);
  });
});
