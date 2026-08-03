"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actorContextResponseSchema = void 0;
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
//# sourceMappingURL=auth.schemas.js.map