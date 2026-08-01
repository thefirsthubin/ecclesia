# apps/api

The Ecclesia API service: a modular monolith (Blueprint ADR-001) exposing
one NestJS module per bounded context (Blueprint Ch.1 §4.2 / Ch.2 §6.4):
`people`, `pastoral-care`, `ministry`, `gatherings`, `stewardship`,
`insights`, `platform`.

**Status (Sprint 1.3):** `platform` now includes a real database
connection. `src/platform/` holds:

| File | Purpose |
|---|---|
| `config/env.schema.ts` | Zod-validated process config (`NODE_ENV`, `PORT`, `LOG_LEVEL`, `API_DOCS_ENABLED`, `DATABASE_URL`) - fails fast at boot on an invalid value. See `.env.example`. |
| `platform.module.ts` | Wires `ConfigModule`, `nestjs-pino`'s `LoggerModule`, `TerminusModule`, `DatabaseModule`, and the workspace-wide `AllExceptionsFilter` (as an `APP_FILTER` provider). |
| `database/prisma.service.ts` | The one `PrismaClient` instance, connected/disconnected on module init/destroy. See `db/README.md` and `db/DESIGN_NOTES.md` - the schema it's generated from is a **draft**, designed without the actual Blueprint §7.2-7.5 text. |
| `database/database-health.indicator.ts` | Custom Terminus indicator (`SELECT 1`) so `/health` reflects real database reachability, not just process liveness. |
| `health/health.controller.ts` | `GET /health` - version-neutral, checks process memory (heap/RSS) and the database. |
| `filters/all-exceptions.filter.ts` | Every error response goes through here: consistent shape, 4xx logged at `warn`, 5xx at `error` with the original exception, per engineering-principles.md §5 (Security by Default - denials logged as rigorously as approvals). |
| `pipes/zod-validation.pipe.ts` | Per-route `@Body(new ZodValidationPipe(schema))` - the Zod equivalent of Nest's class-validator `ValidationPipe`, matching `libs/contracts`' Zod ADR. First real usage lands with the People domain. |

`main.ts` also enables URI path versioning (`/v1/...`, Blueprint §14.7) and mounts Swagger at `/docs` (gated by `API_DOCS_ENABLED`).

Still no bounded-context modules (people, pastoral-care, ministry, gatherings, stewardship, insights) or authentication - those are Sprint 1.4 (Cognito) and the People domain milestone that follows, per the locked roadmap. No domain module yet reads or writes through `PrismaService` - Sprint 1.3 only proves the connection exists.
