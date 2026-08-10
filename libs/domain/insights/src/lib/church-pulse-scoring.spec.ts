import { ENGAGEMENT_SIGNAL_EVENT_TYPES } from '@ecclesia/contracts';
import type { EngagementSignalEventType } from '@ecclesia/contracts';

import {
  assertEngagementSignalEventTypesAreClassified,
  CHURCH_PULSE_EXCLUDED_ENGAGEMENT_SIGNAL_TYPES,
  CHURCH_PULSE_SIGNAL_TYPES,
  computeCategoryScore,
  computeChurchPulseScore,
  DEFAULT_CHURCH_PULSE_WEIGHTS,
  ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION,
  isChurchPulseSignalType,
  mapEngagementSignalToChurchPulseCategory,
} from './church-pulse-scoring';
import type { ChurchPulseClassification } from './church-pulse-scoring';

describe('isChurchPulseSignalType', () => {
  it('recognizes every modeled signal type and rejects unknown strings', () => {
    expect(isChurchPulseSignalType('ATTENDANCE')).toBe(true);
    expect(isChurchPulseSignalType('VISITOR_CONVERSION')).toBe(true);
    expect(isChurchPulseSignalType('SOMETHING_ELSE')).toBe(false);
  });
});

/**
 * Anti-drift canary. Pins every real, currently-published Engagement
 * Signal event type (found via a repository-wide search for
 * `eventType:`/`SIGNAL_TYPE =` literals across apps/api and apps/worker,
 * cross-checked against ENGAGEMENT_SIGNAL_PIPELINE_DESIGN_NOTES.md) to
 * its expected Church Pulse outcome. `PulseScoreService` (apps/api) and
 * `ChurchPulseRecomputeJob` (apps/worker) both call this exact function -
 * this test is what fails if a future change to the mapping in
 * `church-pulse-scoring.ts` silently changes what either caller does,
 * since there is now exactly one function for both of them to drift away
 * from.
 */
describe('mapEngagementSignalToChurchPulseCategory', () => {
  it.each([
    // apps/api/src/modules/gatherings/services/attendance-record.service.ts
    ['attendance.recorded', 'ATTENDANCE'],
    ['bacenta_meeting.attendance_recorded', 'ATTENDANCE'],
    // apps/api/src/modules/people/services/role-assignment.service.ts
    ['role_assignment.active', 'ROLE_ASSIGNMENT'],
    // apps/api/src/modules/people/services/group-membership.service.ts
    ['basonta_roster.updated', 'GROUP_MEMBERSHIP'],
    // apps/api/src/modules/people/services/{person,group-membership}.service.ts
    ['lifecycle_stage.transitioned', 'VISITOR_CONVERSION'],
    // apps/api/src/modules/pastoral-care/services/follow-up-task.service.ts
    ['follow_up.completed', 'FOLLOW_UP_OUTCOME'],
    // apps/api/src/modules/stewardship/services/financial-transaction.service.ts
    ['giving.activity_recorded', 'FINANCIAL_GIVING'],
  ])('maps the real published event type %s to %s', (eventType, expectedCategory) => {
    expect(mapEngagementSignalToChurchPulseCategory(eventType)).toBe(expectedCategory);
  });

  it.each(CHURCH_PULSE_EXCLUDED_ENGAGEMENT_SIGNAL_TYPES)(
    'does not map the real, published-but-excluded event type %s (a breach/incompleteness alert, not an engagement action)',
    (eventType) => {
      expect(mapEngagementSignalToChurchPulseCategory(eventType)).toBeUndefined();
    },
  );

  it('returns undefined for a genuinely unrecognized event type', () => {
    expect(mapEngagementSignalToChurchPulseCategory('some_future_domain.something_happened')).toBeUndefined();
  });

  it('never maps a bare category literal directly - real signalTypes are always domain-shaped, never the category name itself', () => {
    expect(mapEngagementSignalToChurchPulseCategory('ATTENDANCE')).toBeUndefined();
  });
});

/**
 * The classification anti-drift guard itself. `ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION`'s
 * `Record<EngagementSignalEventType, ChurchPulseClassification>` type is
 * the primary, compile-time mechanism (see its own doc comment); the
 * tests below exercise it at runtime so the guarantee is visible in a
 * `pnpm test` run, not only inferable from a type signature.
 */
