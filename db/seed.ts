/**
 * Development seed script (Sprint 1.3, widened by the Multi-Tenant
 * Foundation Phase 2). Seeds the organizational *skeleton* - Tenant,
 * Council, Branches, Configuration - so `db:migrate` -> `db:seed` ->
 * `nx serve api` -> `/health` produces a database with real rows to
 * query. People/RoleAssignment/Group(Bacenta,Basonta)/Gathering/
 * FinancialTransaction fixture data lives in `db/seed-dev-users.ts`
 * (run after this script), not here - keeping this file's job to
 * exactly "the organizational structure the dev-user roster and its
 * surrounding realistic data attach to," matching the boundary Sprint
 * 1.3 originally drew between the two scripts.
 *
 * Idempotent: safe to run more than once against the same database
 * (upsert, not insert).
 *
 * `[Multi-Tenant Foundation, Phase 1]` `SEED_TENANT_ID` added, and the
 * Council upsert's `update` clause also sets `tenantId` (not left `{}`) -
 * deliberate, not an oversight: on a database that already ran
 * `db:seed` *before* this phase's migration, the migration's own
 * backfill (see its Part 1) already gave the existing Council a fresh,
 * randomly-generated placeholder Tenant. Re-running this script
 * afterward re-points it at this fixed, well-known `SEED_TENANT_ID`
 * instead, so the seed stays deterministic - the migration's
 * auto-generated backfill Tenant is left orphaned (harmless: dev-only
 * data, `Council.tenantId`'s `onDelete: Restrict` only prevents deleting
 * a Tenant that still has a Council pointing at it, not an empty one).
 *
 * `[Multi-Tenant Foundation, Phase 2]` Names converged from the
 * generic "Example Council/Branch" placeholders to the real approved
 * organization - "River of Life" is the first tenant, not a
 * placeholder - and a second Branch (Asokwa) added. Every `upsert`'s
 * `update` clause now sets `name` (previously left `{}` for the Branch)
 * so a database seeded under the old placeholder names converges to the
 * new ones on the next `db:seed` run, the same "re-run corrects drifted
 * fields" discipline Phase 1 already established for the Council. Same
 * fixed ids throughout - `SEED_BRANCH_ID` is unchanged (renamed
 * `SEED_BRANCH_HQ_ID` here purely for read­ability now that a second
 * Branch id exists alongside it; the literal UUID value is identical, so
 * this is not a breaking change for `db/seed-dev-users.ts`, which
 * duplicates the same literal under its own name).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_TENANT_ID = '00000000-0000-0000-0000-000000000003';
const SEED_COUNCIL_ID = '00000000-0000-0000-0000-000000000001';
const SEED_BRANCH_HQ_ID = '00000000-0000-0000-0000-000000000002';
const SEED_BRANCH_ASOKWA_ID = '00000000-0000-0000-0000-000000000005';

async function main(): Promise<void> {
  const tenant = await prisma.tenant.upsert({
    where: { id: SEED_TENANT_ID },
    update: { name: 'River of Life' },
    create: {
      id: SEED_TENANT_ID,
      name: 'River of Life',
    },
  });

  const council = await prisma.council.upsert({
    where: { id: SEED_COUNCIL_ID },
    update: { tenantId: tenant.id, name: 'River of Life Council' },
    create: {
      id: SEED_COUNCIL_ID,
      tenantId: tenant.id,
      name: 'River of Life Council',
    },
  });

  const headquarters = await prisma.branch.upsert({
    where: { id: SEED_BRANCH_HQ_ID },
    update: { name: 'River of Life Headquarters' },
    create: {
      id: SEED_BRANCH_HQ_ID,
      councilId: council.id,
      name: 'River of Life Headquarters',
      timezone: 'Africa/Accra',
    },
  });

  // `[Multi-Tenant Foundation, Phase 2]` Second Branch - the whole point
  // of this phase is to prove a Council-scoped user (Resident Pastor/
  // Council Administrator/Council Treasurer) can see across Branches
  // while a Branch-scoped user stays isolated to one. That's untestable
  // with only one Branch in the database, regardless of how correct the
  // RBAC/RLS logic is - this Branch exists specifically to make that a
  // real, checkable fact, not just a unit-tested abstraction.
  const asokwa = await prisma.branch.upsert({
    where: { id: SEED_BRANCH_ASOKWA_ID },
    update: { name: 'River of Life Asokwa Branch' },
    create: {
      id: SEED_BRANCH_ASOKWA_ID,
      councilId: council.id,
      name: 'River of Life Asokwa Branch',
      timezone: 'Africa/Accra',
    },
  });

  for (const branch of [headquarters, asokwa]) {
    await prisma.configuration.upsert({
      where: { branchId: branch.id },
      update: {},
      create: {
        branchId: branch.id,
        // Placeholder values only - see db/DESIGN_NOTES.md's open questions
        // for what these should actually contain once the Church Pulse
        // weighting model, follow-up SLA defaults, and silent-drift
        // thresholds are pinned down for a real Branch.
        gatheringTypes: ['SUNDAY_SERVICE', 'CELL_MEETING'],
        churchPulseWeights: {},
        poimenGateEnabled: false,
        followupSlaDefaults: {},
        silentDriftConfig: {},
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `Seeded Tenant ${tenant.id} (${tenant.name}), Council ${council.id} (${council.name}), and Branches ` +
      `${headquarters.id} (${headquarters.name}) + ${asokwa.id} (${asokwa.name})`,
  );
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
