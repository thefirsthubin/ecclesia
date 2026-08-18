-- [Milestone B: People + Pastoral + Outreach Foundation, Slice 4 -
-- Private pastoral domain] Adds PrayerNote as a deliberately separate
-- table from pastoral_notes, not a discriminator column on it - see
-- MILESTONE_B_DESIGN_NOTES.md Part 5's Option C. Physical separation (own
-- table, own RBAC action namespace pastoral_care.prayer_note.*) means no
-- role has any path to this data unless a new permission-matrix row
-- explicitly names the new action - there is no shared query or
-- discriminator filter a future change could accidentally widen.
--
-- Author-only visibility (the approved product decision - even Resident
-- Pastor and Assistant Pastor do not see each other's prayer notes) is
-- enforced at the repository/service query layer
-- (PrayerNoteRepository.findByPersonAndAuthor), not by a Scope value -
-- evaluate.ts's Scope type has no "author only" concept.
--
-- No new GRANT/ALTER DEFAULT PRIVILEGES statements needed - pastoral_care
-- is an existing schema, and the row-level-security-enforcement
-- migration's own ALTER DEFAULT PRIVILEGES rule for this schema already
-- covers any future table the owner role creates in it, this one
-- included.
--
-- Applied and verified for real against a live Postgres instance -
-- `prisma migrate diff` against the resulting database comes back empty.

-- CreateEnum
CREATE TYPE "pastoral_care"."PrayerNoteStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "pastoral_care"."prayer_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "author_person_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "follow_up_date" DATE,
    "status" "pastoral_care"."PrayerNoteStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prayer_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prayer_notes_branch_id_idx" ON "pastoral_care"."prayer_notes"("branch_id");

-- CreateIndex
CREATE INDEX "prayer_notes_person_id_author_person_id_idx" ON "pastoral_care"."prayer_notes"("person_id", "author_person_id");

-- AddForeignKey
ALTER TABLE "pastoral_care"."prayer_notes" ADD CONSTRAINT "prayer_notes_author_person_id_fkey" FOREIGN KEY ("author_person_id") REFERENCES "people"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pastoral_care"."prayer_notes" ADD CONSTRAINT "prayer_notes_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pastoral_care"."prayer_notes" ADD CONSTRAINT "prayer_notes_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row-Level Security. Same branch_id-comparison shape every other table
-- in this schema uses - per pastoral_notes' own migration comment, this
-- is a deliberate extra backstop, not the primary enforcement mechanism
-- (which is RBAC action existence, and for author-only visibility
-- specifically, the application-layer query filter).
ALTER TABLE "pastoral_care"."prayer_notes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY prayer_notes_branch_isolation ON "pastoral_care"."prayer_notes"
  USING (branch_id = current_setting('app.current_branch_id')::uuid);
