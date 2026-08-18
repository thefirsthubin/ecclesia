-- [Milestone B: People + Pastoral + Outreach Foundation, Slice 2 -
-- Follow-ups] Extends FollowUpTask with the fields the earlier Portal
-- Audit confirmed absent: priority, description, completedAt, trigger
-- (previously computed transiently in FollowUpTaskService.create to
-- derive dueAt, then discarded - now persisted), plus two new
-- FollowUpTaskStatus values (IN_PROGRESS, CANCELLED). See
-- MILESTONE_B_DESIGN_NOTES.md Part 7 for the full design and the new
-- transition graph (libs/domain/pastoral-care's
-- checkFollowUpTaskStatusTransition):
--   OPEN -> IN_PROGRESS / ESCALATED / CANCELLED
--   IN_PROGRESS -> COMPLETED / ESCALATED / CANCELLED
--   ESCALATED -> COMPLETED / CANCELLED
--   COMPLETED / CANCELLED: terminal
--
-- `priority` defaults every pre-existing row to MEDIUM (a sensible
-- present-tense default, not invented history). `description`, `trigger`,
-- and `completed_at` stay NULL on every pre-existing row - none of the
-- three can be honestly reconstructed after the fact (no backfill
-- performed).
--
-- Applied and verified for real against a live Postgres instance -
-- `prisma migrate diff` against the resulting database comes back empty.

-- CreateEnum
CREATE TYPE "pastoral_care"."FollowUpTaskTrigger" AS ENUM ('FIRST_TIME_GUEST', 'LAPSED_REENGAGEMENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "pastoral_care"."FollowUpTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "pastoral_care"."FollowUpTaskStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "pastoral_care"."FollowUpTaskStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "pastoral_care"."follow_up_tasks" ADD COLUMN     "completed_at" TIMESTAMPTZ(6),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "priority" "pastoral_care"."FollowUpTaskPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "trigger" "pastoral_care"."FollowUpTaskTrigger";
