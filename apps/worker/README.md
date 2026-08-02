# apps/worker

The background Worker service (Blueprint Ch.1 §3, Ch.4): consumes the
EventBridge/SQS Engagement Signal bus (§10.2) and runs scheduled sweeps
(§10.8) - Church Pulse recomputation, notification fan-out, silent-drift/
follow-up-SLA/attendance-completeness detection.

**Status: Blueprint §10's full consumer/sweep inventory is built.** Built
in two milestones - see `WORKER_DESIGN_NOTES.md` for the full design
rationale and citation breakdown of both:

1. **First vertical slice** ("Foundation + one full vertical slice
   first"): the platform layer (Zod-validated config, `nestjs-pino`
   logging, its own `PrismaService`), the `platform.processed_events`
   idempotency table/migration, an `EventBridgePublisherService`, the
   `insights-consumer` SQS consumer, and the `silent-drift-sweep` job.
2. **Follow-up milestone**: the remaining two SQS consumers
   (`notification-consumer` - an idempotency-check-and-log stub, since no
   real notification channel is decided anywhere in the source documents;
   `audit-consumer` - writes every Engagement Signal to
   `platform.audit_log`) and the remaining three scheduled sweeps
   (`church-pulse-recompute`, `follow-up-sla-sweep`,
   `attendance-completeness-sweep`).

`command.ts` is a command dispatcher (`consume:insights` /
`consume:notification` / `consume:audit` / `sweep:silent-drift` /
`sweep:church-pulse-recompute` / `sweep:follow-up-sla` /
`sweep:attendance-completeness`) run via `main.ts` against
`NestFactory.createApplicationContext()` - one deployable image, the
command varying per ECS task invocation (ADR-007).

**Build note:** the `build` target uses `@nx/webpack:webpack` (a fix, not
the original Sprint 0 choice of `@nx/js:tsc`, which breaks on cross-library
imports from `libs/contracts`/`libs/domain/*` - see
`WORKER_DESIGN_NOTES.md`). Confirmed via a real `npx nx build worker` run
producing real `dist/apps/worker/main.js` output, both milestones.

## Layout

```
src/
  main.ts                            thin bootstrap wrapper (NestFactory.createApplicationContext)
  command.ts                         parseCommand/runCommand - the actual dispatch logic, unit-tested
  app/worker.module.ts               root module
  platform/
    config/env.schema.ts             Zod-validated process config
    database/                        apps/worker's own PrismaService
    events/                          EventBridgePublisherService, SqsConsumerBase,
                                      ProcessedEventRepository, SQS client provider
  consumers/
    insights/                        insights-consumer
    notification/                    notification-consumer (idempotency-check-and-log stub)
    audit/                           audit-consumer (writes platform.audit_log)
  jobs/
    silent-drift-sweep/              publishes a synthetic signal per newly-flagged Person
    church-pulse-recompute/          the only sweep that writes directly, publishes no signal
    follow-up-sla-sweep/             detects + signals only, never mutates FollowUpTask
    attendance-completeness-sweep/   detects + signals only, never mutates Gathering
```

See `WORKER_DESIGN_NOTES.md` for the full design rationale, including why
each job either publishes a synthetic Engagement Signal or (for
`church-pulse-recompute` alone) doesn't, and why the two sweep jobs that
signal SLA/completeness gaps never mutate the record they're evaluating.
