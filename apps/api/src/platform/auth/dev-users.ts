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
 * Six personas, matching the sprint brief's own example list (STEP 4:
 * "Resident Pastor, Assistant Pastor, Treasurer, Basonta Leader, Council
 * Administrator, Super Administrator"). Two of those six labels are not
 * literal values of the `Role` enum (`db/schema.prisma`) - "Council
 * Administrator" and "Super Administrator" are the brief's own plain-
 * English phrasing, not RBAC role names. Mapped to the closest actual
 * `Role` values: "Council Administrator" -> `COUNCIL_OVERSEER` (the only
 * council-level role the RBAC catalog defines - PRD §17.2), "Super
 * Administrator" -> `ADMIN` (the only platform-configuration role the
 * catalog defines). This mapping is disclosed here, not silently assumed.
 */

export type DevUserRole = 'RESIDENT_PASTOR' | 'ASSISTANT_PASTOR' | 'TREASURER' | 'BASONTA_LEADER' | 'COUNCIL_OVERSEER' | 'ADMIN';

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
    id: 'dev-assistant-pastor',
    label: 'Assistant Pastor',
    role: 'ASSISTANT_PASTOR',
    email: 'assistant.pastor@dev.ecclesia.local',
    firstName: 'Assistant',
    lastName: 'Pastor',
  },
  {
    id: 'dev-treasurer',
    label: 'Treasurer',
    role: 'TREASURER',
    email: 'treasurer@dev.ecclesia.local',
    firstName: 'Branch',
    lastName: 'Treasurer',
  },
  {
    id: 'dev-basonta-leader',
    label: 'Basonta Leader',
    role: 'BASONTA_LEADER',
    email: 'basonta.leader@dev.ecclesia.local',
    firstName: 'Basonta',
    lastName: 'Leader',
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
    id: 'dev-super-administrator',
    label: 'Super Administrator',
    role: 'ADMIN',
    email: 'super.administrator@dev.ecclesia.local',
    firstName: 'Super',
    lastName: 'Administrator',
  },
] as const;
