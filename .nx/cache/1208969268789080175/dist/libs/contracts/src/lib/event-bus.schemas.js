"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.engagementSignalEnvelopeSchema = void 0;
const zod_1 = require("zod");
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
exports.engagementSignalEnvelopeSchema = zod_1.z.object({
    eventId: zod_1.z.string().uuid(),
    eventType: zod_1.z.string().min(1),
    schemaVersion: zod_1.z.number().int().positive(),
    branchId: zod_1.z.string().uuid(),
    occurredAt: zod_1.z.string().datetime(),
    subjectPersonId: zod_1.z.string().uuid().optional(),
    subjectGroupId: zod_1.z.string().uuid().optional(),
    payload: zod_1.z.record(zod_1.z.unknown()),
});
//# sourceMappingURL=event-bus.schemas.js.map