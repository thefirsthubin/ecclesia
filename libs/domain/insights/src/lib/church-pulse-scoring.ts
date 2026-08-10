import { ENGAGEMENT_SIGNAL_EVENT_TYPES } from '@ecclesia/contracts';
import type { EngagementSignalEventType } from '@ecclesia/contracts';

/**
 * PRD §12.8's Church Pulse weighted-scoring model: a stream of typed
 * Engagement Signals, reduced to a per-category sub-score, then combined
 * via configurable weights into one composite 0-100 score.
 *
 * **The six signal categories are `[PRD-DERIVED]`, not `[BLUEPRINT-EXACT]`.**
 * §12.8's own flowchart names six *signal source* boxes (Attendance
 * Records, Group Membership changes, Financial Transactions, Follow-up
 * task outcomes, Role Assignments, Visitor-to-Member conversions); §8.1
 * separately names six *scoring* categories (attendance consistency,
 * Bacenta participation, serving activity, follow-up responsiveness,
 * leadership engagement, visitor retention) that do not map 1:1 onto the
 * flowchart's six boxes (e.g. "leadership engagement" and "serving
 * activity" both plausibly derive from the same Role Assignment signal
 * source; "Financial Transactions" is a signal source with no
 * identically-named §8.1 scoring category). This module treats the
 * flowchart's six *signal source* types as the computational unit - one
 * weight per source type - since that is what the `EngagementSignal`
 * entity itself is typed by (`signalType`), and flags this narrative
 * inconsistency rather than silently resolving it with an invented
 * mapping table.
 */

export const CHURCH_PULSE_SIGNAL_TYPES = [
  'ATTENDANCE',
  'GROUP_MEMBERSHIP',
  'FINANCIAL_GIVING',
  'FOLLOW_UP_OUTCOME',
  'ROLE_ASSIGNMENT',
  'VISITOR_CONVERSION',
] as const;
export type ChurchPulseSignalType = (typeof CHURCH_PULSE_SIGNAL_TYPES)[number];

export function isChurchPulseSignalType(value: string): value is ChurchPulseSignalType {
  return (CHURCH_PULSE_SIGNAL_TYPES as readonly string[]).includes(value);
}

/**
 * Every Engagement Signal event type must have exactly one explicit
 * Church Pulse decision - either it contributes to a named category, or
 * it is explicitly excluded, with a reason. There is deliberately no
 * third, implicit "nobody decided yet" state.
 */
export type ChurchPulseClassification =
  | { readonly status: 'MAPPED'; readonly category: ChurchPulseSignalType }
  | { readonly status: 'EXCLUDED'; readonly reason: string };

/**
 * The authoritative Engagement Signal event type → Church Pulse
 * classification. **This is the anti-drift guard itself, not a
 * convenience wrapper around one**: it is typed `Record<EngagementSignalEventType,
 * ChurchPulseClassification>` - a mapped type over `libs/contracts`'
 * closed `ENGAGEMENT_SIGNAL_EVENT_TYPES` union - so TypeScript refuses to
 * compile this object literal unless every currently-known event type has
 * an entry. Add a 14th event type to `ENGAGEMENT_SIGNAL_EVENT_TYPES`
 * without adding a corresponding key here, and `tsc` fails right here,
 * not silently at runtime three layers downstream in Church Pulse
 * scoring - exactly the failure mode `mapEngagementSignalToChurchPulseCategory`
 * used to have (see git history: every Engagement Signal was persisted
 * successfully and then silently excluded from scoring, because nothing
 * connected the raw `eventType` strings real domain services publish -
 * `'attendance.recorded'` - to the bare category literals -
 * `'ATTENDANCE'` - `PulseScoreService`/`ChurchPulseRecomputeJob` expected).
 *
 * Every key is a real, currently-published event type
 * (`ENGAGEMENT_SIGNAL_PIPELINE_DESIGN_NOTES.md`'s own producer table plus
 * a repository-wide search for `eventType:`/`SIGNAL_TYPE =` literals, not
 * a guess), classified per that design note's "Signal category (PRD
 * §8.1)" column, reconciled against this module's own already-disclosed
 * choice (see file header) to key categories by PRD §12.8's six *signal
 * source* types rather than §8.1's differently-counted scoring
 * categories:
 *
 * | Event type | Publisher | Classification |
 * |---|---|---|
 * | `attendance.recorded` | Gatherings (`attendance-record.service.ts`) | MAPPED → `ATTENDANCE` |
 * | `bacenta_meeting.attendance_recorded` | Gatherings (same method, Bacenta meetings) | MAPPED → `ATTENDANCE` |
 * | `role_assignment.active` | People (`role-assignment.service.ts`) | MAPPED → `ROLE_ASSIGNMENT` |
 * | `basonta_roster.updated` | People (`group-membership.service.ts`) | MAPPED → `GROUP_MEMBERSHIP` |
 * | `lifecycle_stage.transitioned` | People (`person.service.ts`, `group-membership.service.ts`) | MAPPED → `VISITOR_CONVERSION` |
 * | `follow_up.completed` | Pastoral Care (`follow-up-task.service.ts`) | MAPPED → `FOLLOW_UP_OUTCOME` |
 * | `giving.activity_recorded` | Stewardship (`financial-transaction.service.ts`) | MAPPED → `FINANCIAL_GIVING` |
 * | `insights.alert_action_recorded` | Insights (`alert.service.ts`) | EXCLUDED - ambiguous, see reason below |
 * | `pastoral_care.silent_drift_flagged` | Worker sweep | EXCLUDED - breach/detection signal |
 * | `pastoral_care.follow_up_task_sla_breached` | Worker sweep | EXCLUDED - breach/detection signal |
 * | `stewardship.flagged_transaction_sla_breached` | Worker sweep | EXCLUDED - breach/detection signal |
 * | `stewardship.pledge_reminder_due` | Worker sweep | EXCLUDED - breach/detection signal |
 * | `gatherings.attendance_incomplete` | Worker sweep | EXCLUDED - breach/detection signal |
 */
