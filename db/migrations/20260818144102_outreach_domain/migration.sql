-- [Milestone B: People + Pastoral + Outreach Foundation, Slice 3 -
-- Outreach] A new bounded-context schema (`outreach`), one event
-- (`outreaches`) with many people reached at it (`outreach_contacts`) -
-- see MILESTONE_B_DESIGN_NOTES.md Part 4. `outreach_contacts.person_id`
-- is nullable by design: lazy/deferred Person promotion - most outreach
-- contacts never re-engage, so a full Person record (visible in the
-- People directory, attendance eligibility, RBAC scope resolution) is
-- only created at an explicit promotion point, not for every doorstep
-- encounter.
--
-- Includes RLS (ordinary branch_id policy - Outreach is organizational
-- data, not the pastoral-sensitive tier) and the ecclesia_app grants a
-- brand-new schema needs (USAGE + table grants + default-privilege rule,
-- mirroring 20260801050000_row_level_security_enforcement's own
-- three-statement pattern per schema).
--
-- Applied and verified for real against a live Postgres instance -
-- `prisma migrate diff` against the resulting database comes back empty.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "outreach";

-- CreateEnum
CREATE TYPE "outreach"."OutreachContactOutcome" AS ENUM ('NOT_INTERESTED', 'FOLLOW_UP_REQUESTED', 'ATTENDED');

-- CreateTable
CREATE TABLE "outreach"."outreaches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "group_id" UUID,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "location" TEXT,
    "leader_person_id" UUID NOT NULL,
    "notes" TEXT,
    "created_by_person_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outreaches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach"."outreach_contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "outreach_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "person_id" UUID,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "phone" TEXT,
    "how_reached" TEXT,
    "outcome" "outreach"."OutreachContactOutcome",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outreach_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outreaches_branch_id_occurred_at_idx" ON "outreach"."outreaches"("branch_id", "occurred_at");

-- CreateIndex
CREATE INDEX "outreaches_group_id_occurred_at_idx" ON "outreach"."outreaches"("group_id", "occurred_at");

-- CreateIndex
CREATE INDEX "outreach_contacts_branch_id_idx" ON "outreach"."outreach_contacts"("branch_id");

-- CreateIndex
CREATE INDEX "outreach_contacts_outreach_id_idx" ON "outreach"."outreach_contacts"("outreach_id");

-- AddForeignKey
ALTER TABLE "outreach"."outreaches" ADD CONSTRAINT "outreaches_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach"."outreaches" ADD CONSTRAINT "outreaches_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "people"."groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach"."outreaches" ADD CONSTRAINT "outreaches_leader_person_id_fkey" FOREIGN KEY ("leader_person_id") REFERENCES "people"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach"."outreaches" ADD CONSTRAINT "outreaches_created_by_person_id_fkey" FOREIGN KEY ("created_by_person_id") REFERENCES "people"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach"."outreach_contacts" ADD CONSTRAINT "outreach_contacts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach"."outreach_contacts" ADD CONSTRAINT "outreach_contacts_outreach_id_fkey" FOREIGN KEY ("outreach_id") REFERENCES "outreach"."outreaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach"."outreach_contacts" ADD CONSTRAINT "outreach_contacts_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"."persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Row-Level Security. Same branch_id-comparison shape every other table in
-- this codebase already uses (Outreach is organizational data, not the
-- pastoral-sensitive tier that needed the extra RBAC-only disclosure
-- pastoral_notes' own migration comment carries).
ALTER TABLE "outreach"."outreaches" ENABLE ROW LEVEL SECURITY;
CREATE POLICY outreaches_branch_isolation ON "outreach"."outreaches"
  USING (branch_id = current_setting('app.current_branch_id')::uuid);

ALTER TABLE "outreach"."outreach_contacts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY outreach_contacts_branch_isolation ON "outreach"."outreach_contacts"
  USING (branch_id = current_setting('app.current_branch_id')::uuid);

-- Grants for the non-owner `ecclesia_app` application role
-- (db/migrations/20260801050000_row_level_security_enforcement/migration.sql).
-- A brand-new schema needs its own USAGE + table grants + default-privilege
-- rule, the exact same three-statement pattern that migration established
-- for each of the seven original schemas.
GRANT USAGE ON SCHEMA outreach TO ecclesia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA outreach TO ecclesia_app;
ALTER DEFAULT PRIVILEGES FOR ROLE ecclesia IN SCHEMA outreach GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ecclesia_app;
