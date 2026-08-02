import { z } from 'zod';
/**
 * Shared Zod schemas for the Insights bounded context (PRD §13.6). See
 * `people.schemas.ts`'s own doc comment for why enums are re-declared
 * here rather than imported from `libs/domain/insights` -
 * `libs/contracts` is a leaf library and must not depend on a domain
 * library.
 *
 * **`signalType` is a plain string, not a Zod enum.**
 * `db/schema.prisma`'s `EngagementSignal.signalType` is a bare `String`
 * column (not a Prisma/DB enum) - `libs/domain/insights`'s
 * `isChurchPulseSignalType()` is the one place that closes it to the six
 * `[PRD-DERIVED]` Church Pulse categories, deliberately at the domain
 * layer rather than the wire layer, so a signal source that does not yet
 * map to a scored category can still be ingested and stored without a
 * contract change (Blueprint §4.3 rule 3: Insights "depends only on the
 * Engagement Signal stream" - the stream's own wire shape should not be
 * artificially narrower than the table that backs it).
 *
 * **`scopeType`/`scopeId` (not separate `groupId`/`branchId` fields).**
 * Mirrors `PulseScoreScopeType` (`db/schema.prisma`) exactly -
 * `PulseScore`/`PulseScoreHistory`/`Alert` all key off a generic scope
 * pair. `PERSON` is included here for type-fidelity with the DB enum, but
 * no route in this milestone ever produces or accepts a `PERSON`-scoped
 * value - see `PulseScoreService`'s doc comment (NFR-PRIV-02).
 */
export declare const PULSE_SCORE_SCOPE_TYPE_VALUES: readonly ["PERSON", "GROUP", "BRANCH"];
export declare const pulseScoreScopeTypeSchema: z.ZodEnum<["PERSON", "GROUP", "BRANCH"]>;
export type PulseScoreScopeTypeDto = z.infer<typeof pulseScoreScopeTypeSchema>;
export declare const ALERT_STATUS_VALUES: readonly ["OPEN", "ACTED", "DISMISSED"];
export declare const alertStatusSchema: z.ZodEnum<["OPEN", "ACTED", "DISMISSED"]>;
export type AlertStatusDto = z.infer<typeof alertStatusSchema>;
/**
 * The shape `EngagementSignalService.record()` accepts (Blueprint §10.3's
 * event envelope, narrowed to the fields `engagement_signals` actually
 * persists - this module has no async event-bus consumer yet, see
 * `INSIGHTS_DESIGN_NOTES.md`, so `eventId`/`eventType`/`schemaVersion`
 * are not modeled here; they belong to the envelope a future
 * apps/worker consumer would unwrap before calling this same method).
 * Not validated by `ZodValidationPipe` anywhere in this milestone (no
 * HTTP route accepts it directly) - defined here anyway so the shape has
 * one canonical source of truth ready for that future consumer.
 */
export declare const recordEngagementSignalSchema: z.ZodObject<{
    branchId: z.ZodString;
    personId: z.ZodOptional<z.ZodString>;
    groupId: z.ZodOptional<z.ZodString>;
    signalType: z.ZodString;
    payload: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    occurredAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    occurredAt: string;
    payload: Record<string, unknown>;
    signalType: string;
    groupId?: string | undefined;
    personId?: string | undefined;
}, {
    branchId: string;
    occurredAt: string;
    signalType: string;
    payload?: Record<string, unknown> | undefined;
    groupId?: string | undefined;
    personId?: string | undefined;
}>;
export type RecordEngagementSignalInput = z.infer<typeof recordEngagementSignalSchema>;
export declare const pulseScoreResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    scopeType: z.ZodEnum<["PERSON", "GROUP", "BRANCH"]>;
    scopeId: z.ZodString;
    score: z.ZodNumber;
    computedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    id: string;
    scopeType: "PERSON" | "GROUP" | "BRANCH";
    scopeId: string;
    score: number;
    computedAt: string;
}, {
    branchId: string;
    id: string;
    scopeType: "PERSON" | "GROUP" | "BRANCH";
    scopeId: string;
    score: number;
    computedAt: string;
}>;
export type PulseScoreResponseDto = z.infer<typeof pulseScoreResponseSchema>;
export declare const alertResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    scopeType: z.ZodEnum<["PERSON", "GROUP", "BRANCH"]>;
    scopeId: z.ZodString;
    alertType: z.ZodString;
    message: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["OPEN", "ACTED", "DISMISSED"]>;
    resolvedByPersonId: z.ZodNullable<z.ZodString>;
    resolvedAt: z.ZodNullable<z.ZodString>;
    triggeredAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    status: "OPEN" | "ACTED" | "DISMISSED";
    message: string | null;
    id: string;
    scopeType: "PERSON" | "GROUP" | "BRANCH";
    scopeId: string;
    alertType: string;
    resolvedByPersonId: string | null;
    resolvedAt: string | null;
    triggeredAt: string;
}, {
    branchId: string;
    status: "OPEN" | "ACTED" | "DISMISSED";
    message: string | null;
    id: string;
    scopeType: "PERSON" | "GROUP" | "BRANCH";
    scopeId: string;
    alertType: string;
    resolvedByPersonId: string | null;
    resolvedAt: string | null;
    triggeredAt: string;
}>;
export type AlertResponseDto = z.infer<typeof alertResponseSchema>;
/**
 * FR-INS-05: "record whether a leader acted on a proactive Insights
 * alert vs. dismissed it without action." `OPEN` is deliberately excluded
 * here - a leader resolves an alert into exactly one of the two terminal
 * states, they do not re-open one through this endpoint (there is no PRD
 * text describing a re-open flow).
 */