export const ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION: Record<EngagementSignalEventType, ChurchPulseClassification> = {
  'attendance.recorded': { status: 'MAPPED', category: 'ATTENDANCE' },
  'bacenta_meeting.attendance_recorded': { status: 'MAPPED', category: 'ATTENDANCE' },
  'role_assignment.active': { status: 'MAPPED', category: 'ROLE_ASSIGNMENT' },
  'basonta_roster.updated': { status: 'MAPPED', category: 'GROUP_MEMBERSHIP' },
  'lifecycle_stage.transitioned': { status: 'MAPPED', category: 'VISITOR_CONVERSION' },
  'follow_up.completed': { status: 'MAPPED', category: 'FOLLOW_UP_OUTCOME' },
  'giving.activity_recorded': { status: 'MAPPED', category: 'FINANCIAL_GIVING' },
  'insights.alert_action_recorded': {
    status: 'EXCLUDED',
    reason:
      "Ambiguous, not omitted by oversight: this module's own file-header comment already discloses that PRD §8.1's " +
      '"leadership engagement" and "serving activity" scoring categories both plausibly derive from the same Role ' +
      'Assignment signal source, with nothing in the PRD/Blueprint resolving which - or whether a leader resolving ' +
      'an Alert should count as either at all. Mapping it to a category would be inventing that resolution, not ' +
      'reading it off a citation. Excluded pending a product decision.',
  },
  'pastoral_care.silent_drift_flagged': {
    status: 'EXCLUDED',
    reason:
      "A system-detected problem signal (a Person going silent), not the person's own positive engagement action - " +
      'computeCategoryScore treats a higher count as a better score, so counting this would invert what any category ' +
      'is meant to express.',
  },
  'pastoral_care.follow_up_task_sla_breached': {
    status: 'EXCLUDED',
    reason:
      'A breach alert (a follow-up went overdue) - the opposite of follow-up responsiveness, not a form of it. ' +
      'Counting it toward FOLLOW_UP_OUTCOME would reward poor responsiveness with a higher score.',
  },
  'stewardship.flagged_transaction_sla_breached': {
    status: 'EXCLUDED',
    reason:
      'A breach alert (a flagged transaction went unresolved past SLA), not a giving-engagement action. Counting it ' +
      'toward FINANCIAL_GIVING would reward unresolved verification backlog with a higher score.',
  },
  'stewardship.pledge_reminder_due': {
    status: 'EXCLUDED',
    reason: 'A reminder-due notice, not an actual giving action - no Person has done anything yet for this signal to represent.',
  },
  'gatherings.attendance_incomplete': {
    status: 'EXCLUDED',
    reason:
      'A data-quality flag (attendance recording is incomplete for a Gathering), not an attendance event itself. ' +
      'Counting it toward ATTENDANCE would reward incomplete record-keeping with a higher score.',
  },
};

