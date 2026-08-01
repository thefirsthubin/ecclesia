/**
 * Development seed script (Sprint 1.3). Deliberately minimal: one example
 * Branch and its Configuration row, so `db:migrate` -> `db:seed` ->
 * `nx serve api` -> `/health` produces a database with at least one real
 * row to query, without inventing People/RoleAssignment/Gathering/
 * FinancialTransaction fixture data that would look like real business
 * content pretending to be evidenced by the Blueprint (see
 * db/DESIGN_NOTES.md - this schema is itself a draft pending Blueprint
 * review, and fixture data for it would compound that risk).
 *
 * Idempotent: safe to run more than once against the same database
 * (upsert, not insert).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const branch = await prisma.branch.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Example Branch (seed data - not a real church)',
      timezone: 'Africa/Accra',
    },
  });

  await prisma.configuration.upsert({
    where: { branchId: branch.id },
    update: {},
    create: {
      branchId: branch.id,
      // Placeholder values only - see db/DESIGN_NOTES.md's open questions
      // for what these should actually contain once the Blueprint's
      // gathering-type list, Church Pulse weighting model, and follow-up
      // SLA defaults are known.
      gatheringTypes: ['SUNDAY_SERVICE', 'CELL_MEETING'],
      churchPulseWeights: {},
      poimenGateEnabled: false,
      followupSlaDefaults: {},
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded example Branch ${branch.id} (${branch.name})`);
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
