/**
 * Development seed script (Sprint 1.3). Deliberately minimal: one example
 * Council, Branch, and Configuration row, so `db:migrate` -> `db:seed` ->
 * `nx serve api` -> `/health` produces a database with at least one real
 * row to query, without inventing People/RoleAssignment/Gathering/
 * FinancialTransaction fixture data that would look like real business
 * content pretending to be evidenced by the Blueprint/PRD (see
 * db/DESIGN_NOTES.md for what's real-Blueprint-sourced vs. inferred in
 * this schema).
 *
 * Idempotent: safe to run more than once against the same database
 * (upsert, not insert).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_COUNCIL_ID = '00000000-0000-0000-0000-000000000001';
const SEED_BRANCH_ID = '00000000-0000-0000-0000-000000000002';

async function main(): Promise<void> {
  const council = await prisma.council.upsert({
    where: { id: SEED_COUNCIL_ID },
    update: {},
    create: {
      id: SEED_COUNCIL_ID,
      name: 'Example Council (seed data - not a real church body)',
    },
  });

  const branch = await prisma.branch.upsert({
    where: { id: SEED_BRANCH_ID },
    update: {},
    create: {
      id: SEED_BRANCH_ID,
      councilId: council.id,
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

  // eslint-disable-next-line no-console
  console.log(`Seeded example Council ${council.id} and Branch ${branch.id} (${branch.name})`);
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
