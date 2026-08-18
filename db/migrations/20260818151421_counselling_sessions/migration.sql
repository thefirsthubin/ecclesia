-- [Milestone B: People + Pastoral + Outreach Foundation, Slice 5 -
-- Counselling] Adds CounsellingSession - deliberately operational-only
-- (session happened, with whom, when, status; never the content of what
-- was discussed - see MILESTONE_B_DESIGN_NOTES.md Part 8's explicit
-- answer that detailed counselling information lives outside Ecclesia
-- entirely). Same private-pastoral-domain RBAC pattern as PrayerNote (own
-- action namespace pastoral_care.counselling.*, explicit ADMIN DENY) but
-- NOT author-only - a session's scheduling fact is reasonable for
-- pastoral leadership's organizational (BRANCH/CLUSTER) oversight, unlike
-- a prayer note's deeply personal content.
--
-- No new GRANT/ALTER DEFAULT PRIVILEGES statements needed - pastoral_care
-- is an existing schema whose ALTER DEFAULT PRIVILEGES rule already
-- covers this new table.
--
-- Applied and verified for real against a live Postgres instance -
-- `prisma migrate diff` against the resulting database comes back empty.

-- CreateEnum
CREATE TYPE "pastoral_care"."CounsellingSessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "pastoral_care"."counselling_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "counsellor_person_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "pastoral_care"."CounsellingSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "brief_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "counselling_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "counselling_sessions_branch_id_status_idx" ON "pastoral_care"."counselling_sessions"("branch_id", "status");

-- CreateIndex
CREATE INDEX "counselling_sessions_person_id_idx" ON "pastoral_care"."counselling_sessions"("person_id");

-- AddForeignKey
ALTER TABLE "pastoral_care"."counselling_sessions" ADD CONSTRAINT "counselling_sessions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pastoral_care"."counselling_sessions" ADD CONSTRAINT "counselling_sessions_counsellor_person_id_fkey" FOREIGN KEY ("counsellor_person_id") REFERENCES "people"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pastoral_care"."counselling_sessions" ADD CONSTRAINT "counselling_sessions_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row-Level Security. Same branch_id-comparison shape every other table
-- in this schema uses - a deliberate extra backstop, not the primary
-- enforcement mechanism (RBAC action existence).
ALTER TABLE "pastoral_care"."counselling_sessions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY counselling_sessions_branch_isolation ON "pastoral_care"."counselling_sessions"
  USING (branch_id = current_setting('app.current_branch_id')::uuid);
