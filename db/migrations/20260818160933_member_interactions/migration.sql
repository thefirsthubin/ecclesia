-- [Milestone B: People + Pastoral + Outreach Foundation, Slice 6 -
-- Member interactions] Adds MemberInteraction - one simple table, not
-- several models (MILESTONE_B_DESIGN_NOTES.md Part 9), the
-- general-purpose pastoral activity log. Pastor-only for this milestone
-- (approved decision - no Bacenta/Basonta Leader grant). Organizational
-- (BRANCH/CLUSTER) scope, not author-only, same reasoning as
-- CounsellingSession. `scheduled_at` is nullable and distinct from
-- `occurred_at` - feeds the Slice 7 Pastoral Calendar read-model.
--
-- No new GRANT/ALTER DEFAULT PRIVILEGES statements needed - pastoral_care
-- is an existing schema whose ALTER DEFAULT PRIVILEGES rule already
-- covers this new table.
--
-- Applied and verified for real against a live Postgres instance -
-- `prisma migrate diff` against the resulting database comes back empty.

-- CreateEnum
CREATE TYPE "pastoral_care"."MemberInteractionType" AS ENUM ('VISIT', 'CALL', 'MEETING', 'FOLLOW_UP', 'PRAYER', 'COUNSELLING');

-- CreateTable
CREATE TABLE "pastoral_care"."member_interactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "pastor_person_id" UUID NOT NULL,
    "type" "pastoral_care"."MemberInteractionType" NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6),
    "brief_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "member_interactions_branch_id_idx" ON "pastoral_care"."member_interactions"("branch_id");

-- CreateIndex
CREATE INDEX "member_interactions_person_id_idx" ON "pastoral_care"."member_interactions"("person_id");

-- CreateIndex
CREATE INDEX "member_interactions_scheduled_at_idx" ON "pastoral_care"."member_interactions"("scheduled_at");

-- AddForeignKey
ALTER TABLE "pastoral_care"."member_interactions" ADD CONSTRAINT "member_interactions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pastoral_care"."member_interactions" ADD CONSTRAINT "member_interactions_pastor_person_id_fkey" FOREIGN KEY ("pastor_person_id") REFERENCES "people"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pastoral_care"."member_interactions" ADD CONSTRAINT "member_interactions_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row-Level Security. Same branch_id-comparison shape every other table
-- in this schema uses.
ALTER TABLE "pastoral_care"."member_interactions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY member_interactions_branch_isolation ON "pastoral_care"."member_interactions"
  USING (branch_id = current_setting('app.current_branch_id')::uuid);
