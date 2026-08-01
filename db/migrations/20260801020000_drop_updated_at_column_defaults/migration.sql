-- Drop the DB-level DEFAULT now() on every `updated_at` column. Prisma's
-- @updatedAt directive manages this column entirely at the Prisma Client
-- level (set on every create/update call) and does not expect a
-- database-level default - the first migration gave these columns
-- DEFAULT now() as a defensive measure, which created real drift against
-- db/schema.prisma (confirmed via `prisma migrate diff` against the
-- applied database). No data or behavior change - Prisma Client already
-- supplies this value on every write it performs.

ALTER TABLE "gatherings"."gathering_series" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "gatherings"."gatherings" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "ministry"."staffing_targets" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "pastoral_care"."follow_up_tasks" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "pastoral_care"."poimen_enrollments" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "people"."groups" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "people"."persons" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "people"."role_assignments" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "platform"."branches" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "platform"."configurations" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "platform"."councils" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "platform"."users" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "stewardship"."expenses" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "stewardship"."pledges" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "stewardship"."projects" ALTER COLUMN "updated_at" DROP DEFAULT;
