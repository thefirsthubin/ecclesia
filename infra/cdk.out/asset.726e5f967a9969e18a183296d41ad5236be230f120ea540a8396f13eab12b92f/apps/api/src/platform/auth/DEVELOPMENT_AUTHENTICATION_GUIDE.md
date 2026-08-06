# Development Authentication Guide

Read this alongside `AUTH_DESIGN_NOTES.md` (Sprint 1.4's production
Cognito design, unchanged by this sprint) and `db/DESIGN_NOTES.md`. This
document covers the Development Authentication sprint: a local-only
bypass for AWS Cognito, built because no Cognito User Pool/App
Client/seeded users have ever been provisioned in this project (see
`AUTH_DESIGN_NOTES.md`'s "known sandbox limitation"), which meant nobody
could actually log in and exercise the application end to end.

## Why this exists

Every backend domain module, RBAC, `ActorContextResolverService`, and
every Web Admin domain page were complete and passing lint/test/build —
but none of it had ever been run against a real, logged-in session,
because `AuthGuard` only ever spoke to real AWS Cognito, and no Cognito
resources exist. This sprint closes that gap for local development only,
without touching how authentication works in production.

**This is not a mock, not fake business logic, and not a second
authorization system.** It is a second *identity source* — a way to
obtain a verified `{ sub }` claim without a real Cognito login — that
feeds into the exact same `ActorContextResolverService.resolve()` →
RBAC → permission-matrix pipeline every Cognito-authenticated request
already goes through. Nothing about *authorization* changes; only where
the initial identity comes from.

## Architecture

### The abstraction: `TokenVerifierService`

`AuthGuard` (`auth.guard.ts`) never imports `CognitoVerifierService` or
`DevAuthService` directly. It depends on an interface,
`TokenVerifierService` (`token-verifier.interface.ts`):

```ts
interface TokenVerifierService {
  verifyAccessToken(token: string): Promise<{ sub: string }>;
}
```

Both `CognitoVerifierService` (production) and `DevAuthService`
(development) implement it. `AuthGuard` is injected with whichever one is
active via the `TOKEN_VERIFIER` DI token — it cannot tell which
implementation it got, and neither can `ActorContextResolverService`,
every RBAC guard, or every controller downstream. That is the whole
design: **swapping the identity source never touches authorization.**

### Which mode is active: `AUTH_MODE`

`auth-mode.ts` is the single source of truth:

- `computeAuthMode(env)` — pure, never throws. Honors an explicit
  `AUTH_MODE=cognito` or `AUTH_MODE=development`; otherwise infers from
  `NODE_ENV` (`development` → `development`, everything else → the safe
  default, `cognito`).
- `assertAuthModeIsSafe(env)` — calls `computeAuthMode`, then enforces the
  one hard rule: **`AUTH_MODE=development` is refused whenever
  `NODE_ENV=production`, even if set explicitly.** A misconfigured
  production deploy that accidentally carries a stray
  `AUTH_MODE=development` environment variable will refuse to boot rather
  than silently activate the development provider. This is a deliberate
  strengthening of the literal brief wording ("activate when
  `NODE_ENV=development` OR `AUTH_MODE=development`") — a plain OR would
  leave exactly that hole open, which contradicts the brief's own
  Production Acceptance Criteria.

Both `env.schema.ts` (as a normal Zod validation issue, so a bad `.env`
fails with the usual "Invalid environment configuration" message) and
`auth.module.ts` (as a hard `throw`, at module-composition time,
independent of whether `ConfigModule` validation already ran) apply this
same check. Defense in depth on the one rule this sprint is most explicit
about.

### Module wiring: why `AuthModule` is a dynamic module

`auth.module.ts` exports `AuthModule.register()`, not a plain
`@Module({...})`. The `providers`/`controllers` arrays are computed once,
at call time, from `assertAuthModeIsSafe(process.env)`:

- **`AUTH_MODE=cognito`**: `CognitoVerifierService` is registered and
  bound to `TOKEN_VERIFIER`. `DevAuthService`/`DevAuthController` are
  never added to the module at all.
- **`AUTH_MODE=development`**: `DevAuthService` is registered and bound
  to `TOKEN_VERIFIER`, and `DevAuthController` is added to
  `controllers`. `CognitoVerifierService` is never constructed — it would
  otherwise throw at construction time in an environment with no real
  `COGNITO_USER_POOL_ID`/`COGNITO_CLIENT_ID`/`COGNITO_REGION` set.

This is why the **Production Acceptance Criteria** ("the development
provider must disappear completely") holds structurally, not just
behaviorally: in `AUTH_MODE=cognito`, `GET /auth/dev/users` and
`POST /auth/dev/login` are not routes that reject requests — they are
routes that were never added to the Nest router. A request to them 404s
the same way a URL that was never written would.

### The development identity provider: `DevAuthService`

`dev-auth.service.ts` issues and verifies a **development access
token** — not a real JWT (no `jsonwebtoken`/`jose` dependency was added;
the brief requires zero external dependencies), but a genuinely signed
artifact using only Node's built-in `node:crypto`:

```
<base64url {sub, iat, exp}>.<base64url HMAC-SHA256 signature>
```

- 12-hour TTL, no refresh flow (matches the brief's "no passwords, no
  MFA" simplicity — a full session is long enough for a local dev
  session).
- The signing key (`DEV_TOKEN_SECRET`) is a fixed, non-configurable
  constant, not read from an environment variable. There is nothing to
  protect: this service is structurally unreachable in production
  (`assertAuthModeIsSafe`/`auth.module.ts` never construct it there), and
  even a forged token can never grant more than RBAC already permits the
  specific seeded persona it names — the full authorization pipeline
  still runs unchanged.
- `verifyAccessToken()` returns `{ sub }`, identical in shape to
  `CognitoVerifierService`'s return value. The `sub` is always one of the
  seeded development users' ids (e.g. `"dev-resident-pastor"`), which —
  by construction (`db/seed-dev-users.ts`) — is also that user's real
  `platform.users.cognito_sub`. That fact is what lets
  `ActorContextResolverService.resolve()` run completely unmodified: it
  has no idea a development token, not a Cognito one, produced the
  identity it's resolving.

### Seeded development users

`dev-users.ts` defines six personas (`DEV_USER_SEEDS`), matching the
brief's own example roster: Resident Pastor, Assistant Pastor, Treasurer,
Basonta Leader, Council Administrator (mapped to the RBAC catalog's
`COUNCIL_OVERSEER` — the closest real `Role` value; "Council
Administrator" itself is not an RBAC role name), and Super Administrator
(mapped to `ADMIN`, the RBAC catalog's only platform-configuration role).

Each is a real `people.persons` row, a real `platform.users` row (whose
`cognito_sub` equals the dev user's id), and a real, RBAC-governed
`people.role_assignments` row — created by `db/seed-dev-users.ts` (see
"Getting started" below), never faked in memory. The Basonta Leader
persona additionally gets a real `people.groups` row (type `MINISTRY`) so
its Role Assignment is Basonta-scoped, exercising `ActorContext.basontaId`
the same way a real Basonta Leader would.

`dev-users.ts` is deliberately zero-import (not even `@ecclesia/rbac`'s
`Role` type) because it's shared between `apps/api` (via the normal
`@ecclesia/*`-aliased Nx graph) and `db/seed-dev-users.ts` (a plain
ts-node script outside the Nx project graph, imported via a relative
path) — path aliases aren't guaranteed to resolve there.

### The login experience

`GET /auth/mode` (`auth.controller.ts`, `@Public()`) tells the frontend
which mode is active before any identity exists. `apps/web-admin`'s
`AuthContext` fetches it once at boot and exposes `mode` /
`devUsers` (from `GET /auth/dev/users`, also `@Public()`, also only
registered in development mode) to `LoginPage`, which renders either:

- the existing Cognito email/password/MFA form (`mode === 'cognito'`, or
  `mode` not yet resolved — the safe default), or
- a radio-button picker of seeded personas plus a single "Sign in" button,
  no password field (`mode === 'development'`).

`POST /auth/dev/login` (`@Public()`, same chicken-and-egg reasoning as a
real Cognito `InitiateAuth` call: the route that produces the token
cannot itself require one) issues the token; the frontend stores it in
`sessionStorage` under a distinct key (`ecclesia.devAccessToken`, never
mixed with Cognito's `ecclesia.refreshToken`) and calls the same
`GET /auth/me` every authenticated session already calls.

**The picker can never render in production**: it is gated purely on
`mode === 'development'`, which can only ever be `'development'` if the
*backend's* `GET /auth/mode` says so — and that route itself only ever
returns `'development'` when `assertAuthModeIsSafe` resolved to
`'development'` at boot. There is no client-side flag, toggle, or query
parameter that can force it.

## Environment variables

| Variable | Required? | Effect |
|---|---|---|
| `AUTH_MODE` | No. Inferred from `NODE_ENV` when unset (`development` → `development`, everything else → `cognito`). | `cognito` \| `development`. Refused at boot if `development` while `NODE_ENV=production`. |
| `NODE_ENV` | No, defaults to `development`. | `development` \| `test` \| `production`. |
| `COGNITO_USER_POOL_ID` / `COGNITO_CLIENT_ID` / `COGNITO_REGION` | Only when the effective `AUTH_MODE` is `cognito`. | Real AWS Cognito User Pool coordinates — unused entirely in development mode. |
| `CORS_ORIGIN` | No. Defaults to `http://localhost:4200` when `NODE_ENV=development`, otherwise CORS stays disabled. | Comma-separated list of origins `main.ts` allows via `app.enableCors()`. See "A gap this guide's own first draft missed: CORS" below. |

See `.env.example` for the fully commented version of the table above.

## A gap this guide's own first draft missed: CORS

The first version of this sprint had no CORS configuration in `apps/api` at
all. `AUTH_MODE`, `DevAuthService`, and every route were all correct and
covered by tests — but the very first real end-to-end run (`pnpm nx serve
api` + `pnpm nx serve web-admin`, opening `http://localhost:4200` in a
browser) still showed the Cognito email/password form instead of the
development picker. The cause was invisible in every test that had been
written: `pnpm lint`/`test`/`build` all mock or bypass `fetch` entirely, so
none of them exercise a real browser's same-origin policy. A real browser
blocks client JS on `http://localhost:4200` from reading a response from
`http://localhost:3000` (a different origin) unless the server explicitly
allows it via CORS headers — `GET /auth/mode` was reaching the API and
returning `{ mode: 'development' }` correctly, but the browser never let
`AuthContext` read that response, so its own `try/catch` fallback (documented
as "assume cognito, the safe default" for exactly the case where `/auth/mode`
can't be reached) silently kicked in.

Fixed by `platform/config/cors.ts`'s `computeCorsOrigins()` + `main.ts`'s
`app.enableCors()` call, gated the same way every other environment-derived
setting in this codebase is: zero configuration needed for local development
(defaults to the one origin `apps/web-admin`'s dev server actually uses),
explicit `CORS_ORIGIN` required for any other deployment. This is disclosed
here rather than silently folded into the sprint's original description
because it is a real, previously-shipped gap that unit/integration tests
structurally cannot catch — worth remembering the next time "all green"
doesn't mean "verified against a real browser."

## Getting started (local development)

```sh
# 1. Bring up Postgres and run migrations (Sprint 1.3's usual steps)
pnpm db:migrate:dev

# 2. Seed the baseline Council/Branch/Configuration fixture
pnpm db:seed

# 3. Seed the six development personas
pnpm db:seed:dev

# 4. Run the API (AUTH_MODE defaults to development when NODE_ENV is unset
#    or "development" - no AUTH_MODE/.env change needed for local work)
pnpm nx serve api

# 5. Run Web Admin
pnpm nx serve web-admin
```

Open `http://localhost:4200`, select a persona (e.g. Resident Pastor),
click **Sign in** — no password. You land on the role-appropriate
dashboard and can navigate every implemented page, all governed by the
real RBAC permission matrix for that persona's actual seeded Role
Assignment. No AWS resource of any kind is created or required.

## Switching to Cognito

Set (or unset, since `cognito` is the safe default) `AUTH_MODE`:

```sh
AUTH_MODE=cognito
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=your-app-client-id
COGNITO_REGION=us-east-1
```

Restart `apps/api`. `DevAuthController`'s routes stop existing in the
router, `DevAuthService` is never constructed, and `LoginPage` renders the
Cognito email/password/MFA form. This is the only mode ever intended to
run in production, and the only mode the deployed environment should ever
carry.

## Security summary

- Production authentication is, and remains, AWS Cognito exactly as
  Blueprint §8.1 (ADR-004) specifies. Nothing in this sprint removes,
  weakens, or modifies `CognitoVerifierService`, `AuthGuard`'s
  Cognito-mode behavior, or `ActorContextResolverService`.
  `cognito-verifier.service.spec.ts`'s existing test suite is unchanged.
- `AUTH_MODE=development` cannot activate in a process where
  `NODE_ENV=production`, even if explicitly set — enforced twice
  (`env.schema.ts` and `auth.module.ts`), independently of each other.
- The development token-signing key is a fixed, public-in-source-code
  constant. This is safe *because* the service that uses it cannot be
  constructed in production, not despite it — there is no secret value
  anywhere in this sprint's code that protects anything a real deployment
  depends on.
- Every request in development mode still passes through the same
  `ActorContextResolverService.resolve()` → RBAC → permission-matrix
  pipeline as a real Cognito-authenticated request. There is no
  authorization shortcut anywhere in this sprint — only the identity
  source differs.
