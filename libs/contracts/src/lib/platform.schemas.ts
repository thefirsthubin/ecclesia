import { z } from 'zod';

/**
 * Shared Zod schemas for `platform.configurations` (PRD §17.3's
 * "Configuration: gathering/role/group types" matrix row - see
 * `libs/rbac/src/lib/actions.ts`'s `platform.configuration.*` doc
 * comment). `libs/contracts` is a leaf library, so - same precedent as
 * `people.schemas.ts` - enums are re-declared here rather than imported
 * from `libs/domain/insights`.
 *
 * **Only three of `Configuration`'s five columns are exposed here.**
 * Traced against actual consumers, not assumed: `churchPulseWeights`
 * (`toChurchPulseWeightsRecord`, `libs/domain/insights`, consumed by both
 * `apps/api`'s `PulseScoreService` and `apps/worker`'s
 * `ChurchPulseRecomputeJob`), `poimenGateEnabled`
 * (`BranchConfigurationService` -> `libs/rbac`'s `poimenGateIfEnabled`
 * record-level check), and `silentDriftConfig`
 * (`SilentDriftSweepRepository.getThresholds`, `apps/worker`) all have a
 * real, currently-active reader. `gatheringTypes` has a ready-to-consume
 * validator (`isConfiguredGatheringType`, `libs/domain/gatherings`) that
 * `GatheringService.create()` never actually calls, and
 * `followupSlaDefaults` has no reader anywhere in `apps/api`/`apps/worker`
 * at all (confirmed by repo-wide search) - both are genuinely
 * stored-but-unused today, so no Web Admin field was built for either,
 * per this milestone's own "don't build UI for a field with no consumer"
 * instruction.
 */

export const CHURCH_PULSE_SIGNAL_TYPE_VALUES = [
  'ATTENDANCE',
  'GROUP_MEMBERSHIP',
  'FINANCIAL_GIVING',
  'FOLLOW_UP_OUTCOME',
  'ROLE_ASSIGNMENT',
  'VISITOR_CONVERSION',
] as const;
export const churchPulseSignalTypeSchema = z.enum(CHURCH_PULSE_SIGNAL_TYPE_VALUES);
export type ChurchPulseSignalTypeDto = z.infer<typeof churchPulseSignalTypeSchema>;

/**
 * Every key optional - mirrors `toChurchPulseWeightsRecord`'s own input
 * type (`Record<string, number> | null | undefined`) and its documented
 * defensive handling: a partial or empty set of weights is not an error,
 * it falls back to `DEFAULT_CHURCH_PULSE_WEIGHTS` at read time. No
 * numeric range is enforced here - `computeChurchPulseScore` already
 * normalizes whatever positive weights it receives by their own total
 * (see that function's own doc comment), so imposing a `[0,1]`/sum-to-1
 * constraint here would be inventing a rule the actual scoring function
 * doesn't itself require.
 */
export const churchPulseWeightsSchema = z.object({
  ATTENDANCE: z.number().optional(),
  GROUP_MEMBERSHIP: z.number().optional(),
  FINANCIAL_GIVING: z.number().optional(),
  FOLLOW_UP_OUTCOME: z.number().optional(),
  ROLE_ASSIGNMENT: z.number().optional(),
  VISITOR_CONVERSION: z.number().optional(),
});
export type ChurchPulseWeightsDto = z.infer<typeof churchPulseWeightsSchema>;

/**
 * `{ n, m }` - PRD §15.8's silent-drift attendance/Bacenta thresholds
 * (`libs/domain/pastoral-care`'s `silent-drift.ts` doc comment: N and M
 * are both the evaluation window size and the required-attended count).
 * `positive()` is not an invented constraint - it mirrors
 * `SilentDriftSweepRepository.getThresholds`'s own real check
 * (`typeof raw?.n === 'number' && raw.n > 0`); a non-positive value is
 * already silently ignored (falls back to the default) by that reader,
 * so rejecting it here just surfaces the same rule earlier, at the point
 * of entry, rather than letting a Branch believe it saved a value the
 * sweep will actually ignore.
 */
