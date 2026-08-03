-- Row-Level Security Enforcement.
--
-- See db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md for the full design. Summary:
-- the RLS policies the init migration already created
-- (20260801000000_init_bounded_context_schemas) have never done anything
-- at runtime, because every connection so far has used `ecclesia`, the
-- table-owning role - and Postgres always lets a table's owner bypass
-- RLS unless FORCE ROW LEVEL SECURITY is also set (deliberately not set,
-- since migrations/seeds need unrestricted cross-Branch writes). This
-- migration creates the second, non-owner role Blueprint §7.3 calls for
-- ("the application must connect as a different, non-owner Postgres
-- role") - RLS starts actually enforcing the moment `apps/api`/
-- `apps/worker` connect as this role instead (a separate, application-side
-- change - APP_DATABASE_URL, see the design notes).
--
-- Hand-written, not `prisma migrate dev`-generated, for the same sandbox
-- reason every migration since the first one has been
-- (db/migrations/README.md): no live database or package registry access
-- in the environment that authored it. Needs the same real-Postgres
-- verification pass every prior hand-written migration in this history
-- needed before being trusted (db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md §8).
--
-- No ALTER POLICY/ALTER TABLE ... ENABLE ROW LEVEL SECURITY here - the
-- existing Blueprint-exact policies are untouched. This migration is
-- role + grants only.

-- `IF NOT EXISTS` isn't valid syntax for `CREATE ROLE` (unlike `CREATE
-- TABLE`) - a `DO` block with an explicit existence check is Postgres's
-- own documented idiom for an idempotent role creation, needed so this
-- migration can be safely re-run against a database where a prior partial
-- attempt already created the role.
--
-- The password below is a placeholder for local development only -
-- matches this repository's existing convention of an example plaintext
-- credential for the `ecclesia` owner role itself (.env.example's
-- DATABASE_URL, and the docker run command's POSTGRES_PASSWORD in that
-- same file's comment). A real deployment must rotate this via whatever
-- secrets management already provisions the `ecclesia` role's own
-- credential - this migration does not, and cannot, know what that is.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'ecclesia_app') THEN
    CREATE ROLE ecclesia_app LOGIN PASSWORD 'ecclesia_app';
  END IF;
END
$$;

-- No BYPASSRLS, no SUPERUSER, no table ownership transfer - `ecclesia_app`
-- is deliberately as unprivileged as it can be while still being able to
-- do ordinary application reads/writes. It cannot run DDL (no CREATE
-- grant on any schema below) and cannot TRUNCATE - both PRD/Blueprint
-- name only ordinary CRUD as the application's own job; migrations and
-- seeding keep using `ecclesia` (DATABASE_URL, unchanged) for anything
-- schema-shaped.
GRANT USAGE ON SCHEMA people, pastoral_care, ministry, gatherings, stewardship, insights, platform TO ecclesia_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA people TO ecclesia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pastoral_care TO ecclesia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ministry TO ecclesia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA gatherings TO ecclesia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA stewardship TO ecclesia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA insights TO ecclesia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA platform TO ecclesia_app;

-- Every table created by a *future* migration (still run as `ecclesia`,
-- the owner) is covered automatically from the moment it exists, with no
-- follow-up grant migration required - this is what would otherwise be
-- the easiest way for this whole mechanism to silently regress (a new
-- table simply forgotten in a hand-written grant list).
ALTER DEFAULT PRIVILEGES FOR ROLE ecclesia IN SCHEMA people GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ecclesia_app;
ALTER DEFAULT PRIVILEGES FOR ROLE ecclesia IN SCHEMA pastoral_care GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ecclesia_app;
ALTER DEFAULT PRIVILEGES FOR ROLE ecclesia IN SCHEMA ministry GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ecclesia_app;
ALTER DEFAULT PRIVILEGES FOR ROLE ecclesia IN SCHEMA gatherings GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ecclesia_app;
ALTER DEFAULT PRIVILEGES FOR ROLE ecclesia IN SCHEMA stewardship GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ecclesia_app;
ALTER DEFAULT PRIVILEGES FOR ROLE ecclesia IN SCHEMA insights GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ecclesia_app;
ALTER DEFAULT PRIVILEGES FOR ROLE ecclesia IN SCHEMA platform GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ecclesia_app;

-- [Design Decision, out of scope for this migration] Blueprint §7.4/
-- db/DESIGN_NOTES.md Open Question #2 notes that real append-only
-- enforcement for stewardship.financial_transactions wants "no UPDATE/
-- DELETE grants for the application's database role" - `ecclesia_app`
-- existing now is a prerequisite for that, satisfied here, but actually
-- narrowing this migration's own blanket UPDATE/DELETE grant for just
-- those two tables is a distinct, separate change (Open Question #2, not
-- Open Question #3/Row-Level Security) with its own review needed against
-- the existing rejecting-trigger safeguard - deliberately not bundled
-- into this migration.
