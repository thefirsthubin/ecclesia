-- Row-Level Security sprint gap: platform.audit_log's RLS policy had no
-- carve-out for a NULL branch_id, so every unauthenticated-request audit
-- write - AuthGuard's own auth.token.verify DENY entry, written from
-- inside its catch block before any actor (and therefore any Branch) is
-- known - failed twice over:
--
-- 1. `current_setting('app.current_branch_id')` (one-argument form)
--    raises `unrecognized configuration parameter "app.current_branch_id"`
--    when the setting was never SET on the current session at all - true
--    for exactly this call site, since it runs outside
--    PrismaService.runInBranchScope entirely (there is no Branch to scope
--    to yet). This turned a 401 into a 500 for every failed-auth request.
-- 2. Even with that fixed via the two-argument `missing_ok` form, a NULL
--    branch_id row (audit_log.branch_id is nullable - db/schema.prisma -
--    precisely for this "no resolvable actor/Branch yet" case) still has
--    no policy allowing it: `branch_id = current_setting(...)` evaluates
--    to NULL (not TRUE) whenever branch_id IS NULL, so the INSERT would
--    still be rejected by the WITH CHECK Postgres implicitly derives from
--    USING when no separate WITH CHECK is given.
--
-- Both are fixed together: the two-argument current_setting form makes an
-- unset session parameter read as NULL instead of erroring, and the
-- explicit `branch_id IS NULL OR ...` carve-out (mirrored in USING and
-- WITH CHECK) makes a NULL-branch row - which by definition belongs to no
-- tenant - always readable/insertable regardless of which Branch's scope
-- (if any) the current session happens to have set. This does not weaken
-- per-Branch tenant isolation: a NULL-branch row carries no Branch to leak
-- across, and every non-NULL branch_id row is still governed by the exact
-- same equality check as before.
--
-- Hand-written, not `prisma migrate dev`-generated, for the same sandbox
-- reason every migration since the first one has been
-- (db/migrations/README.md). Uses ALTER POLICY (not DROP + CREATE) since
-- this only changes the existing audit_log_branch_isolation policy's
-- expressions, not its name, table, or role list.
ALTER POLICY audit_log_branch_isolation ON platform.audit_log
  USING (
    branch_id IS NULL
    OR branch_id = current_setting('app.current_branch_id', true)::uuid
  )
  WITH CHECK (
    branch_id IS NULL
    OR branch_id = current_setting('app.current_branch_id', true)::uuid
  );
