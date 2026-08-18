import type { ActorContext } from '@ecclesia/rbac';

import { PastoralCalendarService } from './pastoral-calendar.service';

const NOW = new Date('2026-08-18T00:00:00.000Z');

describe('[Milestone B] PastoralCalendarService', () => {
  const actor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
  const from = new Date('2026-08-01T00:00:00.000Z');
  const to = new Date('2026-08-31T00:00:00.000Z');

  function buildService() {
    const followUpTaskRepository = { listByBranchWithDueAtInRange: jest.fn().mockResolvedValue([]) };
    const counsellingSessionRepository = { listScheduledInRange: jest.fn().mockResolvedValue([]) };
    const memberInteractionRepository = { listScheduledInRange: jest.fn().mockResolvedValue([]) };
    const service = new PastoralCalendarService(
      followUpTaskRepository as never,
      counsellingSessionRepository as never,
      memberInteractionRepository as never,
    );
    return { service, followUpTaskRepository, counsellingSessionRepository, memberInteractionRepository };
  }

  it('queries all three domains scoped to the actor\'s own Branch and the given date range', async () => {
    const { service, followUpTaskRepository, counsellingSessionRepository, memberInteractionRepository } = buildService();

    await service.getCalendar(actor, from, to);

    expect(followUpTaskRepository.listByBranchWithDueAtInRange).toHaveBeenCalledWith('branch-1', from, to);
    expect(counsellingSessionRepository.listScheduledInRange).toHaveBeenCalledWith('branch-1', from, to);
    expect(memberInteractionRepository.listScheduledInRange).toHaveBeenCalledWith('branch-1', from, to);
  });

  it('projects each domain into its own minimal calendar-entry shape', async () => {
    const { service, followUpTaskRepository, counsellingSessionRepository, memberInteractionRepository } = buildService();
    followUpTaskRepository.listByBranchWithDueAtInRange.mockResolvedValue([
      { id: 'ft-1', personId: 'person-1', dueAt: NOW, priority: 'HIGH', status: 'OPEN' },
    ]);
    counsellingSessionRepository.listScheduledInRange.mockResolvedValue([
      { id: 'cs-1', personId: 'person-2', scheduledAt: NOW, status: 'SCHEDULED' },
    ]);
    memberInteractionRepository.listScheduledInRange.mockResolvedValue([
      { id: 'mi-1', personId: 'person-3', scheduledAt: NOW, type: 'MEETING' },
    ]);

    const result = await service.getCalendar(actor, from, to);

    expect(result.followUpTasks).toEqual([{ id: 'ft-1', personId: 'person-1', dueAt: NOW.toISOString(), priority: 'HIGH', status: 'OPEN' }]);
    expect(result.counsellingSessions).toEqual([{ id: 'cs-1', personId: 'person-2', scheduledAt: NOW.toISOString(), status: 'SCHEDULED' }]);
    expect(result.interactions).toEqual([{ id: 'mi-1', personId: 'person-3', scheduledAt: NOW.toISOString(), type: 'MEETING' }]);
    expect(result.from).toBe(from.toISOString());
    expect(result.to).toBe(to.toISOString());
  });

  it('handles a null dueAt/scheduledAt gracefully', async () => {
    const { service, followUpTaskRepository, memberInteractionRepository } = buildService();
    followUpTaskRepository.listByBranchWithDueAtInRange.mockResolvedValue([
      { id: 'ft-1', personId: 'person-1', dueAt: null, priority: 'MEDIUM', status: 'OPEN' },
    ]);
    memberInteractionRepository.listScheduledInRange.mockResolvedValue([
      { id: 'mi-1', personId: 'person-3', scheduledAt: null, type: 'CALL' },
    ]);

    const result = await service.getCalendar(actor, from, to);

    expect(result.followUpTasks[0].dueAt).toBeNull();
    expect(result.interactions[0].scheduledAt).toBeNull();
  });
});
