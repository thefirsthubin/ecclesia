"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devLoginResponseSchema = exports.devUserListSchema = exports.devUserSchema = exports.authModeResponseSchema = exports.actorContextResponseSchema = void 0;
const zod_1 = require("zod");
const people_schemas_1 = require("./people.schemas");
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
exports.actorContextResponseSchema = zod_1.z.object({
    personId: zod_1.z.string().uuid(),
    role: people_schemas_1.roleSchema,
    branchId: zod_1.z.string().uuid(),
    clusterBacentaIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    bacentaId: zod_1.z.string().uuid().optional(),
    basontaId: zod_1.z.string().uuid().optional(),
});
/**
 * `GET /auth/mode` (Development Authentication sprint, STEP 6) — lets
 * `LoginPage` decide whether to render the Cognito email/password/MFA form
 * or the development role picker, before any identity exists. Mirrors
 * `apps/api/src/platform/config/env.schema.ts`'s `AUTH_MODE` field exactly.
 */
exports.authModeResponseSchema = zod_1.z.object({
    mode: zod_1.z.enum(['cognito', 'development']),
});
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
exports.devUserSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    label: zod_1.z.string().min(1),
    role: zod_1.z.string().min(1),
});
exports.devUserListSchema = zod_1.z.array(exports.devUserSchema);
/** `POST /auth/dev/login` (Development Authentication sprint, STEP 6). */
exports.devLoginResponseSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(1),
    expiresIn: zod_1.z.number().int().positive(),
});
//# sourceMappingURL=auth.schemas.js.map