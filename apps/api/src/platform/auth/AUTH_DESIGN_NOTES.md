# Sprint 1.4 — Authentication design notes

Read this alongside `db/DESIGN_NOTES.md` (the schema this sprint reads
from) and `libs/rbac/src/lib/request-context.ts` (the contract this
sprint fulfills the `actor` half of). Same discipline as every prior
sprint: every design choice below cites the Blueprint/PRD section it
comes from, or is explicitly flagged as inferred/unresolved.

## What this sprint builds

`apps/api` is a pure OIDC resource server (Blueprint §8.1: "integrated ...
via standard OIDC/JWT validation middleware"). It never issues, refreshes,
or revokes tokens - Cognito does that directly with the client. This
sprint's only job is: given a request bearing a Cognito access token,
verify it and resolve it to the `ActorContext` shape `libs/rbac`'s
already-built guards (Sprint 1.1) consume.

| File | Purpose |
|---|---|
| `cognito-verifier.service.ts` | Wraps `aws-jwt-verify`'s `CognitoJwtVerifier`, configured for `tokenUse: 'access'` (Blueprint §8.3: the access token, not the ID token, is "presented on every API request"). |
| `actor-context-resolver.service.ts` | `platform.users.cognito_sub` → `people.persons` → active `people.role_assignments` → `ActorContext`. See "Open questions" below for two real gaps found here. |
| `auth.guard.ts` | Global guard (`APP_GUARD`): extracts the Bearer token, verifies it, resolves the actor, attaches `request.actorContext`. Opt out via `@Public()` (only `GET /health` uses this). |
| `decorators/current-actor.decorator.ts` | `@CurrentActor()` - controller-facing accessor for `request.actorContext`. |
| `decorators/public.decorator.ts` | `@Public()` - opts a route out of `AuthGuard`. |
| `../audit/audit-log.service.ts` | Shared `platform.audit_log` writer. `AuthGuard` uses it to log verification failures (Blueprint §8.5). |

## What this sprint deliberately does not build

- **A login/refresh/logout endpoint.** There isn't one, by design (§8.1) - the mobile/web client authenticates directly against Cognito.
- **The full `EcclesiaRequestContext`** (`{ actor, resource, branchConfig }`) that `RbacGuard` ultimately reads. `request-context.ts`'s own comment splits this into two separate pieces: `actor` from a validated JWT (this sprint) and `resource`/`branchConfig` from "whatever record the endpoint is acting on ... each domain module as it is built" (People domain and beyond, not yet built). This sprint only produces the first half (`request.actorContext`); a future per-endpoint interceptor in each domain module is responsible for combining it with the loaded resource into the shape `RbacGuard` expects.
- **Cognito Lambda triggers or any AWS infrastructure.** Nothing in this sandbox can provision or call real AWS services. `COGNITO_USER_POOL_ID`/`COGNITO_CLIENT_ID`/`COGNITO_REGION` must point at a real, already-provisioned User Pool before any of this can be end-to-end tested - same category of limitation as `DATABASE_URL` in Sprint 1.3, disclosed the same way.
- **§8.5's full event list** (login, MFA challenge outcome, token refresh, token revocation). See Open Question #3 below - this sprint only logs token-verification failures at the API boundary, which is the one auth event this API layer can actually observe on its own.
- **Closing the pre-existing §9.6 gap** (RBAC DENY decisions from `RbacGuard`/`RecordLevelPolicyGuard`, built Sprint 1.1, are still never written to `platform.audit_log` - that table didn't exist until Sprint 1.3). Investigated during this sprint; not fixed, because doing it properly requires either extending `AllExceptionsFilter` to special-case guard-thrown `ForbiddenException`s carrying a decision, or a Person→User reverse lookup for every denial, both of which are real enough pieces of design that they deserve their own reviewed change rather than a bolt-on here. Flagged as a recommended near-term follow-up, not silently dropped.

## Open questions (genuinely unresolved by the source documents)

1. **CLUSTER scope has no resolvable identifier.** `libs/rbac/src/lib/evaluate.ts`'s `resourceInScope()` checks `actor.clusterId === resource.clusterId` - a single-value equality. But `db/schema.prisma` has no Cluster entity and no `cluster_id` column anywhere (PRD's own words: "cluster assignment is itself a configuration, not a hard-coded structure" - `db/DESIGN_NOTES.md` Open Question #1). This sprint's resolver therefore never populates `ActorContext.clusterId`, which means **every `CLUSTER`-scope permission rule (Assistant Pastor's grants) will always evaluate to DENY**, unconditionally, once wired to a real endpoint. This is a fail-closed default (never fail-open), but it is a real product gap: Assistant Pastors will have no working cluster-scoped actions until either (a) a real cluster identifier is added to the schema, or (b) `libs/rbac`'s `Scope`/`ActorContext` shape is changed to compare against a *set* of Bacenta ids instead of one cluster id. This needs a decision before Pastoral Care domain work locks in Assistant Pastor's permissions.
2. **Multiple concurrent active Role Assignments.** `ActorContext.role` is a single `Role` (Sprint 1.1 design, unchanged here). Neither document says what happens when a Person holds two roles at once. `ActorContextResolverService.resolve()` throws `ConflictException` rather than guessing - if this turns out to be a real, intended scenario (e.g. someone is both Treasurer and a Shepherd), the fix is a genuine design change (multi-role `ActorContext`, or a client-specified "acting as" selection), not a priority-ordering heuristic.
3. **How does `platform.audit_log` learn about login/MFA/refresh/revocation events?** Blueprint §8.5 requires logging all four; our API only ever observes "a request arrived bearing token X," since Cognito issues/refreshes/revokes tokens directly with the client, not through our API. The likely real mechanism is a Cognito Lambda trigger (PostAuthentication, etc.) calling an internal endpoint, or publishing to EventBridge for the Worker to consume (Blueprint Chapter 4's event architecture) - this is AWS infrastructure/Lambda code, out of this sprint's (and this sandbox's) reach.
4. **`MEMBER`/`VISITOR` as implicit, non-Role-Assignment roles.** BR-PPL-04 names five roles (Worker, Shepherd, Assistant Pastor, Resident Pastor, Treasurer) as Role Assignments requiring `lifecycle_stage = Member`; it does not say whether `MEMBER` and `VISITOR` themselves need a materialized `role_assignments` row. This resolver treats them as implicit, derived from `lifecycle_stage` when no explicit Role Assignment exists, citing the PRD's own "baseline authenticated role" framing for Member (~line 1169). Reasonably grounded, not a verbatim citation - worth confirming once People domain work needs to create/query these.
5. **`X-Device-Id` header name.** Blueprint §8.5 requires logging a "device identifier" but names no header/claim. Inferred as a custom `X-Device-Id` header, reusing the same device identifier §8.3 already requires the mobile client to generate for its device-bound refresh token - not a citation, a design choice for consistency.

## Known sandbox limitation

`pnpm install`, `pnpm lint`, `pnpm test`, and `pnpm build` have now been run for real (on the user's machine, not this sandbox) and all pass, including `api:test` with this sprint's mocked-Cognito/mocked-Prisma unit tests. What remains unverified is end-to-end integration against a **real, provisioned Cognito User Pool** - `COGNITO_USER_POOL_ID`/`COGNITO_CLIENT_ID`/`COGNITO_REGION` have never been set to real values, and no real access token has ever been passed through `CognitoVerifierService`. Unit tests mock `CognitoJwtVerifier` and `PrismaService` throughout; they verify this code's own logic, not real Cognito/Postgres integration. That verification requires a provisioned User Pool (Blueprint Ch.5 infra, not yet built) and is out of reach until then.
