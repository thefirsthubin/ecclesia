import {
  checkFollowUpTaskStatusTransition,
  computeFollowUpTaskDueAt,
  DEFAULT_FOLLOW_UP_SLA_DAYS,
  determineFollowUpTaskTrigger,
  isFollowUpTaskPastSla,
} from './follow-up-task';

describe('determineFollowUpTaskTrigger (FR-PC-03)', () => {
  it('triggers FIRST_TIME_GUEST when a Person enters that stage', () => {
    expect(determineFollowUpTaskTrigger('FIRST_TIME_GUEST', 'VISITOR')).toBe('FIRST_TIME_GUEST');
  });

  it('triggers LAPSED_REENGAGEMENT for the specific Lapsed -> FollowUp transition', () => {
    expect(determineFollowUpTaskTrigger('FOLLOW_UP', 'LAPSED')).toBe('LAPSED_REENGAGEMENT');
  });

  it('does not trigger for FollowUp entered from a stage other than Lapsed', () => {
    expect(determineFollowUpTaskTrigger('FOLLOW_UP', 'FIRST_TIME_GUEST')).toBeNull();
  });

  it('does not trigger for an unrelated transition', () => {
    expect(determineFollowUpTaskTrigger('MEMBER', 'SIX_WEEKS_PARTICIPATION')).toBeNull();
  });
});

describe('computeFollowUpTaskDueAt (FR-PC-04, OQ-06)', () => {
  const createdAt = new Date('2026-08-01T00:00:00.000Z');

  it('defaults to 3 days for FIRST_TIME_GUEST', () => {
    expect(DEFAULT_FOLLOW_UP_SLA_DAYS.FIRST_TIME_GUEST).toBe(3);
    const dueAt = computeFollowUpTaskDueAt('FIRST_TIME_GUEST', createdAt);
    expect(dueAt.toISOString()).toBe('2026-08-04T00:00:00.000Z');
  });

  it('defaults to 14 days for LAPSED_REENGAGEMENT', () => {
    expect(DEFAULT_FOLLOW_UP_SLA_DAYS.LAPSED_REENGAGEMENT).toBe(14);
    const dueAt = computeFollowUpTaskDueAt('LAPSED_REENGAGEMENT', createdAt);
    expect(dueAt.toISOString()).toBe('2026-08-15T00:00:00.000Z');
  });

  it('uses a Branch-configured override in place of the shipped default', () => {
    const dueAt = computeFollowUpTaskDueAt('FIRST_TIME_GUEST', createdAt, 7);
    expect(dueAt.toISOString()).toBe('2026-08-08T00:00:00.000Z');
  });
});

describe('isFollowUpTaskPastSla (FR-PC-04, BR-PC-04)', () => {
  const now = new Date('2026-08-10T00:00:00.000Z');

  it('is true for an OPEN task whose dueAt has passed', () => {
    expect(isFollowUpTaskPastSla({ status: 'OPEN', dueAt: new Date('2026-08-09T00:00:00.000Z'), now })).toBe(true);
  });

  it('is false for an OPEN task whose dueAt has not yet passed', () => {
    expect(isFollowUpTaskPastSla({ status: 'OPEN', dueAt: new Date('2026-08-11T00:00:00.000Z'), now })).toBe(false);
  });

  it('is false for an already-ESCALATED task (one-time transition, not a recurring alert)', () => {
    expect(isFollowUpTaskPastSla({ status: 'ESCALATED', dueAt: new Date('2026-08-01T00:00:00.000Z'), now })).toBe(
      false,
    );
  });

  it('is false for a COMPLETED task', () => {
    expect(isFollowUpTaskPastSla({ status: 'COMPLETED', dueAt: new Date('2026-08-01T00:00:00.000Z'), now })).toBe(
      false,
    );
  });

  it('is false for an OPEN task with no dueAt set', () => {
    expect(isFollowUpTaskPastSla({ status: 'OPEN', dueAt: null, now })).toBe(false);
  });
});

describe('[Milestone B] checkFollowUpTaskStatusTransition', () => {
  it.each([
    ['OPEN', 'IN_PROGRESS'],
    ['OPEN', 'ESCALATED'],
    ['OPEN', 'CANCELLED'],
    ['IN_PROGRESS', 'COMPLETED'],
    ['IN_PROGRESS', 'ESCALATED'],
    ['IN_PROGRESS', 'CANCELLED'],
    ['ESCALATED', 'COMPLETED'],
    ['ESCALATED', 'CANCELLED'],
  ] as const)('allows %s -> %s', (from, to) => {
    expect(checkFollowUpTaskStatusTransition(from, to).allowed).toBe(true);
  });

  it.each([
    ['OPEN', 'COMPLETED'],
    ['ESCALATED', 'IN_PROGRESS'],
    ['COMPLETED', 'OPEN'],
    ['COMPLETED', 'IN_PROGRESS'],
    ['CANCELLED', 'OPEN'],
    ['CANCELLED', 'COMPLETED'],
  ] as const)('rejects %s -> %s', (from, to) => {
    expect(checkFollowUpTaskStatusTransition(from, to).allowed).toBe(false);
  });

  it('rejects a same-status "transition"', () => {
    expect(checkFollowUpTaskStatusTransition('OPEN', 'OPEN').allowed).toBe(false);
  });

  it('COMPLETED and CANCELLED are both terminal - no outbound transition exists', () => {
    expect(checkFollowUpTaskStatusTransition('COMPLETED', 'CANCELLED').allowed).toBe(false);
    expect(checkFollowUpTaskStatusTransition('CANCELLED', 'COMPLETED').allowed).toBe(false);
  });
});