export declare const resolveAlertSchema: z.ZodObject<{
    status: z.ZodEnum<["ACTED", "DISMISSED"]>;
}, "strip", z.ZodTypeAny, {
    status: "ACTED" | "DISMISSED";
}, {
    status: "ACTED" | "DISMISSED";
}>;
export type ResolveAlertInput = z.infer<typeof resolveAlertSchema>;
/** `GET /insights/branch-dashboard` (FR-INS-04, Resident Pastor's
 * whole-Branch view). */
export declare const branchDashboardResponseSchema: z.ZodObject<{
    branchId: z.ZodString;
    pulseScore: z.ZodObject<{
        id: z.ZodString;
        branchId: z.ZodString;
        scopeType: z.ZodEnum<["PERSON", "GROUP", "BRANCH"]>;
        scopeId: z.ZodString;
        score: z.ZodNumber;
        computedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        branchId: string;
        id: string;
        scopeType: "PERSON" | "GROUP" | "BRANCH";
        scopeId: string;
        score: number;
        computedAt: string;
    }, {
        branchId: string;
        id: string;
        scopeType: "PERSON" | "GROUP" | "BRANCH";
        scopeId: string;
        score: number;
        computedAt: string;
    }>;
    alerts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        branchId: z.ZodString;
        scopeType: z.ZodEnum<["PERSON", "GROUP", "BRANCH"]>;
        scopeId: z.ZodString;
        alertType: z.ZodString;
        message: z.ZodNullable<z.ZodString>;
        status: z.ZodEnum<["OPEN", "ACTED", "DISMISSED"]>;
        resolvedByPersonId: z.ZodNullable<z.ZodString>;
        resolvedAt: z.ZodNullable<z.ZodString>;
        triggeredAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        branchId: string;
        status: "OPEN" | "ACTED" | "DISMISSED";
        message: string | null;
        id: string;
        scopeType: "PERSON" | "GROUP" | "BRANCH";
        scopeId: string;
        alertType: string;
        resolvedByPersonId: string | null;
        resolvedAt: string | null;
        triggeredAt: string;
    }, {
        branchId: string;
        status: "OPEN" | "ACTED" | "DISMISSED";
        message: string | null;
        id: string;
        scopeType: "PERSON" | "GROUP" | "BRANCH";
        scopeId: string;
        alertType: string;
        resolvedByPersonId: string | null;
        resolvedAt: string | null;
        triggeredAt: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    pulseScore: {
        branchId: string;
        id: string;
        scopeType: "PERSON" | "GROUP" | "BRANCH";
        scopeId: string;
        score: number;
        computedAt: string;
    };
    alerts: {
        branchId: string;
        status: "OPEN" | "ACTED" | "DISMISSED";
        message: string | null;
        id: string;
        scopeType: "PERSON" | "GROUP" | "BRANCH";
        scopeId: string;
        alertType: string;
        resolvedByPersonId: string | null;
        resolvedAt: string | null;
        triggeredAt: string;
    }[];
}, {
    branchId: string;
    pulseScore: {
        branchId: string;
        id: string;
        scopeType: "PERSON" | "GROUP" | "BRANCH";
        scopeId: string;
        score: number;
        computedAt: string;
    };
    alerts: {
        branchId: string;
        status: "OPEN" | "ACTED" | "DISMISSED";
        message: string | null;
        id: string;
        scopeType: "PERSON" | "GROUP" | "BRANCH";
        scopeId: string;
        alertType: string;
        resolvedByPersonId: string | null;
        resolvedAt: string | null;
        triggeredAt: string;
    }[];
}>;
export type BranchDashboardResponseDto = z.infer<typeof branchDashboardResponseSchema>;
/** `GET /insights/bacenta-dashboard/:groupId` and
 * `GET /insights/cluster-dashboard/:groupId` (FR-INS-04, Shepherd's own
 * Bacenta / Assistant Pastor's cluster drill-down) - same response shape,
 * different RBAC action/scope per `permission-matrix.ts`. See
 * `INSIGHTS_DESIGN_NOTES.md` for why the cluster route is a single-Bacenta
 * drill-down rather than a true multi-Bacenta ranked list. */
