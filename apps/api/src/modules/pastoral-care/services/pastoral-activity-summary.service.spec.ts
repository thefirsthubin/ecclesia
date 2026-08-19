import type { ActorContext } from '@ecclesia/rbac';

import { PastoralActivitySummaryService } from './pastoral-activity-summary.service';

const NOW = new Date('2026-08-18T00:00:00.000Z');
const PAST = new Date('2026-08-01T00:00:00.000Z');
const FUTURE = new Date('2026-09-01T00:00:00.000Z');

function followUpTask(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'ft-1',
    branchId: 'branch-1',
    groupId: 'bacenta-1',
    personId: 'person-1',
    assignedToPersonId: 'shepherd-1',
    status: 'OPEN',
    priority: 'MEDIUM',
    description: 'missed three Sundays - sensitive operational note',
    dueAt: FUTURE,
    trigger: 'FIRST_TIME_GUEST',
    escalatedAt: null,
    escalatedToPersonId: null,
    completedAt: null,
    createdByPersonId: 'shepherd-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function counsellingSession(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'cs-1',
    branchId: 'branch-1',
    personId: 'person-1',
    counsellorPersonId: 'pastor-1',
    scheduledAt: NOW,
    status: 'SCHEDULED',
    briefNote: 'confidential counselling detail',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function memberInteraction(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'mi-1',
    branchId: 'branch-1',
    personId: 'person-1',
    pastorPersonId: 'pastor-1',
    type: 'CALL',
    occurredAt: NOW,
    scheduledAt: NOW,
    briefNote: 'confidential interaction detail',
    createdAt: NOW,
    ...overrides,
  };
}

