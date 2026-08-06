# db

The database layer (Sprint 1.3 - Database Foundation): `schema.prisma`,
its migration history, and the development seed script.

**Status: rebuilt against the real Blueprint/PRD text and verified against
a real PostgreSQL instance.** `docs/Ecclesia_PRD.md` and
`docs/Ecclesia_Technical_Blueprint.md` hold the source text verbatim. See
`DESIGN_NOTES.md` for exactly what each entity and field traces back to -
every model/field is tagged `[BLUEPRINT-EXACT]` (shown verbatim in
Blueprint §7-9) or `[PRD-DERIVED]` (table named in Blueprint §7.2, columns
derived from a cited FR-/BR-ID) - plus a table of every correction made
from the pre-Blueprint first draft, and the open questions that remain
genuinely unresolved by the source documents. All four migrations have
been applied to a real local Postgres; `prisma migrate diff` against the
live database comes back empty and `pnpm db:seed` succeeds.

| File | Purpose |
|---|---|
| `schema.prisma` | The Prisma schema: all seven bounded-context PostgreSQL schemas have real models. |
| `DESIGN_NOTES.md` | Read this first. Traceability index (Blueprint-exact vs. PRD-derived, per field), the corrections table from the pre-Blueprint draft, and the open questions that need further clarification. |
| `migrations/` | Prisma migration history (Blueprint §7.6): the hand-written initial migration plus three follow-up migrations that closed real gaps found by diffing against the applied database (timestamp/default/index-name/on-update-cascade mismatches) - see `migrations/README.md`. |
| `seed.ts` | Minimal, idempotent development seed data (one example Council, Branch, and Configuration row) - deliberately does not invent People/Gathering/FinancialTransaction fixture data. |

## Commands

```bash
pnpm db:validate       # prisma validate - schema.prisma is well-formed
pnpm db:generate       # regenerate the Prisma Client after any schema change
pnpm db:migrate:dev    # apply migrations to a local dev database (interactive)
pnpm db:migrate:deploy # apply migrations non-interactively (CI/production)
pnpm db:migrate:status # check which migrations have been applied
pnpm db:seed           # run seed.ts
pnpm db:studio         # Prisma Studio, a local data browser
```

All of the above require `DATABASE_URL` to be set (see `.env.example` at
the repository root) and, for anything beyond `db:validate`, a reachable
PostgreSQL instance.

## Module boundary

`apps/api/src/platform/database/` is the only consumer of the generated
Prisma Client in this sprint (`PrismaService`, `DatabaseHealthIndicator`).
No domain library imports Prisma directly or ever will - domain libraries
depend only on `@ecclesia/contracts` (Blueprint §6.2/§6.4); a domain
module in `apps/api` is where a repository built on `PrismaService` would
live, per the same module-boundary rule already enforced for every other
piece of infrastructure in this codebase.
