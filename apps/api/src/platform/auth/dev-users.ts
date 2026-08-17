/**
 * Development Authentication sprint - STEP 4's seeded user roster.
 *
 * Deliberately zero imports, not even `@ecclesia/rbac`'s `Role` type.
 * This file is imported from two places: `apps/api`'s own
 * `DevAuthController`/`DevAuthService` (via the normal `@ecclesia/*`-aliased
 * Nx graph) *and* `db/seed-dev-users.ts` (a plain Node/ts-node script run
 * outside the Nx project graph, via a relative import - see that script's
 * own comment). `@ecclesia/*` path aliases are not guaranteed to resolve
 * outside the Nx-aware build/test toolchain, so this file - and everything
 * it imports - must not depend on one. `DevUserRole` is therefore a plain
 * string-literal union, hand-matched against `@ecclesia/rbac`'s `Role`
 * type (`libs/rbac/src/lib/roles.ts`) rather than importing it; consumers
 * inside `apps/api` narrow to `Role` at the point of use.
 *
 * `[Multi-Tenant Foundation, Phase 2]` Nine portal personas - exactly the
 * approved organizational model, one seeded login per role type:
 * Resident Pastor, Council Administrator, Council Treasurer, Branch
 * Pastor, Branch Administrator, Branch Treasurer, Bacenta Leader, Basonta
 * Leader, System Administrator. No standalone Usher persona - an usher is
 * a member/worker of the Ushering Basonta, not its own login; the seeded
 * `dev-basonta-leader` persona *is* the Head of Ushers, associated with
 * the Ushering Basonta specifically (see `db/seed-dev-users.ts`'s own
 * comment on this).
 *
 * `id` values are stable across this phase's roster change: every persona
 * that already existed before Phase 2 keeps its original `id`
 * (`cognitoSub`) unchanged, so a database already seeded under the prior
 * six/seven-persona roster upgrades in place on the next `db:seed:dev`
 * run rather than orphaning old rows under new ids (`fixtureIds()` in
 * `db/seed-dev-users.ts` was previously derived from array *position*,
 * which this reordering would have silently broken - fixed there
 * alongside this change, see that file's own comment). `dev-usher` is
 * simply no longer listed here - `DevAuthService.listAvailableUsers()`
 * already filters this array against what's actually seeded in
 * `platform.users`, so removing it from this array is sufficient to make
 * it permanently unreachable via the login picker. This file performs no
 * destructive database operation itself (a stale `dev-usher` row from a
 * database seeded before this change is simply orphaned, not deleted -
 * out of scope for a roster definition, and Postgres wasn't reachable in
 * this environment to test a delete step safely regardless).
 */

export type DevUserRole =
  | 'RESIDENT_PASTOR'
  | 'COUNCIL_OVERSEER'
  | 'COUNCIL_TREASURER'
  | 'ASSISTANT_PASTOR'
  | 'ADMIN'
  | 'TREASURER'
  | 'BACENTA_LEADER'
  | 'BASONTA_LEADER'
  | 'SYSTEM_ADMINISTRATOR';

export interface DevUserSeed {
  /**
   * Doubles as this seeded user's `platform.users.cognito_sub` - see
   * `dev-auth.service.ts`'s doc comment for why a development access
   * token's `sub` claim is simply this string, with no real Cognito
   * identity behind it at all.
   */
  id: string;
  label: string;
  role: DevUserRole;
  email: string;
  firstName: string;
  lastName: string;
  /**
   * `[Multi-Tenant Foundation, Phase 2]` Optional secondary context shown
   * under the role label on the login picker (e.g. "River of Life
   * Headquarters", "Grace Bacenta", "Ushering") - makes which Branch/
   * Bacenta/Basonta a Branch- or group-scoped persona belongs to obvious
   * without folding that information into the role identifier itself
   * (`role`/`label` above stay exactly the nine canonical persona names).
   * Absent for Council-scoped (`RESIDENT_PASTOR`/`COUNCIL_OVERSEER`/
   * `COUNCIL_TREASURER`) and platform-scoped (`SYSTEM_ADMINISTRATOR`)
   * personas, which have no single Branch/group to name this way - their
   * real scope is Council-wide or platform-wide, and a Branch label here
   * would misleadingly suggest otherwise.
   */
  context?: string;
}

