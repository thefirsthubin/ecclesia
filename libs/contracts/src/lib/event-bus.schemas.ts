import { z } from 'zod';

/**
 * The Engagement Signal envelope (Blueprint §10.3, shown as a TypeScript
 * interface there): every message any producer puts onto the
 * `ecclesia-engagement-signals` EventBridge bus (§10.2), and every message
 * any of the three named SQS consumers (`insights-consumer`,
 * `notification-consumer`, `audit-consumer`, §10.2) receives, is shaped
 * like this. Declared here, in `libs/contracts` rather than
 * `libs/domain/insights` or apps/worker itself, because it is genuinely
 * cross-boundary: apps/api's future event producers and apps/worker's
 * consumers both need the identical wire shape, and `libs/contracts` is
 * the one leaf library both apps already depend on without violating Nx's
 * `enforce-module-boundaries` app-to-app rule.
 *
 * `[BLUEPRINT-EXACT]` field set/names, translated from the Blueprint's own
 * TypeScript interface into a Zod schema (this codebase's one validation
 * library, per `contracts.ts`'s doc comment) rather than left as a bare
 * `interface` - a schema, not just a type, is what
 * `ProcessedEventRepository`'s idempotency check and
 * `EventBridgePublisherService`'s publish path both actually validate
 * against at the process boundary (message off the wire in, event
 * payload out), the same "validate at the boundary" discipline every
 * other contract in this library already follows.
 *
 * `payload` is `z.record(z.unknown())` rather than a generic `<T>` type
 * parameter - Zod schemas are not generic the way the Blueprint's
 * TypeScript interface is; each concrete signal type's own payload shape
 * is validated downstream by whichever consumer/domain function actually
 * interprets it (e.g. `libs/domain/pastoral-care`'s `evaluateSilentDrift`
 * for a `pastoral_care.silent_drift_flagged` payload), not by this
 * envelope schema itself.
 */
export const engagementSignalEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string().min(1),
  schemaVersion: z.number().int().positive(),
  branchId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  subjectPersonId: z.string().uuid().optional(),
  subjectGroupId: z.string().uuid().optional(),
  payload: z.record(z.unknown()),
});
export type EngagementSignalEnvelope = z.infer<typeof engagementSignalEnvelopeSchema>;

/**
 * The closed set of every real Engagement Signal event type currently
 * published anywhere in this codebase - `apps/api`'s six domain modules
 * (Gatherings/People x2/Pastoral Care/Stewardship/Insights) and
 * `apps/worker`'s five sweep jobs (`*SweepJob.SIGNAL_TYPE`). Confirmed via
 * a repository-wide search for `eventType:`/`SIGNAL_TYPE =` literals, not
 * assumed from the PRD/Blueprint's own (differently-organized) catalog -
 * see `ENGAGEMENT_SIGNAL_PIPELINE_DESIGN_NOTES.md` at the repo root and
 * `libs/domain/insights/src/lib/church-pulse-scoring.ts`'s own
 * `ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION`.
 *
 * `eventType` on `engagementSignalEnvelopeSchema` above stays a bare
 * `z.string().min(1)`, deliberately not narrowed to this set - a
 * consumer off the real SQS queue must still accept a genuinely new event
 * type (Insights ingests "the whole stream," per `InsightsConsumer`'s own
 * doc comment) rather than treat it as malformed input. This closed set
 * instead governs the *publish* side: `EventBridgePublisherService.publish()`
 * (both apps/api's and apps/worker's copies) takes `PublishableEngagementSignal`
 * below, not the wider `EngagementSignalEnvelope`, so a brand-new literal
 * at a publish call site is a compile error until it's added here - and
 * adding it here is, in turn, a compile error in `libs/domain/insights`'s
 * `ENGAGEMENT_SIGNAL_CHURCH_PULSE_CLASSIFICATION` (a `Record` keyed by
 * this same type) until an explicit MAPPED/EXCLUDED decision is recorded
 * for it. That two-step compile-time chain, not a lint rule or a grep
 * script, is what makes introducing an unclassified event type silently
 * impossible.
 */
export const ENGAGEMENT_SIGNAL_EVENT_TYPES = [
  'attendance.recorded',
  'bacenta_meeting.attendance_recorded',
  'role_assignment.active',
  'basonta_roster.updated',
  'lifecycle_stage.transitioned',
  'follow_up.completed',
  'giving.activity_recorded',
  'insights.alert_action_recorded',
  'pastoral_care.silent_drift_flagged',
  'pastoral_care.follow_up_task_sla_breached',
  'stewardship.flagged_transaction_sla_breached',
  'stewardship.pledge_reminder_due',
  'gatherings.attendance_incomplete',
] as const;
export type EngagementSignalEventType = (typeof ENGAGEMENT_SIGNAL_EVENT_TYPES)[number];

/**
 * The envelope shape a producer constructs pre-publish: identical to
 * `EngagementSignalEnvelope` except `eventType` is narrowed to the closed
 * `EngagementSignalEventType` union instead of the wire schema's bare
 * `string`. See `ENGAGEMENT_SIGNAL_EVENT_TYPES`'s own doc comment for why
 * this narrowing lives at the publish boundary, not the envelope schema
 * itself.
 */
export type PublishableEngagementSignal = Omit<EngagementSignalEnvelope, 'eventType'> & {
  eventType: EngagementSignalEventType;
};