/**
 * Every event type in `ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION`
 * whose decision is `EXCLUDED` - derived from the classification above,
 * not hand-maintained separately, so there is exactly one place this
 * list can drift from.
 */
export const CHURCH_PULSE_EXCLUDED_ENGAGEMENT_SIGNAL_TYPES: readonly EngagementSignalEventType[] =
  ENGAGEMENT_SIGNAL_EVENT_TYPES.filter((type) => ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION[type].status === 'EXCLUDED');

function isKnownEngagementSignalEventType(value: string): value is EngagementSignalEventType {
  return (ENGAGEMENT_SIGNAL_EVENT_TYPES as readonly string[]).includes(value);
}

/**
 * Resolves a raw, persisted `EngagementSignal.signalType` to the
 * `ChurchPulseSignalType` category it should count toward, or `undefined`
 * for a genuinely unrecognized type or one this module's classification
 * marks `EXCLUDED`. The one function both `PulseScoreService` (apps/api)
 * and `ChurchPulseRecomputeJob` (apps/worker) call - see
 * `ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION`'s doc comment for why a
 * shared function backed by one exhaustive table, not two lookup tables,
 * is the point of this module.
 */
export function mapEngagementSignalToChurchPulseCategory(signalType: string): ChurchPulseSignalType | undefined {
  if (!isKnownEngagementSignalEventType(signalType)) {
    return undefined;
  }
  const classification = ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION[signalType];
  return classification.status === 'MAPPED' ? classification.category : undefined;
}

/**
 * Runtime companion to the compile-time guarantee above - genuinely
 * redundant for the real, exported constants (their types already make
 * an incomplete classification a compile error, not a runtime
 * possibility). Exists for two reasons: (1) a clear, human-readable
 * failure message a CI log can surface directly instead of a raw `tsc`
 * diagnostic, and (2) a way to make "a new event type without a
 * classification decision" an actually-executable, failing Jest test
 * (see this module's own spec file) rather than only demonstrable via
 * `@ts-expect-error`. Defaults to checking the real production data;
 * tests pass explicit arguments to simulate an unclassified event type
 * without touching the real, exhaustive table.
 */
export function assertEngagementSignalEventTypesAreClassified(
  eventTypes: readonly string[] = ENGAGEMENT_SIGNAL_EVENT_TYPES,
  classification: Readonly<Partial<Record<string, ChurchPulseClassification>>> = ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION,
): void {
  const unclassified = eventTypes.filter((type) => classification[type] === undefined);
  if (unclassified.length === 0) {
    return;
  }
  throw new Error(
    [
      'UNCLASSIFIED ENGAGEMENT SIGNAL EVENT:',
      ...unclassified.map((type) => `"${type}"`),
      '',
      'Add an explicit Church Pulse mapping or exclusion decision.',
    ].join('\n'),
  );
}

/** PRD §8.1: "Church Pulse Score (congregation-level, trailing 4-week
 * average)" - the one concrete window PRD text gives anywhere for this
 * computation. `[PRD-DERIVED]`, not invented. */
export const DEFAULT_CHURCH_PULSE_WINDOW_DAYS = 28;

/**
 * **Resolved OQ-10 (§24), provisional value:** "Release 1 ships with
 * equal weighting across all six signal categories as an explicitly
 * labeled provisional placeholder." This is that placeholder, exactly as
 * the PRD itself describes it - not this module's own invention.
 */
export const DEFAULT_CHURCH_PULSE_WEIGHTS: Record<ChurchPulseSignalType, number> = {
  ATTENDANCE: 1 / 6,
  GROUP_MEMBERSHIP: 1 / 6,
  FINANCIAL_GIVING: 1 / 6,
  FOLLOW_UP_OUTCOME: 1 / 6,
  ROLE_ASSIGNMENT: 1 / 6,
  VISITOR_CONVERSION: 1 / 6,
};

