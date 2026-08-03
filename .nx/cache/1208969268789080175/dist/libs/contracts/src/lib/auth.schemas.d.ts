import { z } from 'zod';
/**
 * `GET /auth/me` (Application Shell sprint, STEP 6 addition — see
 * `apps/web-admin/src/app/APPLICATION_SHELL_DESIGN_NOTES.md` §3 and
 * `apps/api/src/platform/auth/AUTH_DESIGN_NOTES.md`). Mirrors
 * `libs/rbac`'s `ActorContext` exactly (`personId`, `role`, `branchId`,
 * plus the optional scope-narrowing fields) — this is the one place a
 * client can learn its own authenticated identity's role/scope, since
 * `ActorContextResolverService.resolve()` computes it entirely
 * server-side from a DB lookup and no Cognito token claim carries it.
 */
export declare const actorContextResponseSchema: z.ZodObject<{
    personId: z.ZodString;
    role: z.ZodEnum<["RESIDENT_PASTOR", "ACTING_RESIDENT_PASTOR", "ASSISTANT_PASTOR", "BACENTA_LEADER", "BASONTA_LEADER", "TREASURER", "WORKER", "MEMBER", "VISITOR", "ADMIN", "COUNCIL_OVERSEER"]>;
    branchId: z.ZodString;
    clusterBacentaIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    bacentaId: z.ZodOptional<z.ZodString>;
    basontaId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    role: "VISITOR" | "MEMBER" | "RESIDENT_PASTOR" | "ACTING_RESIDENT_PASTOR" | "ASSISTANT_PASTOR" | "BACENTA_LEADER" | "BASONTA_LEADER" | "TREASURER" | "WORKER" | "ADMIN" | "COUNCIL_OVERSEER";
    personId: string;
    clusterBacentaIds?: string[] | undefined;
    bacentaId?: string | undefined;
    basontaId?: string | undefined;
}, {
    branchId: string;
    role: "VISITOR" | "MEMBER" | "RESIDENT_PASTOR" | "ACTING_RESIDENT_PASTOR" | "ASSISTANT_PASTOR" | "BACENTA_LEADER" | "BASONTA_LEADER" | "TREASURER" | "WORKER" | "ADMIN" | "COUNCIL_OVERSEER";
    personId: string;
    clusterBacentaIds?: string[] | undefined;
    bacentaId?: string | undefined;
    basontaId?: string | undefined;
}>;
export type ActorContextResponseDto = z.infer<typeof actorContextResponseSchema>;
//# sourceMappingURL=auth.schemas.d.ts.map