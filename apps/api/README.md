# apps/api

The Ecclesia API service: a modular monolith (Blueprint ADR-001) exposing
one NestJS module per bounded context (Blueprint Ch.1 §4.2 / Ch.2 §6.4):
`people`, `pastoral-care`, `ministry`, `gatherings`, `stewardship`,
`insights`, `platform`.

**Status (Sprint 1.2):** `platform` is now real. `src/platform/` holds:

| File | Purpose |
|---|---|
| `config/env.schema.ts` | Zod-validated process config (`NODE_ENV`, `PORT`, `LOG_LEVEL`, `API_DOCS_ENABLED`) - fails fast at boot on an invalid value. See `.env.example`. |
| `platform.module.ts` | Wires `ConfigModule`, `nestjs-pino`'s `LoggerModule`, `TerminusModule`, and the workspace-wide `AllExceptionsFilter` (as an `APP_FILTER` provider). |
| `health/health.controller.ts` | `GET /health` - version-neutral, process-level memory checks only until Sprint 1.3 adds a database indicator. |
| `filters/all-exceptions.filter.ts` | Every error response goes through here: consistent shape, 4xx logged at `warn`, 5xx at `error` with the original exception, per engineering-principles.md §5 (Security by Default - denials logged as rigorously as approvals). |
| `pipes/zod-validation.pipe.ts` | Per-route `@Body(new ZodValidationPipe(schema))` - the Zod equivalent of Nest's class-validator `ValidationPipe`, matching `libs/contracts`' Zod ADR. First real usage lands with the People domain. |

`main.ts` also enables URI path versioning (`/v1/...`, Blueprint §14.7) and mounts Swagger at `/docs` (gated by `API_DOCS_ENABLED`).

Still no bounded-context modules (people, pastoral-care, ministry, gatherings, stewardship, insights), database connection, or authentication - those are Sprint 1.3 (Prisma/PostgreSQL), Sprint 1.4 (Cognito), and the People domain milestone that follows, per the locked roadmap.