export const silentDriftThresholdsSchema = z.object({
  n: z.number().int().positive().optional(),
  m: z.number().int().positive().optional(),
});
export type SilentDriftThresholdsDto = z.infer<typeof silentDriftThresholdsSchema>;

export const createBranchConfigurationSchema = z.object({
  churchPulseWeights: churchPulseWeightsSchema.optional(),
  poimenGateEnabled: z.boolean().optional(),
  silentDriftConfig: silentDriftThresholdsSchema.optional(),
});
export type CreateBranchConfigurationInput = z.infer<typeof createBranchConfigurationSchema>;

export const updateBranchConfigurationSchema = z
  .object({
    churchPulseWeights: churchPulseWeightsSchema.optional(),
    poimenGateEnabled: z.boolean().optional(),
    silentDriftConfig: silentDriftThresholdsSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be provided' });
export type UpdateBranchConfigurationInput = z.infer<typeof updateBranchConfigurationSchema>;

export const branchConfigurationResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  churchPulseWeights: churchPulseWeightsSchema,
  poimenGateEnabled: z.boolean(),
  silentDriftConfig: silentDriftThresholdsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BranchConfigurationResponseDto = z.infer<typeof branchConfigurationResponseSchema>;

/**
 * `[Audit Log milestone]` `platform.audit_log` (Blueprint §7.2/§9.6),
 * PRD §17.3's "Audit Log" matrix row. `branchId`/`actorUserId` are
 * nullable in the schema itself - a NULL-branch row is an
 * authentication-failure record (`AuthGuard`, no resolvable actor or
 * Branch at all, per `db/schema.prisma`'s own doc comment on
 * `AuditLog.actorUserId`), not a data-quality gap to hide from the
 * client. No `groupId`/cluster-narrowing field exists on the model at
 * all, so this response shape cannot express one - see
 * `AuditLogController`'s own doc comment for why CLUSTER/OWN_GROUP roles
 * cannot use this endpoint today.
 */
export const auditLogEntryResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid().nullable(),
  actorUserId: z.string().uuid().nullable(),
  action: z.string(),
  effect: z.enum(['ALLOW', 'DENY']).nullable(),
  resourceType: z.string().nullable(),
  resourceId: z.string().nullable(),
  reason: z.string().nullable(),
  deviceId: z.string().nullable(),
  ipAddress: z.string().nullable(),
  occurredAt: z.string(),
});
export type AuditLogEntryResponseDto = z.infer<typeof auditLogEntryResponseSchema>;

export const auditLogListResponseSchema = z.array(auditLogEntryResponseSchema);
export type AuditLogListResponseDto = z.infer<typeof auditLogListResponseSchema>;

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` `platform.branches`
 * (`db/schema.prisma`) - `GET /platform/branches`'s response shape. Only
 * `id`/`name` are exposed - the minimum needed to resolve a real Branch
 * name for a Council-wide view; `timezone` and every other `Branch`
 * column have no current web-admin consumer, matching this file's own
 * "don't build UI for a field with no consumer" discipline just above.
 */
export const branchResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});
export type BranchResponseDto = z.infer<typeof branchResponseSchema>;

export const branchListResponseSchema = z.array(branchResponseSchema);
export type BranchListResponseDto = z.infer<typeof branchListResponseSchema>;

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` `platform.tenants`
 * (`db/schema.prisma`) - `GET /platform/tenants`'s response shape, the
 * real Tenant list `SystemAdministratorDashboard.tsx`'s own doc comment
 * disclosed as a genuine backend gap ("no Tenant controller/service/
 * repository exists anywhere in `apps/api`"). `id`/`name`/`createdAt`
 * only - `updatedAt` and the `council` relation have no current
 * web-admin consumer, the same "don't build UI for a field with no
 * consumer" discipline `branchResponseSchema` above already follows.
 */
export const tenantResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.string().datetime(),
});
export type TenantResponseDto = z.infer<typeof tenantResponseSchema>;

export const tenantListResponseSchema = z.array(tenantResponseSchema);
export type TenantListResponseDto = z.infer<typeof tenantListResponseSchema>;
