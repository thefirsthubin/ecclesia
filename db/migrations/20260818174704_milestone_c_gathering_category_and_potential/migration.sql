-- `[Milestone C: Portal Read Models + Analytics]` Two additions from
-- Phase 1's approved product decisions:
--
-- 1. `gathering_type_category_mappings` (decision #1) - the canonical
--    conceptual-category mapping. `Gathering.type`/`Configuration.gathering_types`
--    are untouched by this migration; this table adds one new fact per
--    Branch per configured type string (which of SUNDAY/MIDWEEK/
--    BACENTA_MEETING/BASONTA_MEETING/OTHER it means), never a guess. An
--    unmapped configured type simply has no row here.
--
-- 2. `potentials` (decision #4) - a new, minimal representation, added
--    only after this milestone's audit confirmed no existing table
--    (`OutreachContact`, `Person.lifecycleStage`) could safely stand in
--    for it without silently conflating distinct concepts.
--
-- Both tables live in already-existing schemas (`gatherings`, `people`)
-- whose `ALTER DEFAULT PRIVILEGES` rule (established in the Row-Level
-- Security sprint's own migration) already covers brand-new tables added
-- to them later - confirmed live for this exact migration via
-- `information_schema.role_table_grants`, the same verification Milestone
-- B's own Slices 4-6 already established as the precedent; no new GRANT
-- statements are needed here. RLS is enabled on both, the same simple
-- `branch_id` equality backstop every other Branch-scoped table in this
-- schema already carries - the real authorization boundary for both is
-- the `libs/rbac` permission-matrix rows this milestone adds
-- (`stewardship.transaction.read` parity/visibility rows, and
-- `people.potential.*`), not this policy.

-- CreateEnum
CREATE TYPE "gatherings"."GatheringCategory" AS ENUM ('SUNDAY', 'MIDWEEK', 'BACENTA_MEETING', 'BASONTA_MEETING', 'OTHER');

-- CreateEnum
CREATE TYPE "people"."PotentialSource" AS ENUM ('OUTREACH', 'REFERRAL', 'WALK_IN', 'OTHER');

-- CreateEnum
CREATE TYPE "people"."PotentialStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'CONVERTED', 'CLOSED');

-- CreateTable
CREATE TABLE "gatherings"."gathering_type_category_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "gathering_type" TEXT NOT NULL,
    "category" "gatherings"."GatheringCategory" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "gathering_type_category_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people"."potentials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "group_id" UUID,
    "person_id" UUID,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "phone" TEXT,
    "source" "people"."PotentialSource" NOT NULL,
    "status" "people"."PotentialStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "assigned_to_person_id" UUID,
    "created_by_person_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "potentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gathering_type_category_mappings_branch_id_category_idx" ON "gatherings"."gathering_type_category_mappings"("branch_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "gathering_type_category_mappings_branch_id_gathering_type_key" ON "gatherings"."gathering_type_category_mappings"("branch_id", "gathering_type");

-- CreateIndex
CREATE INDEX "potentials_branch_id_idx" ON "people"."potentials"("branch_id");

-- CreateIndex
CREATE INDEX "potentials_group_id_idx" ON "people"."potentials"("group_id");

-- AddForeignKey
ALTER TABLE "gatherings"."gathering_type_category_mappings" ADD CONSTRAINT "gathering_type_category_mappings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people"."potentials" ADD CONSTRAINT "potentials_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people"."potentials" ADD CONSTRAINT "potentials_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "people"."groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people"."potentials" ADD CONSTRAINT "potentials_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"."persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people"."potentials" ADD CONSTRAINT "potentials_assigned_to_person_id_fkey" FOREIGN KEY ("assigned_to_person_id") REFERENCES "people"."persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people"."potentials" ADD CONSTRAINT "potentials_created_by_person_id_fkey" FOREIGN KEY ("created_by_person_id") REFERENCES "people"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity
ALTER TABLE "gatherings"."gathering_type_category_mappings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY gathering_type_category_mappings_branch_isolation ON "gatherings"."gathering_type_category_mappings"
  USING (branch_id = current_setting('app.current_branch_id')::uuid);

ALTER TABLE "people"."potentials" ENABLE ROW LEVEL SECURITY;
CREATE POLICY potentials_branch_isolation ON "people"."potentials"
  USING (branch_id = current_setting('app.current_branch_id')::uuid);
