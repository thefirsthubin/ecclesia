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
/**
 * `GET /auth/mode` (Development Authentication sprint, STEP 6) — lets
 * `LoginPage` decide whether to render the Cognito email/password/MFA form
 * or the development role picker, before any identity exists. Mirrors
 * `apps/api/src/platform/config/env.schema.ts`'s `AUTH_MODE` field exactly.
 */
export declare const authModeResponseSchema: z.ZodObject<{
    mode: z.ZodEnum<["cognito", "development"]>;
}, "strip", z.ZodTypeAny, {
    mode: "cognito" | "development";
}, {
    mode: "cognito" | "development";
}>;
export type AuthModeResponseDto = z.infer<typeof authModeResponseSchema>;
/**
 * `GET /auth/dev/users` (Development Authentication sprint, STEP 6) — the
 * seeded persona roster `DevAuthController.listUsers()` returns, filtered
 * to personas that are actually seeded in this database yet
 * (`db:seed:dev`). Deliberately does not reuse `roleSchema` for `role` —
 * `apps/api/src/platform/auth/dev-users.ts`'s `DevUserRole` is its own
 * hand-matched string union (see that file's comment), and this schema
 * mirrors exactly what the route returns rather than assuming the two
 * stay identical forever.
 */
export declare const devUserSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    role: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    role: string;
    label: string;
}, {
    id: string;
    role: string;
    label: string;
}>;
export type DevUserDto = z.infer<typeof devUserSchema>;
export declare const devUserListSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    role: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    role: string;
    label: string;
}, {
    id: string;
    role: string;
    label: string;
}>, "many">;
/** `POST /auth/dev/login` (Development Authentication sprint, STEP 6). */
export declare const devLoginResponseSchema: z.ZodObject<{
    accessToken: z.ZodString;
    expiresIn: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    accessToken: string;
    expiresIn: number;
}, {
    accessToken: string;
    expiresIn: number;
}>;
export type DevLoginResponseDto = z.infer<typeof devLoginResponseSchema>;
//# sourceMappingURL=auth.schemas.d.ts.map