export declare const groupDashboardResponseSchema: z.ZodObject<{
    branchId: z.ZodString;
    groupId: z.ZodString;
    pulseScore: z.ZodObject<{
        id: z.ZodString;
        branchId: z.ZodString;
        scopeType: z.ZodEnum<["PERSON", "GROUP", "BRANCH"]>;
        scopeId: z.ZodString;
        score: z.ZodNumber;
        computedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        branchId: string;
        id: string;
        scopeType: "PERSON" | "GROUP" | "BRANCH";
        scopeId: string;
        score: number;
        computedAt: string;
    }, {
        branchId: string;
        id: string;
        scopeType: "PERSON" | "GROUP" | "BRANCH";
        scopeId: string;
        score: number;
        computedAt: string;
    }>;
    alerts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        branchId: z.ZodString;
        scopeType: z.ZodEnum<["PERSON", "GROUP", "BRANCH"]>;
        scopeId: z.ZodString;
        alertType: z.ZodString;
        message: z.ZodNullable<z.ZodString>;
        status: z.ZodEnum<["OPEN", "ACTED", "DISMISSED"]>;
        resolvedByPersonId: z.ZodNullable<z.ZodString>;
        resolvedAt: z.ZodNullable<z.ZodString>;
        triggeredAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        branchId: string;
        status: "OPEN" | "ACTED" | "DISMISSED";
        message: string | null;
        id: string;
        scopeType: "PERSON" | "GROUP" | "BRANCH";
        scopeId: string;
        alertType: string;
        resolvedByPersonId: string | null;
        resolvedAt: string | null;
        triggeredAt: string;
    }, {
        branchId: string;
        status: "OPEN" | "ACTED" | "DISMISSED";
        message: string | null;
        id: string;
        scopeType: "PERSON" | "GROUP" | "BRANCH";
        scopeId: string;
        alertType: string;
        resolvedByPersonId: string | null;
        resolvedAt: string | null;
        triggeredAt: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    groupId: string;
    pulseScore: {
        branchId: string;
        id: string;
        scopeType: "PERSON" | "GROUP" | "BRANCH";
        scopeId: string;
        score: number;
        computedAt: string;
    };
    alerts: {
        branchId: string;
        status: "OPEN" | "ACTED" | "DISMISSED";
        message: string | null;
        id: string;
        scopeType: "PERSON" | "GROUP" | "BRANCH";
        scopeId: string;
        alertType: string;
        resolvedByPersonId: string | null;
        resolvedAt: string | null;
        triggeredAt: string;
    }[];
}, {
    branchId: string;
    groupId: string;
    pulseScore: {
        branchId: string;
        id: string;
        scopeType: "PERSON" | "GROUP" | "BRANCH";
        scopeId: string;
        score: number;
        computedAt: string;
    };
    alerts: {
        branchId: string;
        status: "OPEN" | "ACTED" | "DISMISSED";
        message: string | null;
        id: string;
        scopeType: "PERSON" | "GROUP" | "BRANCH";
        scopeId: string;
        alertType: string;
        resolvedByPersonId: string | null;
        resolvedAt: string | null;
        triggeredAt: string;
    }[];
}>;
export type GroupDashboardResponseDto = z.infer<typeof groupDashboardResponseSchema>;
/** `GET /insights/alerts` (the Alert inbox surface, PRD §16.6). */
export declare const alertListResponseSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    scopeType: z.ZodEnum<["PERSON", "GROUP", "BRANCH"]>;
    scopeId: z.ZodString;
    alertType: z.ZodString;
    message: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["OPEN", "ACTED", "DISMISSED"]>;
    resolvedByPersonId: z.ZodNullable<z.ZodString>;
    resolvedAt: z.ZodNullable<z.ZodString>;
    triggeredAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    status: "OPEN" | "ACTED" | "DISMISSED";
    message: string | null;
    id: string;
    scopeType: "PERSON" | "GROUP" | "BRANCH";
    scopeId: string;
    alertType: string;
    resolvedByPersonId: string | null;
    resolvedAt: string | null;
    triggeredAt: string;
}, {
    branchId: string;
    status: "OPEN" | "ACTED" | "DISMISSED";
    message: string | null;
    id: string;
    scopeType: "PERSON" | "GROUP" | "BRANCH";
    scopeId: string;
    alertType: string;
    resolvedByPersonId: string | null;
    resolvedAt: string | null;
    triggeredAt: string;
}>, "many">;
//# sourceMappingURL=insights.schemas.d.ts.map