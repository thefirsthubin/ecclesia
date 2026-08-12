import { z } from 'zod';

import { roleSchema } from './people.schemas';

/**
 * `GET /auth/me` (Application Shell sprint, STEP 6 addition — see
 * `apps/web-admin/src/app/APPLICATION_SHELL_DESIGN_NOTES.md` §3 and
 * `apps/api/src/platform/auth/AUTH_DESIGN_NOTES.md`). Mirrors
 * `libs/rbac`'s `ActorContext` exactly (`personId`, `role`, `branchId`,
 * plus the optional scope-narrowing fields) — this is the one place a
 * client can learn its own authenticated identity's role/scope, since
 * `ActorContextResolverService.resolve()` computes it entirely
 * server-side from a DB lookup and no Cognito token claim carries it.
 *
 * `[Release 1 blocker fix]` `branchName` added — `AuthController` now
 * looks up the actor's own `Branch.name` (via `actor.branchId`, already
 * resolved) and includes it here, replacing the dashboard's previous
 * hardcoded `DEMO_CHURCH_NAME` placeholder (`dashboardDemoData.ts`'s own
 * doc comment anticipated this exact change). `libs/rbac`'s `ActorContext`
 * type itself is intentionally left untouched — this is a display-only
 * addition to the HTTP response shape, not a change to the authorization
 * context every guard/interceptor evaluates.
 */
export const actorContextResponseSchema = z.object({
  personId: z.string().uuid(),
  role: roleSchema,
  branchId: z.string().uuid(),
  branchName: z.string(),
  clusterBacentaIds: z.array(z.string().uuid()).optional(),
  bacentaId: z.string().uuid().optional(),
  basontaId: z.string().uuid().optional(),
});
export type ActorContextResponseDto = z.infer<typeof actorContextResponseSchema>;

/**
 * `GET /auth/mode` (Development Authentication sprint, STEP 6) — lets
 * `LoginPage` decide whether to render the Cognito email/password/MFA form
 * or the development role picker, before any identity exists. Mirrors
 * `apps/api/src/platform/config/env.schema.ts`'s `AUTH_MODE` field exactly.
 */
export const authModeResponseSchema = z.object({
  mode: z.enum(['cognito', 'development']),
});
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
export const devUserSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  role: z.string().min(1),
});
export type DevUserDto = z.infer<typeof devUserSchema>;
export const devUserListSchema = z.array(devUserSchema);

/** `POST /auth/dev/login` (Development Authentication sprint, STEP 6). */
export const devLoginResponseSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});
export type DevLoginResponseDto = z.infer<typeof devLoginResponseSchema>;