/**
 * Normalizes `platform.configurations.church_pulse_weights` (raw JSONB,
 * `apps/api`'s `PulseScoreRepository`/`apps/worker`'s
 * `ChurchPulseRecomputeRepository`) into the shape `computeChurchPulseScore`
 * expects, falling back to `DEFAULT_CHURCH_PULSE_WEIGHTS` when a Branch has
 * no weights configured yet.
 *
 * `church_pulse_weights` is a `NOT NULL` JSONB column defaulting to `{}`
 * (`db/schema.prisma`) - not SQL `NULL` - so "unconfigured" is not just
 * `raw == null`; a bare `{}` (or a value containing no recognized
 * signal-type key) must fall back too, or `computeChurchPulseScore`
 * receives a weights record with every entry `undefined`, every category's
 * weight resolves to 0, and the resulting Church Pulse score is silently
 * always 0 for every Branch that hasn't explicitly configured weights -
 * i.e. every Branch in this milestone (FR-INS-02's configuration screen is
 * H2, not built here). Checking `Object.keys(weights).length` after
 * filtering (not just `!raw` up front) catches both the empty-object case
 * and a configured-but-unrecognized-keys case identically.
 *
 * Single authoritative implementation - `PulseScoreService` (`apps/api`)
 * and `ChurchPulseRecomputeJob` (`apps/worker`) both call this instead of
 * keeping their own copy, so a future fix to this logic can't silently
 * apply to only one of the two call sites the way this bug did.
 */
export function toChurchPulseWeightsRecord(
  raw: Record<string, number> | null | undefined,
): Partial<Record<ChurchPulseSignalType, number>> {
  if (!raw) {
    return DEFAULT_CHURCH_PULSE_WEIGHTS;
  }
  const weights: Partial<Record<ChurchPulseSignalType, number>> = {};
  for (const type of CHURCH_PULSE_SIGNAL_TYPES) {
    if (typeof raw[type] === 'number') {
      weights[type] = raw[type];
    }
  }
  return Object.keys(weights).length > 0 ? weights : DEFAULT_CHURCH_PULSE_WEIGHTS;
}

/**
 * **`[INFERRED - PROVISIONAL]`, not a citation.** Neither the PRD nor the
 * Blueprint specify how a raw signal *count* within the trailing window
 * becomes a 0-100 sub-score for a category - §12.8 explicitly defers "the
 * exact weighting formula, decay function... and alert thresholds" to
 * this functional domain chapter, but PRD §13.6's FR-INS rows never
 * actually supply that formula either. This is a genuine specification
 * gap, not an oversight this module resolves quietly - `10 signals in the
 * trailing window == a full 100 for that category, linear below that` is
 * an explicitly-labeled placeholder in exactly the same spirit as OQ-10's
 * own "provisional... pending calibration" framing for the weights
 * themselves, not a considered product decision. See
 * `apps/api/src/modules/insights/INSIGHTS_DESIGN_NOTES.md`.
 */
export const PROVISIONAL_SIGNALS_FOR_FULL_CATEGORY_SCORE = 10;

export function computeCategoryScore(signalCount: number): number {
  if (signalCount <= 0) {
    return 0;
  }
  return Math.min(100, (signalCount / PROVISIONAL_SIGNALS_FOR_FULL_CATEGORY_SCORE) * 100);
}

/**
 * BR-INS-01: "must not be reducible to attendance alone." Combines each
 * category's sub-score via the supplied weights (defensively normalized
 * to sum to 1, so a caller supplying a partial or unnormalized weight set
 * - e.g. from `platform.configurations.church_pulse_weights` before an
 * Admin has ever touched it - still produces a valid 0-100 result rather
 * than a silently-wrong one). A category absent from `signalCountsByType`
 * is treated as a count of 0, not excluded from the weighted average -
 * missing data pulls the score down, it does not shrink the denominator
 * (the same "flag incompleteness, don't ignore it" principle
 * `evaluateAttendanceCompleteness` already applies to Gatherings).
 */
export function computeChurchPulseScore(
  signalCountsByType: Partial<Record<ChurchPulseSignalType, number>>,
  weights: Partial<Record<ChurchPulseSignalType, number>> = DEFAULT_CHURCH_PULSE_WEIGHTS,
): number {
  const totalWeight = CHURCH_PULSE_SIGNAL_TYPES.reduce((sum, type) => sum + (weights[type] ?? 0), 0);
  if (totalWeight <= 0) {
    return 0;
  }

  const weightedSum = CHURCH_PULSE_SIGNAL_TYPES.reduce((sum, type) => {
    const weight = weights[type] ?? 0;
    const categoryScore = computeCategoryScore(signalCountsByType[type] ?? 0);
    return sum + weight * categoryScore;
  }, 0);

  return Math.round((weightedSum / totalWeight) * 100) / 100;
}
