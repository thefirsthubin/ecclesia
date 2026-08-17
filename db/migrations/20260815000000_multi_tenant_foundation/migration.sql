-- Multi-Tenant Foundation, Phase 1.
--
-- Ecclesia is being restructured as a multi-tenant SaaS platform. River of
-- Life is the first tenant, not the whole architecture. This migration adds
-- the foundational data model for that: a Tenant above Council, and a way
-- for a Role Assignment to be scoped to a Council (not just a Branch), so a
-- Council Administrator/Council Treasurer/Resident Pastor can hold authority
-- across every Branch in their Council rather than being pinned to one.
--
-- Deliberately scoped to structure only. This migration does NOT:
--   - create a second Tenant (Phase 2's job)
--   - grant COUNCIL_TREASURER or SYSTEM_ADMINISTRATOR a full permission
--     matrix (libs/rbac/src/lib/permission-matrix.ts carries only the
--     minimum rows needed to prove the mechanism works this phase)
--   - touch any existing Branch-scoped RLS policy (see part 3 below for
--     why role_assignments' own policy is deliberately left untouched too)
--   - move RESIDENT_PASTOR's permission rows to Council scope (deferred -
--     see PHASE_1_MULTI_TENANT_DESIGN_NOTES.md, "Resident Pastor scope")
--
-- Hand-written, not `prisma migrate dev`-generated, for the same sandbox
-- reason every migration in this history has been (db/migrations/README.md):
-- no live Postgres in the environment that authored it. Needs the same
-- real-Postgres verification pass every prior hand-written migration in
-- this history needed before being trusted (apply it, run `prisma migrate
-- diff` against the result, confirm empty, run `pnpm db:seed`).

-- ===========================================================================
-- Part 1: Tenant model, and Council -> Tenant (enforced 1 Tenant : 1 Council
-- for this phase via a UNIQUE constraint on councils.tenant_id).
-- ===========================================================================

CREATE TABLE platform.tenants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE platform.councils ADD COLUMN tenant_id UUID;

-- Backfill: every Council that already exists (in practice, at most the one
-- "Example Council" `db/seed.ts` creates - but this loop makes no assumption
-- about how many rows exist or what ids they carry, so it is equally correct
-- against an empty fresh database or a real developer's already-seeded one)
-- gets its own new, dedicated Tenant, named after the Council itself. This
-- is what "ONE TENANT = ONE COUNCIL" requires: a pre-existing Council cannot
-- retroactively share a Tenant with another one, so each gets a fresh row,
-- not one shared placeholder.
DO $$
DECLARE
  council_row RECORD;
  new_tenant_id UUID;
BEGIN
  FOR council_row IN SELECT id, name FROM platform.councils WHERE tenant_id IS NULL LOOP
    INSERT INTO platform.tenants (id, name, created_at, updated_at)
    VALUES (gen_random_uuid(), council_row.name, now(), now())
    RETURNING id INTO new_tenant_id;

    UPDATE platform.councils SET tenant_id = new_tenant_id WHERE id = council_row.id;
  END LOOP;
END
$$;

ALTER TABLE platform.councils ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE platform.councils
  ADD CONSTRAINT councils_tenant_id_fkey FOREIGN KEY (tenant_id)
  REFERENCES platform.tenants (id) ON DELETE RESTRICT ON UPDATE CASCADE;
-- The actual "one Tenant, one Council" enforcement: a UNIQUE constraint on
-- the child's own FK column is Prisma's own standard shape for a 1:1
-- relation (see db/schema.prisma's Tenant model doc comment) - this is not
-- an interim compromise, it is the correct constraint for the locked
-- product decision, and simply dropping it later is what "move to multiple
-- Councils per Tenant" would require - no relation-shape migration needed.
ALTER TABLE platform.councils ADD CONSTRAINT councils_tenant_id_key UNIQUE (tenant_id);

CREATE INDEX tenants_name_idx ON platform.tenants (name);

-- `platform.tenants`/`platform.councils` deliberately get NO new/changed RLS
-- policy in this migration. Nothing in this phase's application code queries
-- either table through the RLS-scoped `ecclesia_app` connection in a way
-- that depends on tenant isolation yet (there is only one Tenant, and no
-- session variable for it is ever set - see part 3 below), so adding an
-- enforced-but-never-satisfied policy now would risk making these tables
-- silently invisible to some future RLS-scoped query without any compensating
-- benefit today. Flagged explicitly as a real, open gap for a later phase
-- once real cross-tenant request handling exists to actually set and enforce
-- an `app.current_tenant_id` session variable against it.

-- ===========================================================================
-- Part 2: Role Assignment can now be Council-scoped, not only Branch-scoped.
-- ===========================================================================

ALTER TABLE people.role_assignments ALTER COLUMN branch_id DROP NOT NULL;
ALTER TABLE people.role_assignments ADD COLUMN council_id UUID;
ALTER TABLE people.role_assignments
  ADD CONSTRAINT role_assignments_council_id_fkey FOREIGN KEY (council_id)
  REFERENCES platform.councils (id) ON DELETE CASCADE ON UPDATE CASCADE;

-- The core structural guarantee Phase 1 asked for: "Database constraints
-- should make invalid combinations difficult/impossible." Exactly one of
-- branch_id/council_id must be set - never both (an assignment cannot be
-- simultaneously pinned to one Branch and scoped to a whole Council), never
-- neither (every assignment must be scoped to *something*). Which roles are
-- allowed to hold a Council-scoped assignment is an application-layer policy
-- decision (there is no "grant Council Administrator" flow built yet this
-- phase to enforce it against), not something this CHECK constraint tries to
-- encode - it enforces the structural shape only.
ALTER TABLE people.role_assignments
  ADD CONSTRAINT role_assignments_branch_xor_council_check
  CHECK (
    (branch_id IS NOT NULL AND council_id IS NULL)
    OR (branch_id IS NULL AND council_id IS NOT NULL)
  );

CREATE INDEX role_assignments_council_id_role_idx ON people.role_assignments (council_id, role);

-- ===========================================================================
-- Part 3: `role_assignments_branch_isolation` (migration
-- 20260801000000_init_bounded_context_schemas) is deliberately LEFT
-- UNCHANGED - not weakened, not extended, not touched.
--
-- Why this is safe: the one place that reads a Council-scoped Role
-- Assignment row (branch_id NULL) today is
-- `ActorContextResolverService.resolve()`, which already, and only ever,
-- queries through `PrismaRootService` - the RLS-*bypassing* owner
-- connection, used specifically for this "who am I, before any Branch scope
-- exists" bootstrap case (see that service's own doc comment, predating this
-- migration). RLS never applies to that path, so it needs no policy change
-- to see a NULL-branch_id row.
--
-- For every *other*, RLS-scoped path (the real `ecclesia_app` connection,
-- e.g. `GET /people/:id/role-assignments`), the existing unmodified policy
-- (`branch_id = current_setting('app.current_branch_id')::uuid`) simply
-- never matches a NULL branch_id row - `NULL = anything` is NULL, not true -
-- so a Council-scoped assignment is invisible through a Branch-scoped
-- session. That is the *correct* outcome for this phase (a Council-scoped
-- assignment does not belong to any one Branch's list), not a gap: nothing
-- in this phase builds a "list Role Assignments for my Council" endpoint
-- that would need it to be visible any other way. A future phase that does
-- build one will need its own, deliberate policy extension (an
-- `app.current_council_id` session variable and a matching OR-clause) - not
-- assumed or half-built here.
--
-- Cross-Branch Council-scoped *data* access (e.g. a Council Treasurer
-- reading Financial Transactions across every Branch in their Council) goes
-- through a different mechanism entirely: `PrismaService.runInCouncilScope`
-- (apps/api/src/platform/database/prisma.service.ts) calls the existing,
-- unmodified `runInBranchScope` once per Branch in the actor's Council,
-- reusing the exact same hardened per-Branch RLS policies every other query
-- in this codebase already relies on - not a new, separately-reviewed
-- cross-Branch policy. This is a deliberate, disclosed choice to extend
-- Council-scoped data access at the application layer rather than take on a
-- new, harder-to-reason-about multi-branch RLS policy shape (e.g. an array
-- session variable + `= ANY(...)`) in this same foundational phase.

-- ===========================================================================
-- Part 4: two new Role values - COUNCIL_TREASURER and SYSTEM_ADMINISTRATOR.
--
-- Bundled into this same migration (unlike the Usher role milestone's own
-- dedicated single-purpose migration) because both roles exist specifically
-- to be usable with the Council-scope infrastructure parts 1-3 just built -
-- splitting them into their own file would just be two migrations that
-- always have to be applied together in practice.
--
-- `ALTER TYPE ... ADD VALUE` cannot run inside the same transaction as a
-- statement that *uses* the new value (PostgreSQL restriction - the new
-- label isn't visible to the rest of that transaction it was added in).
-- Adding two different new values, with neither referenced anywhere else in
-- this file, does not trigger that restriction (only *using* a
-- just-added value would) - matching the Usher migration's own precedent,
-- extended to two values instead of one.
-- ===========================================================================

ALTER TYPE people."Role" ADD VALUE 'COUNCIL_TREASURER';
ALTER TYPE people."Role" ADD VALUE 'SYSTEM_ADMINISTRATOR';
