-- [Milestone A: Financial + Gathering Backend Foundation] Adds
-- `FinancialTransaction.gatheringId` (which specific Gathering occurrence
-- this money was given at - Sunday/Midweek/Bacenta meeting/Basonta
-- meeting/Other) and `Gathering.preacherPersonId`/`message` (who preached,
-- what the message/sermon title was). See MILESTONE_A_DESIGN_NOTES.md for
-- the full design (the approved technical design document this migration
-- implements) - key points reproduced here:
--
-- - `gathering_id` is purely additive and nullable. No backfill is
--   performed: even this codebase's own synthetic seed data only
--   correlates a Gathering and a FinancialTransaction by shared
--   sourceGroupId/ownerGroupId and a same-day timestamp, never an explicit
--   link, and FinancialTransaction.createdAt records when a transaction
--   was entered into the app, not necessarily the date money was actually
--   received - a same-group/same-day heuristic would silently misattribute
--   real production data. Every pre-existing row keeps gathering_id NULL
--   permanently unless a human operator manually re-links a specific
--   known-correct case through a future tool.
-- - `sourceGroupId` (existing column, unchanged) and `gatheringId` answer
--   different questions and both may be set together - see
--   FinancialTransactionService.record()'s new consistency check
--   (application-layer, not a DB constraint - the two tables' RLS
--   policies already scope both by branch_id independently, and the
--   "does gathering.ownerGroupId match sourceGroupId" check spans two
--   tables in a way a plain CHECK constraint cannot express without a
--   trigger this milestone doesn't need).
-- - `preacher_person_id` follows this schema's established convention of
--   referencing Person for every actor-like field (createdByPersonId,
--   giverPersonId, etc.) rather than a free-text name column. A guest
--   preacher with no Person record is a known, accepted limitation, not
--   silently patched with a second free-text field.
--
-- `ON DELETE SET NULL` on both new foreign keys matches this schema's
-- existing convention for every other nullable Person/Group reference
-- (source_group_id, giver_person_id, owner_group_id) - a referenced
-- Gathering or Person being deleted must never cascade-delete or corrupt a
-- financial record or another Gathering's historical fact.
--
-- Generated via `prisma migrate dev --create-only` against a live
-- Postgres instance (this migration has been applied and verified for
-- real - `prisma migrate diff` against the resulting database comes back
-- empty - unlike several earlier migrations in this history that were
-- hand-written blind and only verified later, per this directory's own
-- README.md).

-- AlterTable
ALTER TABLE "gatherings"."gatherings" ADD COLUMN     "message" TEXT,
ADD COLUMN     "preacher_person_id" UUID;

-- AlterTable
ALTER TABLE "stewardship"."financial_transactions" ADD COLUMN     "gathering_id" UUID;

-- CreateIndex
CREATE INDEX "financial_transactions_gathering_id_idx" ON "stewardship"."financial_transactions"("gathering_id");

-- AddForeignKey
ALTER TABLE "gatherings"."gatherings" ADD CONSTRAINT "gatherings_preacher_person_id_fkey" FOREIGN KEY ("preacher_person_id") REFERENCES "people"."persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stewardship"."financial_transactions" ADD CONSTRAINT "financial_transactions_gathering_id_fkey" FOREIGN KEY ("gathering_id") REFERENCES "gatherings"."gatherings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