describe('ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION (anti-drift)', () => {
  it('gives every real, currently-published event type an explicit classification decision', () => {
    for (const eventType of ENGAGEMENT_SIGNAL_EVENT_TYPES) {
      expect(ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION[eventType]).toBeDefined();
    }
  });

  it('gives every MAPPED classification a category that is a real ChurchPulseSignalType', () => {
    for (const eventType of ENGAGEMENT_SIGNAL_EVENT_TYPES) {
      const classification = ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION[eventType];
      if (classification.status === 'MAPPED') {
        expect(CHURCH_PULSE_SIGNAL_TYPES).toContain(classification.category);
      }
    }
  });

  it('gives every EXCLUDED classification a non-empty documented reason', () => {
    for (const eventType of ENGAGEMENT_SIGNAL_EVENT_TYPES) {
      const classification = ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION[eventType];
      if (classification.status === 'EXCLUDED') {
        expect(classification.reason.length).toBeGreaterThan(0);
      }
    }
  });

  it('CHURCH_PULSE_EXCLUDED_ENGAGEMENT_SIGNAL_TYPES contains exactly the EXCLUDED event types, derived from the one classification table', () => {
    const expectedExcluded = ENGAGEMENT_SIGNAL_EVENT_TYPES.filter(
      (type) => ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION[type].status === 'EXCLUDED',
    );
    expect([...CHURCH_PULSE_EXCLUDED_ENGAGEMENT_SIGNAL_TYPES].sort()).toEqual([...expectedExcluded].sort());
  });

  describe('assertEngagementSignalEventTypesAreClassified', () => {
    it('does not throw for the real, current production event types and classification (requirement: every current event has a decision)', () => {
      expect(() => assertEngagementSignalEventTypesAreClassified()).not.toThrow();
    });

    it('throws, naming the event type, when a simulated new event type has no classification entry', () => {
      const simulatedEventTypes = [...ENGAGEMENT_SIGNAL_EVENT_TYPES, 'some.new.event'];

      expect(() => assertEngagementSignalEventTypesAreClassified(simulatedEventTypes, ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION)).toThrow(
        /UNCLASSIFIED ENGAGEMENT SIGNAL EVENT:\n"some\.new\.event"/,
      );
    });

    it('lists every unclassified event type when more than one is missing, not just the first', () => {
      const simulatedEventTypes = [...ENGAGEMENT_SIGNAL_EVENT_TYPES, 'some.new.event', 'another.new.event'];

      try {
        assertEngagementSignalEventTypesAreClassified(simulatedEventTypes, ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION);
        throw new Error('expected assertEngagementSignalEventTypesAreClassified to throw');
      } catch (error) {
        expect((error as Error).message).toContain('"some.new.event"');
        expect((error as Error).message).toContain('"another.new.event"');
      }
    });
  });

  it('a Record missing even one known event type fails to type-check - the primary, compile-time form of this guard, proven by @ts-expect-error (see tsc, not this runtime assertion)', () => {
    // This assignment is intentionally incomplete (an empty object) to
    // prove Record<EngagementSignalEventType, ChurchPulseClassification>
    // requires every key. `@ts-expect-error` means `tsc -p libs/domain/insights
    // --noEmit` fails this line as a *passing* test of the guard right
    // now; if the guard's own type were ever weakened (e.g.
    // EngagementSignalEventType accidentally widened to `string`), the
    // assignment below would stop erroring and `@ts-expect-error` itself
    // becomes "Unused '@ts-expect-error' directive" - a new compile
    // failure surfacing the same regression. SWC (this repo's Jest
    // transpiler) does not type-check, so this line runs harmlessly at
    // `pnpm test` time regardless - `tsc` is the actual check.
    // @ts-expect-error - deliberately incomplete, see comment above.
    const incomplete: Record<EngagementSignalEventType, ChurchPulseClassification> = {};
    expect(incomplete).toEqual({});
  });
});

describe('computeCategoryScore', () => {
  it('returns 0 for no signals', () => {
    expect(computeCategoryScore(0)).toBe(0);
  });

  it('scales linearly up to the provisional full-score threshold (10 signals)', () => {
    expect(computeCategoryScore(5)).toBe(50);
  });

  it('clamps at 100 beyond the threshold', () => {
    expect(computeCategoryScore(50)).toBe(100);
  });
});

describe('computeChurchPulseScore (BR-INS-01)', () => {
  it('returns 0 when every category has no signals', () => {
    const result = computeChurchPulseScore({});
    expect(result).toBe(0);
  });

  it('returns 100 when every category is fully saturated', () => {
    const fullCounts = { ATTENDANCE: 10, GROUP_MEMBERSHIP: 10, FINANCIAL_GIVING: 10, FOLLOW_UP_OUTCOME: 10, ROLE_ASSIGNMENT: 10, VISITOR_CONVERSION: 10 };
    expect(computeChurchPulseScore(fullCounts)).toBe(100);
  });

  it('is not reducible to a single signal category (BR-INS-01) - one saturated category alone caps well below 100', () => {
    const result = computeChurchPulseScore({ ATTENDANCE: 100 }, DEFAULT_CHURCH_PULSE_WEIGHTS);
    // Equal-sixths weighting: one fully-saturated category contributes at most 1/6th of the total.
    expect(result).toBeCloseTo(100 / 6, 1);
  });

  it('treats a missing category as a count of 0, pulling the average down rather than shrinking the denominator', () => {
    const withFive = computeChurchPulseScore({ ATTENDANCE: 10, GROUP_MEMBERSHIP: 10 });
    const withSix = computeChurchPulseScore({ ATTENDANCE: 10, GROUP_MEMBERSHIP: 10, FINANCIAL_GIVING: 10 });
    expect(withSix).toBeGreaterThan(withFive);
  });

  it('returns 0 when the supplied weights are all zero (defensive against a totally-unconfigured Branch)', () => {
    const zeroWeights = { ATTENDANCE: 0, GROUP_MEMBERSHIP: 0, FINANCIAL_GIVING: 0, FOLLOW_UP_OUTCOME: 0, ROLE_ASSIGNMENT: 0, VISITOR_CONVERSION: 0 };
    expect(computeChurchPulseScore({ ATTENDANCE: 10 }, zeroWeights)).toBe(0);
  });
});