describe('[Milestone C.1.3] PastoralActivitySummaryService', () => {
  const actor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
  const from = new Date('2026-08-01T00:00:00.000Z');
  const to = new Date('2026-08-31T00:00:00.000Z');

  function buildService() {
    const followUpTaskRepository = {
      listByBranch: jest.fn().mockResolvedValue([]),
      listByGroups: jest.fn().mockResolvedValue([]),
    };
    const counsellingSessionRepository = {
      listScheduledInRange: jest.fn().mockResolvedValue([]),
      listScheduledInRangeForPersons: jest.fn().mockResolvedValue([]),
    };
    const memberInteractionRepository = {
      listScheduledInRange: jest.fn().mockResolvedValue([]),
      listScheduledInRangeForPersons: jest.fn().mockResolvedValue([]),
    };
    const groupMembershipService = { listActivePersonIdsForGroups: jest.fn().mockResolvedValue([]) };
    const service = new PastoralActivitySummaryService(
      followUpTaskRepository as never,
      counsellingSessionRepository as never,
      memberInteractionRepository as never,
      groupMembershipService as never,
    );
    return { service, followUpTaskRepository, counsellingSessionRepository, memberInteractionRepository, groupMembershipService };
  }

  describe('scope resolution', () => {
    it('queries FollowUpTask across all five statuses via listByBranch, and CounsellingSession/MemberInteraction windowed by from/to, for a BRANCH-scoped actor', async () => {
      const { service, followUpTaskRepository, counsellingSessionRepository, memberInteractionRepository } = buildService();

      await service.getSummary(actor, from, to);

      expect(followUpTaskRepository.listByBranch).toHaveBeenCalledWith('branch-1', ['OPEN', 'IN_PROGRESS', 'ESCALATED', 'COMPLETED', 'CANCELLED']);
      expect(counsellingSessionRepository.listScheduledInRange).toHaveBeenCalledWith('branch-1', from, to);
      expect(memberInteractionRepository.listScheduledInRange).toHaveBeenCalledWith('branch-1', from, to);
    });

    it('narrows to the actor\'s own cluster for a CLUSTER-scoped actor, never the whole Branch', async () => {
      const { service, followUpTaskRepository, counsellingSessionRepository, memberInteractionRepository, groupMembershipService } =
        buildService();
      const clusterActor: ActorContext = { ...actor, role: 'ASSISTANT_PASTOR', clusterBacentaIds: ['bacenta-1', 'bacenta-2'] };
      groupMembershipService.listActivePersonIdsForGroups.mockResolvedValue(['person-1', 'person-2']);

      await service.getSummary(clusterActor, from, to);

      expect(groupMembershipService.listActivePersonIdsForGroups).toHaveBeenCalledWith(['bacenta-1', 'bacenta-2']);
      expect(followUpTaskRepository.listByGroups).toHaveBeenCalledWith(
        ['bacenta-1', 'bacenta-2'],
        ['OPEN', 'IN_PROGRESS', 'ESCALATED', 'COMPLETED', 'CANCELLED'],
      );
      expect(counsellingSessionRepository.listScheduledInRangeForPersons).toHaveBeenCalledWith(['person-1', 'person-2'], from, to);
      expect(memberInteractionRepository.listScheduledInRangeForPersons).toHaveBeenCalledWith(['person-1', 'person-2'], from, to);
      expect(followUpTaskRepository.listByBranch).not.toHaveBeenCalled();
      expect(counsellingSessionRepository.listScheduledInRange).not.toHaveBeenCalled();
      expect(memberInteractionRepository.listScheduledInRange).not.toHaveBeenCalled();
    });
  });

  describe('privacy boundary', () => {
    it('never copies FollowUpTask.description, CounsellingSession.briefNote, or MemberInteraction.briefNote into the response', async () => {
      const { service, followUpTaskRepository, counsellingSessionRepository, memberInteractionRepository } = buildService();
      followUpTaskRepository.listByBranch.mockResolvedValue([followUpTask()]);
      counsellingSessionRepository.listScheduledInRange.mockResolvedValue([counsellingSession()]);
      memberInteractionRepository.listScheduledInRange.mockResolvedValue([memberInteraction()]);

      const result = await service.getSummary(actor, from, to);
      const serialized = JSON.stringify(result);

      expect(serialized).not.toContain('sensitive operational note');
      expect(serialized).not.toContain('confidential counselling detail');
      expect(serialized).not.toContain('confidential interaction detail');
    });
  });

  describe('followUpTasks summary', () => {
    it('buckets by status and reports totalCount', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.listByBranch.mockResolvedValue([
        followUpTask({ id: 'ft-1', status: 'OPEN' }),
        followUpTask({ id: 'ft-2', status: 'OPEN' }),
        followUpTask({ id: 'ft-3', status: 'COMPLETED' }),
        followUpTask({ id: 'ft-4', status: 'CANCELLED' }),
      ]);

      const result = await service.getSummary(actor, from, to);

      expect(result.followUpTasks.totalCount).toBe(4);
      expect(result.followUpTasks.byStatus).toEqual({ OPEN: 2, IN_PROGRESS: 0, ESCALATED: 0, COMPLETED: 1, CANCELLED: 1 });
    });

    it('counts overdueCount only for OPEN/ESCALATED tasks with a dueAt in the past', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.listByBranch.mockResolvedValue([
        followUpTask({ id: 'ft-1', status: 'OPEN', dueAt: PAST }),
        followUpTask({ id: 'ft-2', status: 'ESCALATED', dueAt: PAST }),
        followUpTask({ id: 'ft-3', status: 'OPEN', dueAt: FUTURE }),
        followUpTask({ id: 'ft-4', status: 'COMPLETED', dueAt: PAST }),
        followUpTask({ id: 'ft-5', status: 'OPEN', dueAt: null }),
      ]);

      const result = await service.getSummary(actor, from, to);

      expect(result.followUpTasks.overdueCount).toBe(2);
    });

    it('computes completionRate as COMPLETED/totalCount, rounded to one decimal', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.listByBranch.mockResolvedValue([
        followUpTask({ id: 'ft-1', status: 'COMPLETED' }),
        followUpTask({ id: 'ft-2', status: 'OPEN' }),
        followUpTask({ id: 'ft-3', status: 'OPEN' }),
      ]);

      const result = await service.getSummary(actor, from, to);

      expect(result.followUpTasks.completionRate).toBeCloseTo(33.3, 1);
    });

    it('reports null completionRate rather than dividing by zero when there are no tasks', async () => {
      const { service } = buildService();

      const result = await service.getSummary(actor, from, to);

      expect(result.followUpTasks.completionRate).toBeNull();
      expect(result.followUpTasks.totalCount).toBe(0);
    });

    it('groups byAssignee by assignedToPersonId', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.listByBranch.mockResolvedValue([
        followUpTask({ id: 'ft-1', assignedToPersonId: 'shepherd-1' }),
        followUpTask({ id: 'ft-2', assignedToPersonId: 'shepherd-1' }),
        followUpTask({ id: 'ft-3', assignedToPersonId: 'shepherd-2' }),
      ]);

      const result = await service.getSummary(actor, from, to);

      expect(result.followUpTasks.byAssignee).toEqual(
        expect.arrayContaining([
          { assignedToPersonId: 'shepherd-1', count: 2 },
          { assignedToPersonId: 'shepherd-2', count: 1 },
        ]),
      );
    });

    it('groups byTrigger, bucketing a null trigger under UNSPECIFIED', async () => {
      const { service, followUpTaskRepository } = buildService();
      followUpTaskRepository.listByBranch.mockResolvedValue([
        followUpTask({ id: 'ft-1', trigger: 'FIRST_TIME_GUEST' }),
        followUpTask({ id: 'ft-2', trigger: null }),
      ]);

      const result = await service.getSummary(actor, from, to);

      expect(result.followUpTasks.byTrigger).toEqual({ FIRST_TIME_GUEST: 1, UNSPECIFIED: 1 });
    });
  });

  describe('counsellingSessions summary', () => {
    it('buckets by status and reports totalCount', async () => {
      const { service, counsellingSessionRepository } = buildService();
      counsellingSessionRepository.listScheduledInRange.mockResolvedValue([
        counsellingSession({ id: 'cs-1', status: 'SCHEDULED' }),
        counsellingSession({ id: 'cs-2', status: 'SCHEDULED' }),
        counsellingSession({ id: 'cs-3', status: 'COMPLETED' }),
      ]);

      const result = await service.getSummary(actor, from, to);

      expect(result.counsellingSessions).toEqual({ totalCount: 3, byStatus: { SCHEDULED: 2, COMPLETED: 1 } });
    });
  });

  describe('interactions summary', () => {
    it('buckets by type and reports totalCount', async () => {
      const { service, memberInteractionRepository } = buildService();
      memberInteractionRepository.listScheduledInRange.mockResolvedValue([
        memberInteraction({ id: 'mi-1', type: 'CALL' }),
        memberInteraction({ id: 'mi-2', type: 'VISIT' }),
        memberInteraction({ id: 'mi-3', type: 'VISIT' }),
      ]);

      const result = await service.getSummary(actor, from, to);

      expect(result.interactions).toEqual({ totalCount: 3, byType: { CALL: 1, VISIT: 2 } });
    });
  });

  it('sets from/to on the response to the given range, ISO-formatted', async () => {
    const { service } = buildService();

    const result = await service.getSummary(actor, from, to);

    expect(result.from).toBe(from.toISOString());
    expect(result.to).toBe(to.toISOString());
  });
});
