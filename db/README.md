# db

The database layer (Sprint 1.3 - Database Foundation): `schema.prisma`,
its migration history, and the development seed script.

**Status: DRAFT.** This schema was designed without the actual Technical
Blueprint §7.2-7.5 text available - see `DESIGN_NOTES.md` for exactly
what each entity and field traces back to (primarily `libs/rbac` and
every domain library's `README.md`, transcribed in earlier sprints from
the real PRD/Blueprint) and the open questions still outstanding. Treat
this as a reviewable draft, not a source of truth, until it has been
checked against the real Blueprint text.

| File | Purpose |
|---|---|
| `schema.prisma` | The Prisma schema: seven bounded-context PostgreSQL schemas (five with real models today - `ministry`/`insights` are empty, see `DESIGN_NOTES.md`), every model, enum, and relation. |
| `DESIGN_NOTES.md` | Read this first. Traceability index (what evidence backs each modeling decision), what was deliberately left unbuilt and why, and the open questions that need the real Blueprint/PRD text. |
| `migrations/` | Prisma migration history (Blueprint §7.6). The first migration was hand-written, not generated against a live database - see `migrations/README.md`. |
| `seed.ts` | Minimal, idempotent development seed data (one example Branch + its Configuration row) - deliberately does not invent People/Gathering/FinancialTransaction fixture data on top of an already-draft schema. |

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