export const DEV_USER_SEEDS: readonly DevUserSeed[] = [
  {
    id: 'dev-resident-pastor',
    label: 'Resident Pastor',
    role: 'RESIDENT_PASTOR',
    email: 'resident.pastor@dev.ecclesia.local',
    firstName: 'Resident',
    lastName: 'Pastor',
  },
  {
    id: 'dev-council-administrator',
    label: 'Council Administrator',
    role: 'COUNCIL_OVERSEER',
    email: 'council.administrator@dev.ecclesia.local',
    firstName: 'Council',
    lastName: 'Administrator',
  },
  {
    id: 'dev-council-treasurer',
    label: 'Council Treasurer',
    role: 'COUNCIL_TREASURER',
    email: 'council.treasurer@dev.ecclesia.local',
    firstName: 'Council',
    lastName: 'Treasurer',
  },
  {
    id: 'dev-assistant-pastor',
    label: 'Branch Pastor',
    role: 'ASSISTANT_PASTOR',
    email: 'branch.pastor@dev.ecclesia.local',
    firstName: 'Branch',
    lastName: 'Pastor',
    context: 'River of Life Headquarters',
  },
  {
    id: 'dev-super-administrator',
    label: 'Branch Administrator',
    role: 'ADMIN',
    email: 'branch.administrator@dev.ecclesia.local',
    firstName: 'Branch',
    lastName: 'Administrator',
    context: 'River of Life Headquarters',
  },
  {
    id: 'dev-treasurer',
    label: 'Branch Treasurer',
    role: 'TREASURER',
    email: 'branch.treasurer@dev.ecclesia.local',
    firstName: 'Branch',
    lastName: 'Treasurer',
    context: 'River of Life Headquarters',
  },
  {
    id: 'dev-bacenta-leader',
    label: 'Bacenta Leader',
    role: 'BACENTA_LEADER',
    email: 'bacenta.leader@dev.ecclesia.local',
    firstName: 'Bacenta',
    lastName: 'Leader',
    context: 'Grace Bacenta',
  },
  {
    id: 'dev-basonta-leader',
    label: 'Basonta Leader',
    role: 'BASONTA_LEADER',
    email: 'basonta.leader@dev.ecclesia.local',
    firstName: 'Basonta',
    lastName: 'Leader',
    context: 'Ushering',
  },
  {
    id: 'dev-system-administrator',
    label: 'System Administrator',
    role: 'SYSTEM_ADMINISTRATOR',
    email: 'system.administrator@dev.ecclesia.local',
    firstName: 'System',
    lastName: 'Administrator',
  },
] as const;

/**
 * `[Multi-Tenant Foundation, Phase 2]` Which `RoleAssignment` shape a
 * given `DevUserRole` requires, per the Phase 1 rules
 * (`db/schema.prisma`'s `role_assignments_branch_xor_council_check`):
 * exactly one of `branchId`/`councilId`, never both, never neither.
 *
 * - `'COUNCIL'` - `branchId` null, `councilId` set (Resident Pastor,
 *   Council Administrator, Council Treasurer).
 * - `'BRANCH'` - `branchId` set, `councilId` null. Covers both plain
 *   Branch-scoped roles (Branch Pastor/Administrator/Treasurer) and
 *   own-group roles (Bacenta/Basonta Leader) identically at this level -
 *   the CHECK constraint only cares about branchId/councilId, not
 *   `groupId`; own-group scoping is a separate field `db/seed-dev-users.ts`
 *   sets independently once it knows which kind this is.
 * - `'PLATFORM'` - System Administrator. Also structurally `branchId` set
 *   (Person.branchId is NOT NULL regardless of role, and the CHECK
 *   constraint requires *some* value here) - but this is a schema-
 *   compliance formality, not an authorization grant. `permission-matrix.ts`
 *   has exactly one `SYSTEM_ADMINISTRATOR` row (`platform.tenant.read` at
 *   `GLOBAL` scope) and zero rows at `BRANCH` scope for this role, so a
 *   populated `branchId` on this RoleAssignment grants no Branch-scoped
 *   church data access whatsoever - kept as its own named case, not
 *   folded into `'BRANCH'`, specifically so this distinction stays
 *   visible at every call site rather than reading as "just another
 *   Branch-scoped role."
 *
 * Pure and DB-free on purpose - unit-testable without a live Postgres
 * connection (`dev-users.spec.ts`), and the one place this branch/council
 * decision is made, so `db/seed-dev-users.ts` calls this instead of
 * re-deriving the same mapping inline, which could otherwise silently
 * drift from the Phase 1 rules over time.
 */
export type RoleAssignmentScopeKind = 'COUNCIL' | 'BRANCH' | 'PLATFORM';

export function roleAssignmentScopeKindFor(role: DevUserRole): RoleAssignmentScopeKind {
  switch (role) {
    case 'RESIDENT_PASTOR':
    case 'COUNCIL_OVERSEER':
    case 'COUNCIL_TREASURER':
      return 'COUNCIL';
    case 'SYSTEM_ADMINISTRATOR':
      return 'PLATFORM';
    case 'ASSISTANT_PASTOR':
    case 'ADMIN':
    case 'TREASURER':
    case 'BACENTA_LEADER':
    case 'BASONTA_LEADER':
      return 'BRANCH';
  }
}
