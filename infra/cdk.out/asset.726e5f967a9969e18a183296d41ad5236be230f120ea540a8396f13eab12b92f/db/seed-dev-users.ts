/**
 * Development Authentication sprint - STEP 4's seeded user roster, made
 * real in the database. Companion to `db/seed.ts` (Sprint 1.3's minimal
 * Council/Branch/Configuration seed) rather than a replacement for it -
 * run `pnpm db:seed` first, then this script, exactly as
 * `DEV_USER_SEEDS`' roster and `DevAuthService`'s own "not seeded yet, run
 * pnpm db:seed:dev" error message both assume.
 *
 * For each of the six `DEV_USER_SEEDS` entries (`apps/api/src/platform/auth/dev-users.ts`,
 * imported via a **relative** path, not the `@ecclesia/*` alias - see that
 * file's own comment on why: this script runs outside the Nx project
 * graph, under plain ts-node, where path-alias resolution isn't
 * guaranteed), this creates:
 *
 * - A `people.persons` row (STEP 4: "Each should already possess Person...
 *   through the existing RBAC system").
 * - A `platform.users` row whose `cognito_sub` is exactly the dev user's
 *   `id` (e.g. `"dev-resident-pastor"`) - the same fact `DevAuthService`'s
 *   own doc comment leans on to make its issued tokens resolve through the
 *   *unmodified* `ActorContextResolverService.resolve()` path.
 * - A `people.role_assignments` row granting the dev user's `role`,
 *   Branch-wide (STEP 7: "No shortcuts... every request must still pass
 *   through... RBAC" - a real, database-backed Role Assignment, not a
 *   hard-coded in-memory one).
 *
 * `dev-basonta-leader` additionally gets a `people.groups` row (type
 * `MINISTRY`, i.e. a Basonta) so its Role Assignment is Basonta-scoped,
 * not just Branch-wide - the only one of the six personas whose
 * `ActorContext` needs `basontaId` populated
 * (`actor-context-resolver.service.ts`'s `assignment.group.type === 'MINISTRY'`
 * branch) to be a meaningful RBAC exercise.
 *
 * Idempotent (upsert throughout, fixed deterministic UUIDs below) - safe
 * to re-run, matching `db/seed.ts`'s own convention. Reuses that same
 * script's Council/Branch fixed UUIDs so both scripts operate on the same
 * seeded Branch rather than creating a second one.
 *
 * Refuses to run when `NODE_ENV=production` - a seeded, password-less
 * login roster has no business existing outside development, the same
 * "impossible to activate accidentally in production" concern
 * `auth-mode.ts` applies to the token verifier itself.
 */
import type { Role as PrismaRole } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

import { DEV_USER_SEEDS } from '../apps/api/src/platform/auth/dev-users';

const prisma = new PrismaClient();

// Matches db/seed.ts exactly - both scripts target the same seeded Branch.
const SEED_BRANCH_ID = '00000000-0000-0000-0000-000000000002';

const SEED_BASONTA_GROUP_ID = '00000000-0000-0000-0000-000000000050';

/**
 * `DevUserRole` (`dev-users.ts`) is a hand-matched plain string union, not
 * an import of `@ecclesia/rbac`'s `Role` type - see that file's comment.
 * Prisma's generated `Role` enum (imported here as `PrismaRole`, this
 * script's only Prisma-schema-derived type) has the identical literal
 * values, so this cast is safe by construction, not a guess: every
 * `DevUserRole` value is one of `db/schema.prisma`'s `Role` enum values
 * verbatim.
 */
function toPrismaRole(role: string): PrismaRole {
  return role as PrismaRole;
}

/** Deterministic per-dev-user fixture ids - fixed, not random, so this
 * script stays idempotent (`db/seed.ts`'s own convention). Index-derived
 * from `DEV_USER_SEEDS`' fixed array order rather than hashing each `id`,
 * for readability. */
function fixtureIds(index: number): { personId: string; userId: string; roleAssignmentId: string } {
  return {
    personId: `00000000-0000-0000-0000-${(100 + index * 3).toString().padStart(12, '0')}`,
    userId: `00000000-0000-0000-0000-${(101 + index * 3).toString().padStart(12, '0')}`,
    roleAssignmentId: `00000000-0000-0000-0000-${(102 + index * 3).toString().padStart(12, '0')}`,
  };
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'db:seed:dev refuses to run when NODE_ENV=production - this seeds a password-less development login ' +
        'roster, which must never exist outside a development database. See DEVELOPMENT_AUTHENTICATION_GUIDE.md.',
    );
  }

  const branch = await prisma.branch.findUnique({ where: { id: SEED_BRANCH_ID } });
  if (!branch) {
    throw new Error(
      `Seeded Branch ${SEED_BRANCH_ID} does not exist yet - run "pnpm db:seed" before "pnpm db:seed:dev".`,
    );
  }

  const basontaGroup = await prisma.group.upsert({
    where: { id: SEED_BASONTA_GROUP_ID },
    update: {},
    create: {
      id: SEED_BASONTA_GROUP_ID,
      branchId: SEED_BRANCH_ID,
      type: 'MINISTRY',
      name: 'Example Basonta (seed data - not a real group)',
      category: 'Development seed',
    },
  });

  for (const [index, seed] of DEV_USER_SEEDS.entries()) {
    const ids = fixtureIds(index);
    const groupId = seed.id === 'dev-basonta-leader' ? basontaGroup.id : null;

    const person = await prisma.person.upsert({
      where: { id: ids.personId },
      update: {},
      create: {
        id: ids.personId,
        branchId: SEED_BRANCH_ID,
        firstName: seed.firstName,
        lastName: seed.lastName,
        email: seed.email,
        lifecycleStage: 'MEMBER',
      },
    });

    await prisma.user.upsert({
      where: { id: ids.userId },
      update: {},
      create: {
        id: ids.userId,
        branchId: SEED_BRANCH_ID,
        personId: person.id,
        // The fact this equals `seed.id` (not a real Cognito sub) is what
        // makes DevAuthService's issued tokens resolve through the real,
        // unmodified ActorContextResolverService - see this file's own
        // top comment.
        cognitoSub: seed.id,
        authMethod: 'EMAIL_PASSWORD',
        email: seed.email,
      },
    });

    await prisma.roleAssignment.upsert({
      where: { id: ids.roleAssignmentId },
      update: {},
      create: {
        id: ids.roleAssignmentId,
        personId: person.id,
        role: toPrismaRole(seed.role),
        branchId: SEED_BRANCH_ID,
        groupId,
      },
    });

    // eslint-disable-next-line no-console
    console.log(`Seeded development user "${seed.label}" (${seed.id}) -> Person ${person.id}`);
  }
}

main()
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
