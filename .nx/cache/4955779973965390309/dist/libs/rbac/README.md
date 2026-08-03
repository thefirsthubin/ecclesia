# libs/rbac

The permission matrix (PRD §17.3) transcribed as versioned, executable
code (Blueprint §9.3), the record-level policy checks it references
(Blueprint §9.1, §9.4), the framework-agnostic authorization engine that
evaluates them (Blueprint §9.2), and the NestJS guards/decorator that
apply it at the controller layer (Blueprint §9.4).

**Status (Sprint 1.1):** implemented and tested. This is the RBAC
*specification and engine*, not authentication - it consumes an
`ActorContext` that Sprint 1.4 (Cognito authentication) will populate
from a validated JWT, and a `ResourceContext` that each domain module
populates as it is built. No database models, no HTTP wiring into
`apps/api`, and no business logic beyond authorization itself exist here
yet, per Sprint 0/1's scope.

## What's here

| File | Purpose |
|---|---|
| `roles.ts` | The 11-role catalog (PRD §17.2), including `ACTING_RESIDENT_PASTOR` (Blueprint §8.6 succession runbook) |
| `actions.ts` | The action taxonomy derived from PRD §17.3's 18 domain/action rows |
| `types.ts` | `PermissionRule`, `Scope`, `Effect`, `ActorContext`, `ResourceContext`, etc. |
| `permission-matrix.ts` | `PERMISSION_MATRIX` - PRD §17.3 transcribed row-for-row, cited by PRD section/business rule ID |
| `record-level-checks.ts` | `DIFFERENT_ACTOR_THAN_RECORDER` (BR-STW-04) and `POIMEN_GATE_IF_ENABLED` (resolved OQ-02) |
| `evaluate.ts` | The deny-overrides-allow authorization engine (Blueprint §9.2) |
| `guards/rbac.guard.ts`, `guards/record-level-policy.guard.ts` | NestJS `CanActivate` adapters around the engine, used together per Blueprint §9.4 |
| `decorators/require-permission.decorator.ts` | `@RequirePermission(action)` |
| `permission-matrix.spec.ts` | The executable specification (Blueprint §9.5): walks every rule in the matrix and asserts `evaluate()` agrees, including every explicit-deny cell |

## Usage (once a controller exists to use it)

```ts
@RequirePermission('stewardship.transaction.verify')
@UseGuards(RbacGuard, RecordLevelPolicyGuard)
async verifyTransaction(@Param('id') id: string) { ... }
```

`RbacGuard` and `RecordLevelPolicyGuard` both expect an
`EcclesiaRequestContext` (`actor`, `resource`, `branchConfig`) to already
be attached to the request - populating that from a real JWT and a real
fetched record is out of scope for this library and lands with
authentication (Sprint 1.4) and each domain module respectively.

## Module boundary

Depends only on `@ecclesia/contracts` (unused today, but the constraint
is enforced by `eslint.config.cjs`'s `@nx/enforce-module-boundaries` -
this library is infrastructure, not domain logic, and must never import
a domain library).
