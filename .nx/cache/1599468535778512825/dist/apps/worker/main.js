/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ ((module, exports, __webpack_require__) => {

/* module decorator */ module = __webpack_require__.nmd(module);

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.bootstrap = bootstrap;
/**
 * Entry point for the Ecclesia Worker service (Blueprint Ch.1 §3, Ch.4,
 * ADR-007: a long-running ECS Fargate container, not a Lambda-per-message
 * design - both apps/api and apps/worker run this way, per ADR-007's
 * explicit rejection of Lambda for cold-start-latency reasons).
 *
 * This milestone ("Foundation + one full vertical slice first" - see
 * `WORKER_DESIGN_NOTES.md`) replaces the Sprint 0 scaffold's no-op
 * `bootstrap()` with a real command dispatcher: `main.ts` reads one
 * positional CLI argument naming which job/consumer this particular ECS
 * task invocation runs (Blueprint's own container-per-command deployment
 * shape - the same worker image, different `command` override at the
 * task-definition level, not a separate image per job/consumer).
 *
 * `parseCommand`/`runCommand` themselves live in `./command.ts`, not
 * here - deliberately, so they can be unit-tested (`main.spec.ts`)
 * without transitively importing `WorkerModule`. `WorkerPlatformModule`
 * calls `ConfigModule.forRoot({ validate: validateEnv })` at
 * module-decoration time (immediately on import, not lazily), so any
 * file that imports `WorkerModule` - even just to re-export something
 * else from the same file - forces real `AWS_REGION`/
 * `SQS_INSIGHTS_QUEUE_URL`/`DATABASE_URL` environment variables to be
 * present just to load that file. A prior version of this file had
 * `parseCommand`/`runCommand` defined here directly, which broke
 * `pnpm test` for exactly this reason (confirmed on the user's own real
 * `pnpm test` run, not just this sandbox) - see `command.ts`'s own doc
 * comment for the full explanation.
 *
 * Two commands exist after this milestone's vertical slice:
 * - `consume:insights` - runs `InsightsConsumer.run()` in an unbounded
 *   long-poll loop until SIGTERM/SIGINT, the ECS Fargate long-running-
 *   process shape.
 * - `sweep:silent-drift` - runs `SilentDriftSweepJob.run()` once and
 *   exits, the EventBridge-Scheduler-triggered-task shape (§10.8).
 *
 * `NestFactory.createApplicationContext()`, not `NestFactory.create()`, is
 * used - apps/worker has no HTTP surface to listen on, only Nest's
 * dependency-injection container (own inferred choice, not mandated by
 * either document; the Blueprint doesn't specify a Node/Nest bootstrap
 * style for the worker - see `WORKER_DESIGN_NOTES.md`).
 */
__webpack_require__(1);
const core_1 = __webpack_require__(2);
const nestjs_pino_1 = __webpack_require__(3);
const worker_module_1 = __webpack_require__(4);
const command_1 = __webpack_require__(62);
async function bootstrap() {
    const command = (0, command_1.parseCommand)(process.argv);
    const app = await core_1.NestFactory.createApplicationContext(worker_module_1.WorkerModule, { bufferLogs: true });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    try {
        await (0, command_1.runCommand)(command, app);
    }
    finally {
        await app.close();
    }
}
if (__webpack_require__.c[__webpack_require__.s] === module) {
    bootstrap().catch((error) => {
        // The pino logger may not exist yet if bootstrap failed before
        // `createApplicationContext` resolved - console.error is the only
        // guaranteed-available fallback, same reasoning as apps/api's main.ts.
        // No eslint-disable needed: the workspace no-console rule explicitly
        // allows console.error (eslint.config.cjs).
        console.error('[worker] Fatal error during bootstrap', error);
        process.exitCode = 1;
    });
}


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("reflect-metadata");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("nestjs-pino");

/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkerModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const audit_consumer_module_1 = __webpack_require__(7);
const insights_consumer_module_1 = __webpack_require__(32);
const notification_consumer_module_1 = __webpack_require__(35);
const attendance_completeness_sweep_module_1 = __webpack_require__(37);
const church_pulse_recompute_module_1 = __webpack_require__(44);
const follow_up_sla_sweep_module_1 = __webpack_require__(50);
const silent_drift_sweep_module_1 = __webpack_require__(57);
const platform_module_1 = __webpack_require__(60);
/**
 * Root module for apps/worker. Mirrors `apps/api/src/app/app.module.ts`'s
 * own role - `WorkerPlatformModule` is the foundation (config, logging,
 * database). The first vertical-slice milestone added
 * `InsightsConsumerModule` and `SilentDriftSweepModule` (one consumer,
 * one sweep job, to prove the pattern end-to-end); this follow-up
 * milestone completes Blueprint §10.2/§10.8's full inventory with the
 * remaining two consumers (`NotificationConsumerModule`,
 * `AuditConsumerModule`) and three sweep jobs
 * (`ChurchPulseRecomputeModule`, `FollowUpSlaSweepModule`,
 * `AttendanceCompletenessSweepModule`) - see `WORKER_DESIGN_NOTES.md`.
 * All are imported unconditionally here; `command.ts`'s dispatcher
 * decides at runtime which one actually does anything for a given process
 * invocation (Blueprint ADR-007: apps/worker is one deployable image, not
 * a separate container per job/consumer - the *command* passed to that
 * image at ECS task-definition level is what varies).
 */
let WorkerModule = class WorkerModule {
};
exports.WorkerModule = WorkerModule;
exports.WorkerModule = WorkerModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            platform_module_1.WorkerPlatformModule,
            insights_consumer_module_1.InsightsConsumerModule,
            notification_consumer_module_1.NotificationConsumerModule,
            audit_consumer_module_1.AuditConsumerModule,
            silent_drift_sweep_module_1.SilentDriftSweepModule,
            church_pulse_recompute_module_1.ChurchPulseRecomputeModule,
            follow_up_sla_sweep_module_1.FollowUpSlaSweepModule,
            attendance_completeness_sweep_module_1.AttendanceCompletenessSweepModule,
        ],
    })
], WorkerModule);


/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuditConsumerModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const audit_log_repository_1 = __webpack_require__(8);
const audit_consumer_1 = __webpack_require__(11);
const events_module_1 = __webpack_require__(28);
let AuditConsumerModule = class AuditConsumerModule {
};
exports.AuditConsumerModule = AuditConsumerModule;
exports.AuditConsumerModule = AuditConsumerModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [events_module_1.EventsModule],
        providers: [audit_log_repository_1.WorkerAuditLogRepository, audit_consumer_1.AuditConsumer],
        exports: [audit_consumer_1.AuditConsumer],
    })
], AuditConsumerModule);


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkerAuditLogRepository = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const prisma_service_1 = __webpack_require__(9);
/**
 * apps/worker's own copy of `platform.audit_log` persistence - the same
 * "own repository, not a cross-app import" split as
 * `WorkerEngagementSignalRepository` (see that file's doc comment; the
 * reasoning is identical). Deliberately a narrower field set than
 * `apps/api/src/platform/audit/audit-log.service.ts`'s `AuditLogEntry` -
 * `actorUserId`/`effect`/`reason`/`deviceId`/`ipAddress` are all
 * request-shaped fields (Blueprint §8.5's login/logout/MFA logging,
 * `libs/rbac`'s allow/deny decisions) that don't apply to a bus message
 * with no HTTP request or authenticated actor behind it - see
 * `AuditConsumer`'s own doc comment for why this consumer never has an
 * `actorUserId` to record.
 */
let WorkerAuditLogRepository = class WorkerAuditLogRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(entry) {
        return this.prisma.auditLog.create({
            data: {
                branchId: entry.branchId,
                action: entry.action,
                resourceType: entry.resourceType,
                resourceId: entry.resourceId,
                occurredAt: entry.occurredAt,
            },
        });
    }
};
exports.WorkerAuditLogRepository = WorkerAuditLogRepository;
exports.WorkerAuditLogRepository = WorkerAuditLogRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], WorkerAuditLogRepository);


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaService = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const client_1 = __webpack_require__(10);
const nestjs_pino_1 = __webpack_require__(3);
/**
 * The one PrismaClient instance for apps/worker - a second, independent
 * instance from apps/api's own `PrismaService`, both generated from the
 * same `db/schema.prisma` (Blueprint ADR-003: one shared Postgres database
 * behind separate services, not a shared ORM client). See
 * `apps/api/src/platform/database/prisma.service.ts`'s doc comment for why
 * `$connect()`/`$disconnect()` are called explicitly rather than left to
 * Prisma's lazy-connect default - identical reasoning applies here: a
 * Worker process that cannot reach the database should fail its startup
 * loudly, not fail confusingly on whatever the first job/message happens
 * to be.
 *
 * Deliberately not a shared `libs/database` import - no such lib exists in
 * this workspace, and Nx's `enforce-module-boundaries` rule forbids one
 * app importing another app's code directly; this is apps/worker's own
 * copy of the same small, already-established pattern, not a workaround.
 */
let PrismaService = class PrismaService extends client_1.PrismaClient {
    logger;
    constructor(logger) {
        super();
        this.logger = logger;
    }
    async onModuleInit() {
        await this.$connect();
        this.logger.info('Prisma connected to the database');
    }
    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.info('Prisma disconnected from the database');
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, nestjs_pino_1.InjectPinoLogger)(PrismaService.name)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof nestjs_pino_1.PinoLogger !== "undefined" && nestjs_pino_1.PinoLogger) === "function" ? _a : Object])
], PrismaService);


/***/ }),
/* 10 */
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var AuditConsumer_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuditConsumer = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const config_1 = __webpack_require__(12);
const nestjs_pino_1 = __webpack_require__(3);
const audit_log_repository_1 = __webpack_require__(8);
const processed_event_repository_1 = __webpack_require__(13);
const sqs_client_provider_1 = __webpack_require__(14);
const sqs_consumer_base_1 = __webpack_require__(16);
/**
 * The `audit-consumer` SQS consumer (Blueprint §10.2). Writes every
 * Engagement Signal that reaches it to `platform.audit_log`, giving the
 * whole Engagement Signal stream the same long-retention, "who/what
 * happened to church data" durable record Blueprint §12.1 already
 * describes that table as (see
 * `apps/api/src/platform/audit/audit-log.service.ts`'s own doc comment).
 *
 * **`actorUserId` is always omitted, deliberately, not merely absent.**
 * Every existing `platform.audit_log` writer (`AuthGuard`,
 * `RbacAuditInterceptor`) records the authenticated `platform.users` row
 * responsible for the logged event. An Engagement Signal on the bus has
 * no equivalent - `EngagementSignalEnvelope` (Blueprint §10.3) carries a
 * `subjectPersonId` (who the signal is *about*) and `branchId`, never an
 * originating `User`. Treating `subjectPersonId` as `actorUserId` would
 * misrepresent "this is what happened to this Person" as "this Person did
 * this," which is not what the envelope means. `action` carries the
 * signal's own `eventType` instead - the closest honest equivalent to
 * "what happened" without an actor to attribute it to.
 */
let AuditConsumer = class AuditConsumer extends sqs_consumer_base_1.SqsConsumerBase {
    static { AuditConsumer_1 = this; }
    auditLogRepository;
    static CONSUMER_NAME = 'audit-consumer';
    constructor(sqsClient, configService, processedEventRepository, logger, auditLogRepository) {
        super(sqsClient, configService.get('SQS_AUDIT_QUEUE_URL', { infer: true }), AuditConsumer_1.CONSUMER_NAME, processedEventRepository, logger);
        this.auditLogRepository = auditLogRepository;
    }
    async handle(envelope) {
        await this.auditLogRepository.record({
            branchId: envelope.branchId,
            action: envelope.eventType,
            resourceType: 'EngagementSignal',
            resourceId: envelope.eventId,
            occurredAt: new Date(envelope.occurredAt),
        });
    }
};
exports.AuditConsumer = AuditConsumer;
exports.AuditConsumer = AuditConsumer = AuditConsumer_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(sqs_client_provider_1.SQS_CLIENT)),
    tslib_1.__param(3, (0, nestjs_pino_1.InjectPinoLogger)(AuditConsumer.name)),
    tslib_1.__metadata("design:paramtypes", [Object, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof processed_event_repository_1.ProcessedEventRepository !== "undefined" && processed_event_repository_1.ProcessedEventRepository) === "function" ? _b : Object, typeof (_c = typeof nestjs_pino_1.PinoLogger !== "undefined" && nestjs_pino_1.PinoLogger) === "function" ? _c : Object, typeof (_d = typeof audit_log_repository_1.WorkerAuditLogRepository !== "undefined" && audit_log_repository_1.WorkerAuditLogRepository) === "function" ? _d : Object])
], AuditConsumer);


/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProcessedEventRepository = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const client_1 = __webpack_require__(10);
const prisma_service_1 = __webpack_require__(9);
/**
 * Prisma-backed idempotency check for `platform.processed_events`
 * (Blueprint §10.5, `db/schema.prisma`'s `ProcessedEvent` model - see its
 * own doc comment there for the "one shared table, `consumerName`
 * discriminator" design decision).
 *
 * `tryRecord` is the one method every consumer/sweep calls, and it is
 * deliberately **atomic**: rather than a separate `isProcessed()` check
 * followed by a separate `markProcessed()` write (which would leave a
 * race window between two concurrently-polling ECS Fargate tasks - both
 * could pass the check before either writes), this attempts the INSERT
 * first and lets the table's own `@@unique([consumerName, eventId])`
 * constraint (`processed_events_consumer_name_event_id_key`) be the single
 * source of truth for "have I seen this eventId before." A unique-
 * violation on that insert *is* the "already processed" answer, not an
 * error condition to propagate.
 */
let ProcessedEventRepository = class ProcessedEventRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Attempts to record `eventId` as processed by `consumerName`. Returns
     * `true` if this call is the one that newly recorded it (the caller
     * should proceed to process the message/event), or `false` if it was
     * already recorded (the caller should no-op - Blueprint §10.5: "at-least-
     * once delivery... processing is a no-op on replay").
     */
    async tryRecord(consumerName, eventId, branchId) {
        try {
            await this.prisma.processedEvent.create({
                data: { consumerName, eventId, branchId },
            });
            return true;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                return false;
            }
            throw error;
        }
    }
};
exports.ProcessedEventRepository = ProcessedEventRepository;
exports.ProcessedEventRepository = ProcessedEventRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ProcessedEventRepository);


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SQS_CLIENT = void 0;
exports.sqsClientFactory = sqsClientFactory;
const client_sqs_1 = __webpack_require__(15);
/** DI token for the shared `SQSClient` instance - see `events.module.ts`. */
exports.SQS_CLIENT = Symbol('SQS_CLIENT');
/**
 * One `SQSClient` per process, shared across every consumer (mirrors
 * `EventBridgePublisherService` constructing its own `EventBridgeClient`
 * internally - the SQS client is provided at module level instead,
 * because unlike the publisher, more than one consumer in this codebase
 * will eventually need it, per Blueprint §10.2's three named queues).
 */
function sqsClientFactory(configService) {
    return new client_sqs_1.SQSClient({ region: configService.get('AWS_REGION', { infer: true }) });
}


/***/ }),
/* 15 */
/***/ ((module) => {

module.exports = require("@aws-sdk/client-sqs");

/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SqsConsumerBase = void 0;
const client_sqs_1 = __webpack_require__(15);
const contracts_1 = __webpack_require__(17);
/**
 * Base class for the three SQS consumers named in Blueprint §10.2
 * (`insights-consumer`, `notification-consumer`, `audit-consumer`). This
 * vertical slice implements one concrete subclass, `InsightsConsumer` -
 * see `apps/worker/WORKER_DESIGN_NOTES.md` for why the other two are
 * disclosed follow-up work, not built here.
 *
 * Long-polls the queue (`WaitTimeSeconds: 20`, the AWS-recommended max, to
 * minimize empty-receive cost - not a Blueprint citation, an ordinary SQS
 * operational default), then for each message:
 *
 * 1. Parses and validates the body against `engagementSignalEnvelopeSchema`
 *    (`@ecclesia/contracts`). A message that fails validation is logged
 *    and deleted (not retried) - malformed input at this boundary is a
 *    producer bug, not a transient failure worth redelivering.
 * 2. Calls `ProcessedEventRepository.tryRecord` (Blueprint §10.5's
 *    idempotency check). If this `eventId` was already processed by this
 *    consumer, the message is deleted with no further action - "a no-op
 *    on replay," per that section.
 * 3. Otherwise calls the subclass's `handle()` with the parsed envelope.
 *    On success, the message is deleted. On failure, the message is
 *    **not** deleted - it becomes visible again after the queue's
 *    visibility timeout and is retried on a future poll, the ordinary SQS
 *    at-least-once redelivery behavior. No dead-letter queue is
 *    configured or modeled in this codebase; a message that fails
 *    indefinitely will simply keep retrying until whatever
 *    infrastructure-level DLQ policy the real provisioned queue has (not
 *    built in this milestone) intervenes.
 */
class SqsConsumerBase {
    sqsClient;
    queueUrl;
    consumerName;
    processedEventRepository;
    logger;
    constructor(sqsClient, queueUrl, consumerName, processedEventRepository, logger) {
        this.sqsClient = sqsClient;
        this.queueUrl = queueUrl;
        this.consumerName = consumerName;
        this.processedEventRepository = processedEventRepository;
        this.logger = logger;
    }
    /**
     * One long-poll receive-and-process cycle. Returns the number of
     * messages received (0 on an empty poll) - the unit the test suite
     * exercises directly, since `run()` itself is an unbounded loop not
     * meaningfully unit-testable.
     */
    async pollOnce() {
        const result = await this.sqsClient.send(new client_sqs_1.ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
        }));
        const messages = result.Messages ?? [];
        for (const message of messages) {
            await this.processMessage(message.Body, message.ReceiptHandle);
        }
        return messages.length;
    }
    async processMessage(body, receiptHandle) {
        if (!receiptHandle) {
            this.logger.warn('SQS message had no ReceiptHandle - skipping');
            return;
        }
        const parsed = contracts_1.engagementSignalEnvelopeSchema.safeParse(body ? JSON.parse(body) : undefined);
        if (!parsed.success) {
            this.logger.error({ error: parsed.error.message }, 'Malformed Engagement Signal envelope - deleting without processing');
            await this.deleteMessage(receiptHandle);
            return;
        }
        const envelope = parsed.data;
        const isNew = await this.processedEventRepository.tryRecord(this.consumerName, envelope.eventId, envelope.branchId);
        if (!isNew) {
            this.logger.info({ eventId: envelope.eventId }, 'Duplicate delivery - already processed, no-op');
            await this.deleteMessage(receiptHandle);
            return;
        }
        try {
            await this.handle(envelope);
            await this.deleteMessage(receiptHandle);
        }
        catch (error) {
            // Deliberately not deleted - see class doc comment on SQS's own
            // visibility-timeout redelivery being the retry mechanism here.
            this.logger.error({ eventId: envelope.eventId, error }, 'Failed to process Engagement Signal - leaving for redelivery');
        }
    }
    async deleteMessage(receiptHandle) {
        await this.sqsClient.send(new client_sqs_1.DeleteMessageCommand({ QueueUrl: this.queueUrl, ReceiptHandle: receiptHandle }));
    }
    /**
     * Runs `pollOnce()` in a loop until `signal` is aborted (Blueprint
     * ADR-007: apps/worker is a long-running ECS Fargate container, not a
     * Lambda invoked once per message - this loop is that container's main
     * work loop for one consumer command). `main.ts`'s dispatcher is what
     * actually constructs the `AbortSignal` from a process signal (SIGTERM).
     */
    async run(signal) {
        while (!signal.aborted) {
            await this.pollOnce();
        }
    }
}
exports.SqsConsumerBase = SqsConsumerBase;


/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(5);
tslib_1.__exportStar(__webpack_require__(18), exports);
tslib_1.__exportStar(__webpack_require__(19), exports);
tslib_1.__exportStar(__webpack_require__(22), exports);
tslib_1.__exportStar(__webpack_require__(23), exports);
tslib_1.__exportStar(__webpack_require__(24), exports);
tslib_1.__exportStar(__webpack_require__(25), exports);
tslib_1.__exportStar(__webpack_require__(26), exports);
tslib_1.__exportStar(__webpack_require__(21), exports);
tslib_1.__exportStar(__webpack_require__(27), exports);


/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CONTRACTS_LIB = void 0;
/**
 * Placeholder entry point for shared DTOs and Zod schemas (Blueprint §6.3) - the single source of truth for API request/response shapes and the Engagement Signal envelope (Blueprint §10.3). Real content lands alongside apps/api's first real endpoint.
 *
 * This module is scaffolding: it exists so the library registers as a
 * real, buildable, testable Nx project ahead of the milestone that adds
 * its actual contents. It intentionally contains no business logic, no
 * database models, and no authentication code, per Sprint 0 scope.
 */
exports.CONTRACTS_LIB = 'contracts';


/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.actorContextResponseSchema = void 0;
const zod_1 = __webpack_require__(20);
const people_schemas_1 = __webpack_require__(21);
/**
 * `GET /auth/me` (Application Shell sprint, STEP 6 addition — see
 * `apps/web-admin/src/app/APPLICATION_SHELL_DESIGN_NOTES.md` §3 and
 * `apps/api/src/platform/auth/AUTH_DESIGN_NOTES.md`). Mirrors
 * `libs/rbac`'s `ActorContext` exactly (`personId`, `role`, `branchId`,
 * plus the optional scope-narrowing fields) — this is the one place a
 * client can learn its own authenticated identity's role/scope, since
 * `ActorContextResolverService.resolve()` computes it entirely
 * server-side from a DB lookup and no Cognito token claim carries it.
 */
exports.actorContextResponseSchema = zod_1.z.object({
    personId: zod_1.z.string().uuid(),
    role: people_schemas_1.roleSchema,
    branchId: zod_1.z.string().uuid(),
    clusterBacentaIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    bacentaId: zod_1.z.string().uuid().optional(),
    basontaId: zod_1.z.string().uuid().optional(),
});


/***/ }),
/* 20 */
/***/ ((module) => {

module.exports = require("zod");

/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.groupMembershipResponseSchema = exports.groupResponseSchema = exports.updateGroupSchema = exports.createGroupSchema = exports.groupLifecycleStatusSchema = exports.GROUP_LIFECYCLE_STATUS_VALUES = exports.groupTypeSchema = exports.GROUP_TYPE_VALUES = exports.roleAssignmentResponseSchema = exports.createRoleAssignmentRequestSchema = exports.createGroupMembershipRequestSchema = exports.lifecycleTransitionRequestSchema = exports.duplicateCandidateResponseSchema = exports.personResponseSchema = exports.updatePersonSchema = exports.createPersonSchema = exports.roleSchema = exports.ROLE_VALUES = exports.lifecycleStageSchema = exports.LIFECYCLE_STAGE_VALUES = void 0;
const zod_1 = __webpack_require__(20);
/**
 * Shared Zod schemas for the People bounded context (PRD §13.1), the
 * single source of truth for `apps/api`'s request/response shapes
 * (Blueprint §6.3) - runtime-validated via `ZodValidationPipe`
 * (`apps/api/src/platform/pipes/zod-validation.pipe.ts`), with static
 * types inferred via `z.infer<>`, not hand-duplicated.
 *
 * **Why the enums below are re-declared here rather than imported.**
 * `libs/contracts` is a leaf library - "depends on nothing else in the
 * workspace" (this library's own README) - so it cannot import
 * `LifecycleStage` from `libs/domain/people` or `Role` from `libs/rbac`,
 * even though all three (plus `db/schema.prisma`'s own enums) describe
 * the same PRD-defined value sets. See `libs/domain/people/README.md`'s
 * "Why enums are duplicated" note for the same tradeoff stated from that
 * library's side.
 */
exports.LIFECYCLE_STAGE_VALUES = [
    'VISITOR',
    'FIRST_TIME_GUEST',
    'FOLLOW_UP',
    'LAPSED',
    'ASSIGNED_TO_BACENTA',
    'SIX_WEEKS_PARTICIPATION',
    'MEMBER',
];
exports.lifecycleStageSchema = zod_1.z.enum(exports.LIFECYCLE_STAGE_VALUES);
exports.ROLE_VALUES = [
    'RESIDENT_PASTOR',
    'ACTING_RESIDENT_PASTOR',
    'ASSISTANT_PASTOR',
    'BACENTA_LEADER',
    'BASONTA_LEADER',
    'TREASURER',
    'WORKER',
    'MEMBER',
    'VISITOR',
    'ADMIN',
    'COUNCIL_OVERSEER',
];
exports.roleSchema = zod_1.z.enum(exports.ROLE_VALUES);
/**
 * FR-PPL-01 ("create a Person record from ... manual entry by an
 * authorized role"). `branchId`/`lifecycleStage` are deliberately absent:
 * a created Person always starts at `lifecycle_stage = VISITOR` (PRD
 * §12.5's `[*] -> Visitor`, matching `db/schema.prisma`'s own
 * `@default(VISITOR)`) and is scoped to the creating Admin's own Branch
 * (PRD §17.3's `people.person.create` row: ADMIN, scope BRANCH) - neither
 * is a client-supplied input.
 *
 * `overrideDuplicateCheck`: FR-PPL-02 requires "explicit ... action by an
 * authorized role before two records can coexist silently" once a
 * duplicate candidate is found. A first `POST` that turns up a candidate
 * is rejected (409) with the candidate list; resubmitting with this flag
 * set is the caller's explicit acknowledgement to proceed anyway. See
 * `PEOPLE_DESIGN_NOTES.md` - this is a narrower substitute for PRD
 * §16.1's persistent admin "duplicate resolution queue" surface, which
 * has no backing table in the Sprint 1.3 schema.
 */
exports.createPersonSchema = zod_1.z.object({
    firstName: zod_1.z.string().trim().min(1, 'firstName is required'),
    lastName: zod_1.z.string().trim().min(1, 'lastName is required'),
    phone: zod_1.z.string().trim().min(1).optional(),
    email: zod_1.z.string().trim().email().optional(),
    dateOfBirth: zod_1.z.string().date().optional(),
    address: zod_1.z.string().trim().min(1).optional(),
    guardianPersonId: zod_1.z.string().uuid().optional(),
    overrideDuplicateCheck: zod_1.z.boolean().default(false),
});
/** FR-PPL-08's configurable custom fields are H2 (out of scope) - see
 * `PEOPLE_DESIGN_NOTES.md`; `customFields` is deliberately not writable
 * through this schema yet even though the database column already
 * exists (Sprint 1.3). */
exports.updatePersonSchema = zod_1.z
    .object({
    firstName: zod_1.z.string().trim().min(1).optional(),
    lastName: zod_1.z.string().trim().min(1).optional(),
    phone: zod_1.z.string().trim().min(1).nullable().optional(),
    email: zod_1.z.string().trim().email().nullable().optional(),
    dateOfBirth: zod_1.z.string().date().nullable().optional(),
    address: zod_1.z.string().trim().min(1).nullable().optional(),
    guardianPersonId: zod_1.z.string().uuid().nullable().optional(),
})
    .refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be provided' });
exports.personResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    firstName: zod_1.z.string(),
    lastName: zod_1.z.string(),
    phone: zod_1.z.string().nullable(),
    email: zod_1.z.string().nullable(),
    dateOfBirth: zod_1.z.string().nullable(),
    address: zod_1.z.string().nullable(),
    lifecycleStage: exports.lifecycleStageSchema,
    guardianPersonId: zod_1.z.string().uuid().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.duplicateCandidateResponseSchema = zod_1.z.object({
    candidateId: zod_1.z.string().uuid(),
    matchedOn: zod_1.z.enum(['NAME_AND_PHONE', 'NAME_AND_BACENTA_AND_APPROXIMATE_AGE']),
    reason: zod_1.z.string(),
});
/**
 * FR-PPL-03: `toStage` is validated as a member of the enum only here;
 * whether `fromStage -> toStage` is a *modeled* transition is
 * `libs/domain/people`'s `checkLifecycleTransition`'s job, evaluated
 * against the Person's actual current stage server-side, not trusted
 * from the client.
 */
exports.lifecycleTransitionRequestSchema = zod_1.z.object({
    toStage: exports.lifecycleStageSchema,
    reason: zod_1.z.string().trim().min(1).optional(),
});
/**
 * PRD §16.1: Bacenta/Basonta reassignment "requires a reason code."
 * Whether `reason` is actually *required* depends on whether this call
 * closes a prior active Bacenta membership (a reassignment) or opens a
 * brand-new one - `libs/domain/people`'s `planGroupMembershipChange`
 * decides that server-side (`reasonRequiredForClose`), not this schema.
 */
exports.createGroupMembershipRequestSchema = zod_1.z.object({
    groupId: zod_1.z.string().uuid(),
    reason: zod_1.z.string().trim().min(1).optional(),
});
/**
 * PRD §17.3 "Role Assignment: grant Shepherd/Worker/etc." row.
 * `scopeGroupIds` mirrors `db/schema.prisma`'s own field of the same
 * name (Open Question #1, CLUSTER scope's schema-less modeling) -
 * accepted here even though `libs/rbac`'s current `ActorContext`/scope
 * model cannot yet make use of it for authorization (see
 * `AUTH_DESIGN_NOTES.md`), so the data is not lost once that gap is
 * resolved.
 */
exports.createRoleAssignmentRequestSchema = zod_1.z.object({
    role: exports.roleSchema,
    groupId: zod_1.z.string().uuid().optional(),
    scopeGroupIds: zod_1.z.array(zod_1.z.string().uuid()).default([]),
    effectiveFrom: zod_1.z.string().datetime().optional(),
});
exports.roleAssignmentResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid(),
    role: exports.roleSchema,
    branchId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid().nullable(),
    scopeGroupIds: zod_1.z.array(zod_1.z.string().uuid()),
    effectiveFrom: zod_1.z.string(),
    effectiveTo: zod_1.z.string().nullable(),
});
exports.GROUP_TYPE_VALUES = ['PASTORAL_CARE', 'MINISTRY'];
exports.groupTypeSchema = zod_1.z.enum(exports.GROUP_TYPE_VALUES);
exports.GROUP_LIFECYCLE_STATUS_VALUES = ['ACTIVE', 'SPLITTING', 'MERGING', 'ARCHIVED'];
exports.groupLifecycleStatusSchema = zod_1.z.enum(exports.GROUP_LIFECYCLE_STATUS_VALUES);
/**
 * [INFERRED - no PRD §17.3 row covers Group creation itself, see
 * `libs/rbac/src/lib/actions.ts`'s `people.group.*` doc comment]
 * `type` picks Bacenta (`PASTORAL_CARE`, FR-PC-01: "name, leader, meeting
 * schedule, meeting location") vs Basonta (`MINISTRY`, FR-MIN-01: "name,
 * leader, purpose/category"). Both field sets are accepted regardless of
 * `type` rather than validated as type-conditionally-required: the PRD
 * describes what each creation *flow* captures, not a hard schema
 * constraint that the other type's fields must be absent, and
 * `db/schema.prisma`'s own `Group` model leaves `meetingSchedule`/
 * `meetingLocation`/`category` optional for exactly this reason. `leader`
 * itself is deliberately absent - PRD §19.4 step 6 and this module's own
 * `RoleAssignmentService.grant()` establish Bacenta/Basonta leadership as
 * a separate Role Assignment, not a field on Group.
 */
exports.createGroupSchema = zod_1.z.object({
    type: exports.groupTypeSchema,
    name: zod_1.z.string().trim().min(1, 'name is required'),
    meetingSchedule: zod_1.z.string().trim().min(1).optional(),
    meetingLocation: zod_1.z.string().trim().min(1).optional(),
    category: zod_1.z.string().trim().min(1).optional(),
});
exports.updateGroupSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(1).optional(),
    meetingSchedule: zod_1.z.string().trim().min(1).nullable().optional(),
    meetingLocation: zod_1.z.string().trim().min(1).nullable().optional(),
    category: zod_1.z.string().trim().min(1).nullable().optional(),
    lifecycleStatus: exports.groupLifecycleStatusSchema.optional(),
})
    .refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be provided' });
exports.groupResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    type: exports.groupTypeSchema,
    name: zod_1.z.string(),
    meetingSchedule: zod_1.z.string().nullable(),
    meetingLocation: zod_1.z.string().nullable(),
    category: zod_1.z.string().nullable(),
    lifecycleStatus: exports.groupLifecycleStatusSchema,
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.groupMembershipResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid(),
    groupType: zod_1.z.enum(['PASTORAL_CARE', 'MINISTRY']),
    startedAt: zod_1.z.string(),
    endedAt: zod_1.z.string().nullable(),
    reason: zod_1.z.string().nullable(),
});


/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.engagementSignalEnvelopeSchema = void 0;
const zod_1 = __webpack_require__(20);
/**
 * The Engagement Signal envelope (Blueprint §10.3, shown as a TypeScript
 * interface there): every message any producer puts onto the
 * `ecclesia-engagement-signals` EventBridge bus (§10.2), and every message
 * any of the three named SQS consumers (`insights-consumer`,
 * `notification-consumer`, `audit-consumer`, §10.2) receives, is shaped
 * like this. Declared here, in `libs/contracts` rather than
 * `libs/domain/insights` or apps/worker itself, because it is genuinely
 * cross-boundary: apps/api's future event producers and apps/worker's
 * consumers both need the identical wire shape, and `libs/contracts` is
 * the one leaf library both apps already depend on without violating Nx's
 * `enforce-module-boundaries` app-to-app rule.
 *
 * `[BLUEPRINT-EXACT]` field set/names, translated from the Blueprint's own
 * TypeScript interface into a Zod schema (this codebase's one validation
 * library, per `contracts.ts`'s doc comment) rather than left as a bare
 * `interface` - a schema, not just a type, is what
 * `ProcessedEventRepository`'s idempotency check and
 * `EventBridgePublisherService`'s publish path both actually validate
 * against at the process boundary (message off the wire in, event
 * payload out), the same "validate at the boundary" discipline every
 * other contract in this library already follows.
 *
 * `payload` is `z.record(z.unknown())` rather than a generic `<T>` type
 * parameter - Zod schemas are not generic the way the Blueprint's
 * TypeScript interface is; each concrete signal type's own payload shape
 * is validated downstream by whichever consumer/domain function actually
 * interprets it (e.g. `libs/domain/pastoral-care`'s `evaluateSilentDrift`
 * for a `pastoral_care.silent_drift_flagged` payload), not by this
 * envelope schema itself.
 */
exports.engagementSignalEnvelopeSchema = zod_1.z.object({
    eventId: zod_1.z.string().uuid(),
    eventType: zod_1.z.string().min(1),
    schemaVersion: zod_1.z.number().int().positive(),
    branchId: zod_1.z.string().uuid(),
    occurredAt: zod_1.z.string().datetime(),
    subjectPersonId: zod_1.z.string().uuid().optional(),
    subjectGroupId: zod_1.z.string().uuid().optional(),
    payload: zod_1.z.record(zod_1.z.unknown()),
});


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.visitorIntakeResponseSchema = exports.submitVisitorIntakeSchema = exports.attendanceRecordResponseSchema = exports.recordAttendanceSchema = exports.listGatheringsQuerySchema = exports.gatheringResponseSchema = exports.updateGatheringSchema = exports.createGatheringSchema = exports.gatheringSeriesResponseSchema = exports.createGatheringSeriesSchema = exports.attendanceStatusSchema = exports.ATTENDANCE_STATUS_VALUES = exports.gatheringStatusSchema = exports.GATHERING_STATUS_VALUES = void 0;
const zod_1 = __webpack_require__(20);
/**
 * Shared Zod schemas for the Gatherings bounded context (PRD §13.4). See
 * `people.schemas.ts`'s own doc comment for why enums are re-declared
 * here rather than imported - `libs/contracts` is a leaf library.
 */
exports.GATHERING_STATUS_VALUES = ['SCHEDULED', 'CANCELLED', 'COMPLETED'];
exports.gatheringStatusSchema = zod_1.z.enum(exports.GATHERING_STATUS_VALUES);
exports.ATTENDANCE_STATUS_VALUES = ['PRESENT', 'ABSENT', 'EXCUSED'];
exports.attendanceStatusSchema = zod_1.z.enum(exports.ATTENDANCE_STATUS_VALUES);
/**
 * FR-GTH-02. `type` is a free string, not an enum - FR-GTH-01/US-D4:
 * gathering types are Branch-configurable
 * (`platform.configurations.gathering_types`), not fixed at the schema
 * level. `recurrenceRule`'s format is unspecified by the PRD (see
 * `libs/domain/gatherings/README.md`) - accepted here as an opaque
 * string, not parsed or validated by this schema.
 */
exports.createGatheringSeriesSchema = zod_1.z.object({
    type: zod_1.z.string().trim().min(1, 'type is required'),
    groupId: zod_1.z.string().uuid().optional(),
    recurrenceRule: zod_1.z.string().trim().min(1).optional(),
    startDate: zod_1.z.string().date(),
    endDate: zod_1.z.string().date().optional(),
});
exports.gatheringSeriesResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid().nullable(),
    type: zod_1.z.string(),
    recurrenceRule: zod_1.z.string().nullable(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string().nullable(),
    createdByPersonId: zod_1.z.string().uuid(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
/**
 * FR-GTH-01/§12.4. `ownerGroupId` is omitted for a Branch-wide Gathering
 * (e.g. Sunday Service) and required in practice for a Bacenta/Basonta
 * Meeting - PRD §12.4's own implementation note states this per-type
 * requirement narratively ("`BacentaMeeting.ownerGroupId` is mandatory
 * while `SundayFirstService.ownerGroupId` is null") but does not tie it
 * to a specific `type` string value (types are Branch-configurable, not a
 * fixed set this schema could switch on) - so this is not enforced here,
 * only documented; the resource-context guard resolves scope from
 * whichever is actually provided.
 */
exports.createGatheringSchema = zod_1.z.object({
    type: zod_1.z.string().trim().min(1, 'type is required'),
    ownerGroupId: zod_1.z.string().uuid().optional(),
    seriesId: zod_1.z.string().uuid().optional(),
    scheduledStart: zod_1.z.string().datetime(),
    scheduledEnd: zod_1.z.string().datetime().optional(),
    venue: zod_1.z.string().trim().min(1).optional(),
    config: zod_1.z.record(zod_1.z.unknown()).optional(),
});
/**
 * §12.4's edge case: "any one of which can be individually cancelled,
 * rescheduled, or have its attendance recorded without altering the
 * series definition." `status` transitions are validated against
 * `libs/domain/gatherings`'s `checkGatheringStatusTransition` server-side,
 * not trusted from the client.
 */
exports.updateGatheringSchema = zod_1.z
    .object({
    scheduledStart: zod_1.z.string().datetime().optional(),
    scheduledEnd: zod_1.z.string().datetime().nullable().optional(),
    venue: zod_1.z.string().trim().min(1).nullable().optional(),
    status: exports.gatheringStatusSchema.optional(),
    config: zod_1.z.record(zod_1.z.unknown()).nullable().optional(),
})
    .refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be provided' });
exports.gatheringResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    ownerGroupId: zod_1.z.string().uuid().nullable(),
    seriesId: zod_1.z.string().uuid().nullable(),
    type: zod_1.z.string(),
    scheduledStart: zod_1.z.string(),
    scheduledEnd: zod_1.z.string().nullable(),
    venue: zod_1.z.string().nullable(),
    status: exports.gatheringStatusSchema,
    config: zod_1.z.record(zod_1.z.unknown()).nullable(),
    createdByPersonId: zod_1.z.string().uuid(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
/**
 * `GET /gatherings?ownerGroupId=...` (Shepherd Dashboard sprint -
 * [Gap]: only `GET /gatherings/:id` existed before, no way to find "my
 * Bacenta's next/last meeting" without already knowing its id. See
 * `apps/mobile/.../ShepherdDashboard/SHEPHERD_DASHBOARD_DESIGN_NOTES.md`
 * STEP 6). `ownerGroupId` is required - a Branch-wide, ungrouped listing
 * is out of scope for this sprint's one caller (the dashboard's
 * Today's-Meeting/Attendance-Summary cards, both Bacenta-scoped).
 * `from`/`to` default to "now through 30 days out" at the service layer,
 * not here.
 */
exports.listGatheringsQuerySchema = zod_1.z.object({
    ownerGroupId: zod_1.z.string().uuid(),
    from: zod_1.z.string().datetime().optional(),
    to: zod_1.z.string().datetime().optional(),
});
/** FR-GTH-03. One record per Person per Gathering instance
 * (`db/schema.prisma`'s `@@unique([gatheringId, personId])`) - recording
 * again for the same pair overwrites the prior status (a correction, e.g.
 * marked absent by mistake), not a second record. */
exports.recordAttendanceSchema = zod_1.z.object({
    personId: zod_1.z.string().uuid(),
    status: exports.attendanceStatusSchema,
});
exports.attendanceRecordResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    gatheringId: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    status: exports.attendanceStatusSchema,
    recordedByPersonId: zod_1.z.string().uuid(),
    recordedAt: zod_1.z.string(),
});
/**
 * FR-GTH-04/BR-GTH-03. `submittedData` mirrors `db/schema.prisma`'s own
 * Json column - §16.1's minimal example fields ("name, phone, how they
 * heard about the church") accepted as free-form data, not a pinned
 * shape, matching the schema's own disclosed looseness. `firstTimeGuest`
 * lets the capturing actor confirm "this is their first attendance"
 * (FR-GTH-04: Visitor vs FirstTimeGuest at creation) - a fact only a
 * human at the point of capture can know, not something this schema
 * infers. `bacentaPreferenceGroupId` is US-A2's "Bacenta preference" -
 * when supplied, the service resolves that Bacenta's current Shepherd as
 * the Follow-up task's assignee; when omitted, no Follow-up task is
 * auto-created (see `GATHERINGS_DESIGN_NOTES.md`'s open question on the
 * unspecified "rotation among Shepherds" fallback).
 */
exports.submitVisitorIntakeSchema = zod_1.z.object({
    gatheringId: zod_1.z.string().uuid().optional(),
    firstName: zod_1.z.string().trim().min(1, 'firstName is required'),
    lastName: zod_1.z.string().trim().min(1, 'lastName is required'),
    phone: zod_1.z.string().trim().min(1).optional(),
    howTheyHeard: zod_1.z.string().trim().min(1).optional(),
    firstTimeGuest: zod_1.z.boolean().default(false),
    bacentaPreferenceGroupId: zod_1.z.string().uuid().optional(),
});
exports.visitorIntakeResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    gatheringId: zod_1.z.string().uuid().nullable(),
    personId: zod_1.z.string().uuid().nullable(),
    submittedData: zod_1.z.record(zod_1.z.unknown()),
    createdAt: zod_1.z.string(),
    followUpTaskCreated: zod_1.z.boolean(),
});


/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.alertListResponseSchema = exports.groupDashboardResponseSchema = exports.branchDashboardResponseSchema = exports.resolveAlertSchema = exports.alertResponseSchema = exports.pulseScoreResponseSchema = exports.recordEngagementSignalSchema = exports.alertStatusSchema = exports.ALERT_STATUS_VALUES = exports.pulseScoreScopeTypeSchema = exports.PULSE_SCORE_SCOPE_TYPE_VALUES = void 0;
const zod_1 = __webpack_require__(20);
/**
 * Shared Zod schemas for the Insights bounded context (PRD §13.6). See
 * `people.schemas.ts`'s own doc comment for why enums are re-declared
 * here rather than imported from `libs/domain/insights` -
 * `libs/contracts` is a leaf library and must not depend on a domain
 * library.
 *
 * **`signalType` is a plain string, not a Zod enum.**
 * `db/schema.prisma`'s `EngagementSignal.signalType` is a bare `String`
 * column (not a Prisma/DB enum) - `libs/domain/insights`'s
 * `isChurchPulseSignalType()` is the one place that closes it to the six
 * `[PRD-DERIVED]` Church Pulse categories, deliberately at the domain
 * layer rather than the wire layer, so a signal source that does not yet
 * map to a scored category can still be ingested and stored without a
 * contract change (Blueprint §4.3 rule 3: Insights "depends only on the
 * Engagement Signal stream" - the stream's own wire shape should not be
 * artificially narrower than the table that backs it).
 *
 * **`scopeType`/`scopeId` (not separate `groupId`/`branchId` fields).**
 * Mirrors `PulseScoreScopeType` (`db/schema.prisma`) exactly -
 * `PulseScore`/`PulseScoreHistory`/`Alert` all key off a generic scope
 * pair. `PERSON` is included here for type-fidelity with the DB enum, but
 * no route in this milestone ever produces or accepts a `PERSON`-scoped
 * value - see `PulseScoreService`'s doc comment (NFR-PRIV-02).
 */
exports.PULSE_SCORE_SCOPE_TYPE_VALUES = ['PERSON', 'GROUP', 'BRANCH'];
exports.pulseScoreScopeTypeSchema = zod_1.z.enum(exports.PULSE_SCORE_SCOPE_TYPE_VALUES);
exports.ALERT_STATUS_VALUES = ['OPEN', 'ACTED', 'DISMISSED'];
exports.alertStatusSchema = zod_1.z.enum(exports.ALERT_STATUS_VALUES);
/**
 * The shape `EngagementSignalService.record()` accepts (Blueprint §10.3's
 * event envelope, narrowed to the fields `engagement_signals` actually
 * persists - this module has no async event-bus consumer yet, see
 * `INSIGHTS_DESIGN_NOTES.md`, so `eventId`/`eventType`/`schemaVersion`
 * are not modeled here; they belong to the envelope a future
 * apps/worker consumer would unwrap before calling this same method).
 * Not validated by `ZodValidationPipe` anywhere in this milestone (no
 * HTTP route accepts it directly) - defined here anyway so the shape has
 * one canonical source of truth ready for that future consumer.
 */
exports.recordEngagementSignalSchema = zod_1.z.object({
    branchId: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid().optional(),
    groupId: zod_1.z.string().uuid().optional(),
    signalType: zod_1.z.string().min(1),
    payload: zod_1.z.record(zod_1.z.unknown()).default({}),
    occurredAt: zod_1.z.string().datetime(),
});
exports.pulseScoreResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    scopeType: exports.pulseScoreScopeTypeSchema,
    scopeId: zod_1.z.string().uuid(),
    score: zod_1.z.number().min(0).max(100),
    computedAt: zod_1.z.string().datetime(),
});
exports.alertResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    scopeType: exports.pulseScoreScopeTypeSchema,
    scopeId: zod_1.z.string().uuid(),
    alertType: zod_1.z.string(),
    message: zod_1.z.string().nullable(),
    status: exports.alertStatusSchema,
    resolvedByPersonId: zod_1.z.string().uuid().nullable(),
    resolvedAt: zod_1.z.string().datetime().nullable(),
    triggeredAt: zod_1.z.string().datetime(),
});
/**
 * FR-INS-05: "record whether a leader acted on a proactive Insights
 * alert vs. dismissed it without action." `OPEN` is deliberately excluded
 * here - a leader resolves an alert into exactly one of the two terminal
 * states, they do not re-open one through this endpoint (there is no PRD
 * text describing a re-open flow).
 */
exports.resolveAlertSchema = zod_1.z.object({
    status: zod_1.z.enum(['ACTED', 'DISMISSED']),
});
/** `GET /insights/branch-dashboard` (FR-INS-04, Resident Pastor's
 * whole-Branch view). */
exports.branchDashboardResponseSchema = zod_1.z.object({
    branchId: zod_1.z.string().uuid(),
    pulseScore: exports.pulseScoreResponseSchema,
    alerts: zod_1.z.array(exports.alertResponseSchema),
});
/** `GET /insights/bacenta-dashboard/:groupId` and
 * `GET /insights/cluster-dashboard/:groupId` (FR-INS-04, Shepherd's own
 * Bacenta / Assistant Pastor's cluster drill-down) - same response shape,
 * different RBAC action/scope per `permission-matrix.ts`. See
 * `INSIGHTS_DESIGN_NOTES.md` for why the cluster route is a single-Bacenta
 * drill-down rather than a true multi-Bacenta ranked list. */
exports.groupDashboardResponseSchema = zod_1.z.object({
    branchId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid(),
    pulseScore: exports.pulseScoreResponseSchema,
    alerts: zod_1.z.array(exports.alertResponseSchema),
});
/** `GET /insights/alerts` (the Alert inbox surface, PRD §16.6). */
exports.alertListResponseSchema = zod_1.z.array(exports.alertResponseSchema);


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.overcommitmentFlagListResponseSchema = exports.overcommitmentFlagResponseSchema = exports.rosterResponseSchema = exports.rosterMemberResponseSchema = exports.workerAvailabilityResponseSchema = exports.recordWorkerAvailabilitySchema = exports.staffingTargetResponseSchema = exports.createStaffingTargetSchema = void 0;
const zod_1 = __webpack_require__(20);
/**
 * Shared Zod schemas for the Ministry bounded context (PRD §13.3). See
 * `people.schemas.ts`'s own doc comment for why enums/shapes are
 * re-declared here rather than imported from `libs/domain/ministry` -
 * `libs/contracts` is a leaf library and must not depend on a domain
 * library.
 */
/// [PRD-DERIVED] FR-MIN-02: "define a staffing target for a specific
/// upcoming Gathering" - a positive count, not a ratio or percentage.
const targetCountSchema = zod_1.z.number().int().positive();
/**
 * FR-MIN-02: set a staffing target against one (Gathering, Basonta) pair.
 * `db/schema.prisma`'s `@@unique([gatheringId, groupId])` makes this an
 * upsert at the repository layer (`StaffingTargetRepository.upsert()`) -
 * re-submitting for the same pair corrects the existing target rather
 * than erroring, the same "re-recording is a correction, not a
 * duplicate" precedent `recordAttendanceSchema`/
 * `AttendanceRecordRepository.upsert()` already established. No separate
 * update schema/action exists - see `libs/rbac/src/lib/actions.ts`'s doc
 * comment on `ministry.staffing_target.create`.
 */
exports.createStaffingTargetSchema = zod_1.z.object({
    gatheringId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid(),
    targetCount: targetCountSchema,
});
/**
 * FR-MIN-03: the response embeds the live-computed adequacy alongside the
 * stored target - "compute-on-read," the same pattern Insights'
 * `PulseScoreService` already established, rather than a separate
 * `/adequacy` sub-route (mirrors Gatherings' `checkCompleteness` reusing
 * its parent resource's own `.read` action instead of inventing a new
 * one).
 */
exports.staffingTargetResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    gatheringId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid(),
    targetCount: zod_1.z.number().int(),
    rosteredCount: zod_1.z.number().int(),
    ratio: zod_1.z.number(),
    isAdequate: zod_1.z.boolean(),
    createdByPersonId: zod_1.z.string().uuid(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
/**
 * §16.3's "Worker availability self-service (H2)": "lets a worker mark
 * themselves unavailable for a date range." Date-only (`z.string().date()`),
 * matching `dateOfBirth`'s own convention in `people.schemas.ts` for a
 * Prisma `@db.Date` (not `@db.Timestamptz`) column - see
 * `db/schema.prisma`'s `WorkerAvailability` model.
 */
exports.recordWorkerAvailabilitySchema = zod_1.z
    .object({
    unavailableFrom: zod_1.z.string().date(),
    unavailableTo: zod_1.z.string().date(),
    reason: zod_1.z.string().optional(),
})
    .refine((value) => value.unavailableFrom <= value.unavailableTo, {
    message: 'unavailableFrom must not be after unavailableTo',
    path: ['unavailableTo'],
});
exports.workerAvailabilityResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid(),
    unavailableFrom: zod_1.z.string(),
    unavailableTo: zod_1.z.string(),
    reason: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string().datetime(),
});
/** `GET /ministry/groups/:groupId/roster` (FR-MIN-01/§16.3's "Basonta
 * roster view") - the underlying membership data is People's own
 * (`GroupMembership`), surfaced here through Ministry's exported
 * `GroupRosterService` consumer, not duplicated. */
exports.rosterMemberResponseSchema = zod_1.z.object({
    personId: zod_1.z.string().uuid(),
    startedAt: zod_1.z.string().datetime(),
});
exports.rosterResponseSchema = zod_1.z.array(exports.rosterMemberResponseSchema);
/**
 * `GET /ministry/groups/:groupId/roster/overcommitment` (FR-MIN-04). See
 * `libs/domain/ministry`'s `overcommitment.ts` doc comment for why
 * `concurrentCommitmentCount` measures concurrent active Basonta
 * memberships, not literal concurrent Gathering commitments.
 */
exports.overcommitmentFlagResponseSchema = zod_1.z.object({
    personId: zod_1.z.string().uuid(),
    concurrentCommitmentCount: zod_1.z.number().int(),
    threshold: zod_1.z.number().int(),
    overcommitted: zod_1.z.literal(true),
});
exports.overcommitmentFlagListResponseSchema = zod_1.z.array(exports.overcommitmentFlagResponseSchema);


/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.pastoralNoteResponseSchema = exports.createPastoralNoteSchema = exports.listSilentDriftFlagsQuerySchema = exports.silentDriftFlagResponseSchema = exports.silentDriftStatusSchema = exports.SILENT_DRIFT_STATUS_VALUES = exports.listFollowUpTasksQuerySchema = exports.followUpTaskResponseSchema = exports.escalateFollowUpTaskSchema = exports.createFollowUpTaskSchema = exports.followUpTaskTriggerSchema = exports.FOLLOW_UP_TASK_TRIGGER_VALUES = exports.followUpTaskStatusSchema = exports.FOLLOW_UP_TASK_STATUS_VALUES = exports.poimenEnrollmentResponseSchema = exports.updatePoimenStatusSchema = exports.enrollPoimenCandidateSchema = exports.poimenStatusSchema = exports.POIMEN_STATUS_VALUES = void 0;
const zod_1 = __webpack_require__(20);
/**
 * Shared Zod schemas for the Pastoral Care bounded context (PRD §13.2).
 * See `people.schemas.ts`'s own doc comment for why enums are re-declared
 * here rather than imported - `libs/contracts` is a leaf library.
 */
exports.POIMEN_STATUS_VALUES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE'];
exports.poimenStatusSchema = zod_1.z.enum(exports.POIMEN_STATUS_VALUES);
/**
 * FR-PC-06: enrolling a candidate in Poimen training. No body beyond the
 * route's `:personId` is required - enrollment always starts at
 * `NOT_STARTED` (`db/schema.prisma`'s own `@default(NOT_STARTED)`), the
 * same "no client-supplied initial state" pattern `createPersonSchema`
 * already uses for `lifecycleStage`.
 */
exports.enrollPoimenCandidateSchema = zod_1.z.object({});
exports.updatePoimenStatusSchema = zod_1.z.object({
    status: exports.poimenStatusSchema,
});
exports.poimenEnrollmentResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid(),
    status: exports.poimenStatusSchema,
    enrolledAt: zod_1.z.string().nullable(),
    completedAt: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.FOLLOW_UP_TASK_STATUS_VALUES = ['OPEN', 'ESCALATED', 'COMPLETED'];
exports.followUpTaskStatusSchema = zod_1.z.enum(exports.FOLLOW_UP_TASK_STATUS_VALUES);
exports.FOLLOW_UP_TASK_TRIGGER_VALUES = ['FIRST_TIME_GUEST', 'LAPSED_REENGAGEMENT', 'MANUAL'];
exports.followUpTaskTriggerSchema = zod_1.z.enum(exports.FOLLOW_UP_TASK_TRIGGER_VALUES);
/**
 * FR-PC-03/FR-PC-04: creating a Follow-up task always requires an
 * explicit `assignedToPersonId` - PRD §19.1 step 3's "default rule
 * (geographic/Bacenta preference, or a rotation among Shepherds if no
 * preference given)" for the *automatic* FIRST_TIME_GUEST trigger has no
 * concrete, buildable algorithm specified in the PRD (no rotation-state
 * field exists anywhere in `db/schema.prisma`, and "geographic
 * preference" is not a captured Person field) - so this module does not
 * invent one. See `PASTORAL_CARE_DESIGN_NOTES.md`'s open question. This
 * schema covers explicit/manual creation only; `trigger` is optional and,
 * when supplied, only affects which SLA default
 * (`DEFAULT_FOLLOW_UP_SLA_DAYS`, `libs/domain/pastoral-care`) applies.
 */
exports.createFollowUpTaskSchema = zod_1.z.object({
    assignedToPersonId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid().optional(),
    trigger: exports.followUpTaskTriggerSchema.default('MANUAL'),
    dueAtOverride: zod_1.z.string().datetime().optional(),
});
/**
 * BR-PC-04: escalation names the target explicitly - resolving "the
 * assigned Person's organizational superior (typically Shepherd ->
 * Assistant Pastor)" automatically requires an org-hierarchy lookup this
 * module does not yet perform (see `PASTORAL_CARE_DESIGN_NOTES.md`), so
 * the caller supplies the target rather than the system inventing one.
 */
exports.escalateFollowUpTaskSchema = zod_1.z.object({
    escalatedToPersonId: zod_1.z.string().uuid(),
});
exports.followUpTaskResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid().nullable(),
    personId: zod_1.z.string().uuid(),
    assignedToPersonId: zod_1.z.string().uuid(),
    status: exports.followUpTaskStatusSchema,
    dueAt: zod_1.z.string().nullable(),
    escalatedAt: zod_1.z.string().nullable(),
    escalatedToPersonId: zod_1.z.string().uuid().nullable(),
    createdByPersonId: zod_1.z.string().uuid().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
/**
 * `GET /pastoral-care/groups/:groupId/follow-up-tasks` (§16.2's
 * "Follow-up task queue... sorted by SLA urgency" surface -
 * [Gap, Shepherd Dashboard sprint]: no list endpoint existed before this
 * sprint, only single-task CRUD by id - see
 * `apps/mobile/.../ShepherdDashboard/SHEPHERD_DASHBOARD_DESIGN_NOTES.md`
 * STEP 6). `status` accepts a comma-separated list so a caller can ask
 * for "everything still open" (`OPEN,ESCALATED`, this endpoint's default)
 * in one round trip rather than one request per status value.
 */
exports.listFollowUpTasksQuerySchema = zod_1.z.object({
    status: zod_1.z
        .string()
        .trim()
        .min(1)
        .optional()
        .transform((value) => (value ? value.split(',').map((entry) => entry.trim()) : undefined))
        .pipe(zod_1.z.array(exports.followUpTaskStatusSchema).optional()),
});
/**
 * FR-PC-05/§15.8's decision tree output. `SilentDriftFlag` rows have
 * been written by `apps/worker`'s nightly `SilentDriftSweepJob` since the
 * Insights milestone (`db/schema.prisma`'s `silent_drift_flags` table),
 * but no HTTP surface read them until this sprint - see
 * `SHEPHERD_DASHBOARD_DESIGN_NOTES.md` STEP 6. `attendanceMissedCount`/
 * `bacentaMissedCount` (against their respective thresholds) are the
 * literal "specific pattern" US-G3 requires be shown instead of a generic
 * "at risk" label.
 */
exports.SILENT_DRIFT_STATUS_VALUES = ['FLAGGED', 'RESOLVED', 'ESCALATED'];
exports.silentDriftStatusSchema = zod_1.z.enum(exports.SILENT_DRIFT_STATUS_VALUES);
exports.silentDriftFlagResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid(),
    attendanceMissedCount: zod_1.z.number().int(),
    attendanceThreshold: zod_1.z.number().int(),
    bacentaMissedCount: zod_1.z.number().int(),
    bacentaThreshold: zod_1.z.number().int(),
    status: exports.silentDriftStatusSchema,
    assignedShepherdPersonId: zod_1.z.string().uuid().nullable(),
    resolvedAt: zod_1.z.string().nullable(),
    escalatedAt: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
});
/** `GET /pastoral-care/groups/:groupId/silent-drift-flags`. Same
 * comma-separated-list convention as `listFollowUpTasksQuerySchema`;
 * defaults to the two still-open statuses (`FLAGGED,ESCALATED`) at the
 * service layer, not here, so the schema stays a pure shape check. */
exports.listSilentDriftFlagsQuerySchema = zod_1.z.object({
    status: zod_1.z
        .string()
        .trim()
        .min(1)
        .optional()
        .transform((value) => (value ? value.split(',').map((entry) => entry.trim()) : undefined))
        .pipe(zod_1.z.array(exports.silentDriftStatusSchema).optional()),
});
/**
 * §16.2's pastoral notes capability, NFR-PRIV-01 permission-sensitive
 * (`pastoral_care.notes.*` explicitly DENIES ADMIN in
 * `libs/rbac/src/lib/permission-matrix.ts`, "configuration authority does
 * not imply pastoral-content access" - Blueprint §9.3's own worked
 * example). `db/schema.prisma`'s `PastoralNote` has no `updatedAt` -
 * immutable once written, so there is no update schema here.
 */
exports.createPastoralNoteSchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(1, 'content is required'),
});
exports.pastoralNoteResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid(),
    authorPersonId: zod_1.z.string().uuid(),
    content: zod_1.z.string(),
    createdAt: zod_1.z.string(),
});


/***/ }),
/* 27 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.pledgeResponseSchema = exports.fulfillPledgeSchema = exports.createPledgeSchema = exports.projectResponseSchema = exports.createProjectSchema = exports.expenseResponseSchema = exports.attachExpenseReceiptSchema = exports.rejectExpenseSchema = exports.requestExpenseSchema = exports.financialTransactionResponseSchema = exports.flagFinancialTransactionSchema = exports.recordFinancialTransactionSchema = exports.projectStatusSchema = exports.PROJECT_STATUS_VALUES = exports.outboundTransactionStateSchema = exports.OUTBOUND_TRANSACTION_STATE_VALUES = exports.inboundTransactionStateSchema = exports.INBOUND_TRANSACTION_STATE_VALUES = exports.financialTransactionChannelSchema = exports.FINANCIAL_TRANSACTION_CHANNEL_VALUES = exports.financialTransactionTypeSchema = exports.FINANCIAL_TRANSACTION_TYPE_VALUES = void 0;
const zod_1 = __webpack_require__(20);
/**
 * Shared Zod schemas for the Stewardship bounded context (PRD §13.5). See
 * `people.schemas.ts`'s own doc comment for why enums are re-declared
 * here rather than imported - `libs/contracts` is a leaf library.
 *
 * **`amountMinor` is a decimal string on the wire, never a JSON number.**
 * `db/schema.prisma`'s `FinancialTransaction.amountMinor`/
 * `Expense`/`Project`/`Pledge`'s equivalent fields are Prisma `BigInt`
 * (Blueprint §7.4: minor currency units, avoiding float rounding error).
 * `BigInt` cannot round-trip through `JSON.stringify`/`JSON.parse` at all
 * (it throws), and a plain JS `number` loses precision past 2^53 - a
 * decimal string is the only lossless wire representation. Every
 * `amountMinor`-shaped field below is `z.string().regex(/^[0-9]+$/)` on
 * both the request and response schemas; conversion to/from Prisma's
 * native `BigInt` happens only at the repository boundary
 * (`apps/api/src/modules/stewardship`), never here.
 */
const amountMinorSchema = zod_1.z
    .string()
    .regex(/^[0-9]+$/, 'amountMinor must be a non-negative integer string of minor currency units');
/// [PRD-DERIVED] NFR-L10N-02: "Financial Transaction entities carry an
/// explicit currency field" - ISO 4217, defaulting to GHS per the
/// reference deployment.
const currencySchema = zod_1.z.string().length(3).default('GHS');
exports.FINANCIAL_TRANSACTION_TYPE_VALUES = ['OFFERING', 'TITHE', 'SPECIAL_OFFERING', 'PLEDGE', 'DONATION', 'EXPENSE'];
exports.financialTransactionTypeSchema = zod_1.z.enum(exports.FINANCIAL_TRANSACTION_TYPE_VALUES);
exports.FINANCIAL_TRANSACTION_CHANNEL_VALUES = ['CASH', 'MOBILE_MONEY'];
exports.financialTransactionChannelSchema = zod_1.z.enum(exports.FINANCIAL_TRANSACTION_CHANNEL_VALUES);
exports.INBOUND_TRANSACTION_STATE_VALUES = ['RECORDED', 'VERIFIED', 'FLAGGED', 'UNDER_INVESTIGATION', 'RECONCILED'];
exports.inboundTransactionStateSchema = zod_1.z.enum(exports.INBOUND_TRANSACTION_STATE_VALUES);
exports.OUTBOUND_TRANSACTION_STATE_VALUES = ['REQUESTED', 'APPROVED', 'REJECTED', 'PAID', 'RECEIPT_RETAINED'];
exports.outboundTransactionStateSchema = zod_1.z.enum(exports.OUTBOUND_TRANSACTION_STATE_VALUES);
exports.PROJECT_STATUS_VALUES = ['ACTIVE', 'COMPLETED', 'CANCELLED'];
exports.projectStatusSchema = zod_1.z.enum(exports.PROJECT_STATUS_VALUES);
/**
 * FR-STW-01/05: "record an inbound Financial Transaction (Offering,
 * Tithe, or Special Offering)... recording the giving channel." `type`
 * excludes `EXPENSE` (that sub-flow is `requestExpenseSchema` below,
 * FR-STW-09) but includes `PLEDGE`/`DONATION` - [INFERRED] a Pledge's
 * actual *payment* is recorded through this same inbound flow like any
 * other gift, then optionally linked back to its originating `Pledge` row
 * via `fulfillPledgeSchema`; the PRD does not spell out this linkage
 * step-by-step. `channel` is required here (not optional, unlike the
 * underlying nullable DB column, which also serves `Expense` rows that
 * have no channel at all) per FR-STW-05's "every inbound transaction has
 * a non-null channel value."
 *
 * **No client-supplied `giverPersonId`.** §12.7's edge case says an
 * individual Mobile Money transaction's "`source` is the giving Person
 * directly" - which for the SELF-scoped Treasurer/Member `record` rows in
 * `permission-matrix.ts` must always be the *acting* Person (RBAC's own
 * `SELF` scope check is `resource.ownerId === actor.personId`, per
 * `evaluate.ts`). Accepting a client-supplied `giverPersonId` would let an
 * actor claim to record a gift "on behalf of" an arbitrary other Person
 * while still passing the SELF scope check written against their own
 * identity - `FinancialTransactionService.record()` always sets
 * `giverPersonId` to `actor.personId` itself when no `sourceGroupId` is
 * given, never from client input.
 */
exports.recordFinancialTransactionSchema = zod_1.z.object({
    type: exports.financialTransactionTypeSchema.exclude(['EXPENSE']),
    sourceGroupId: zod_1.z.string().uuid().optional(),
    channel: exports.financialTransactionChannelSchema,
    amountMinor: amountMinorSchema,
    currency: currencySchema.optional(),
});
/** FR-STW-04: "mark a transaction Flagged with a reason." */
exports.flagFinancialTransactionSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(1, 'reason is required'),
});
exports.financialTransactionResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    type: exports.financialTransactionTypeSchema,
    sourceGroupId: zod_1.z.string().uuid().nullable(),
    giverPersonId: zod_1.z.string().uuid().nullable(),
    channel: exports.financialTransactionChannelSchema.nullable(),
    amountMinor: amountMinorSchema,
    currency: zod_1.z.string().length(3),
    currentState: zod_1.z.string(),
    /** [INFERRED] Resolved by the service from the `RECORDED` event's
     * `actorUserId` -> `Person.id` (Blueprint §9.4 / PRD §17.4's
     * `DIFFERENT_ACTOR_THAN_RECORDER` record-level check needs this same
     * fact at the guard layer; surfacing it on the response DTO too lets a
     * verification-queue UI show who recorded each entry). `null` only in
     * the theoretical case no `RECORDED` event exists for this transaction,
     * which the service never itself produces. */
    recordedByPersonId: zod_1.z.string().uuid().nullable(),
    createdAt: zod_1.z.string().datetime(),
});
/**
 * FR-STW-09: expense request/approve/reject/pay/receipt. Modeled as a 1:1
 * extension of `FinancialTransaction` (`type=EXPENSE`) per
 * `db/DESIGN_NOTES.md` Open Question #5.
 */
exports.requestExpenseSchema = zod_1.z.object({
    amountMinor: amountMinorSchema,
    currency: currencySchema.optional(),
    description: zod_1.z.string().trim().min(1, 'description is required'),
    category: zod_1.z.string().trim().min(1).optional(),
});
/** FR-STW-09: rejection requires a reason, matching
 * `flagFinancialTransactionSchema`'s own shape - both are a designated
 * reviewer explaining a non-default outcome. */
exports.rejectExpenseSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(1, 'reason is required'),
});
/** BR-STW-08: "receipts are retained for all expenses" -
 * `receiptStorageKey` mirrors `Expense.receiptStorageKey`'s own naming;
 * this milestone does not implement the file upload itself (out of scope
 * for an application-layer/API milestone - see
 * `STEWARDSHIP_DESIGN_NOTES.md`), only recording the storage key of an
 * already-uploaded receipt. */
exports.attachExpenseReceiptSchema = zod_1.z.object({
    receiptStorageKey: zod_1.z.string().trim().min(1, 'receiptStorageKey is required'),
});
exports.expenseResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    transactionId: zod_1.z.string().uuid(),
    requestedByPersonId: zod_1.z.string().uuid(),
    description: zod_1.z.string(),
    category: zod_1.z.string().nullable(),
    receiptStorageKey: zod_1.z.string().nullable(),
    approvedByPersonId: zod_1.z.string().uuid().nullable(),
    approvedAt: zod_1.z.string().datetime().nullable(),
    amountMinor: amountMinorSchema,
    currency: zod_1.z.string().length(3),
    currentState: zod_1.z.string(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
/** FR-STW-08/H2: Project entities against which Pledges are tracked. */
exports.createProjectSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'name is required'),
    description: zod_1.z.string().trim().min(1).optional(),
    targetAmountMinor: amountMinorSchema,
    currency: currencySchema.optional(),
});
exports.projectResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    targetAmountMinor: amountMinorSchema,
    currency: zod_1.z.string().length(3),
    status: exports.projectStatusSchema,
    createdByPersonId: zod_1.z.string().uuid(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
/**
 * FR-STW-08/H2: a Pledge is the *commitment*; `fulfillPledgeSchema` links
 * it to an already-`recordFinancialTransactionSchema`-recorded payment via
 * `fulfilledTransactionId` - see `recordFinancialTransactionSchema`'s doc
 * comment. `reminderOptIn` mirrors OQ-07's resolution ("a single, opt-in,
 * gentle notice... never a repeated or pressuring sequence") - this
 * milestone accepts the opt-in flag but does not build the reminder
 * delivery itself (no scheduler exists in this codebase - see
 * `STEWARDSHIP_DESIGN_NOTES.md`).
 */
exports.createPledgeSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    pledgedAmountMinor: amountMinorSchema,
    currency: currencySchema.optional(),
    reminderOptIn: zod_1.z.boolean().default(false),
});
exports.fulfillPledgeSchema = zod_1.z.object({
    fulfilledTransactionId: zod_1.z.string().uuid(),
});
exports.pledgeResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    projectId: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid(),
    pledgedAmountMinor: amountMinorSchema,
    currency: zod_1.z.string().length(3),
    pledgedAt: zod_1.z.string().datetime(),
    reminderOptIn: zod_1.z.boolean(),
    reminderSentAt: zod_1.z.string().datetime().nullable(),
    fulfilledTransactionId: zod_1.z.string().uuid().nullable(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});


/***/ }),
/* 28 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventsModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const config_1 = __webpack_require__(12);
const eventbridge_publisher_service_1 = __webpack_require__(29);
const processed_event_repository_1 = __webpack_require__(13);
const sqs_client_provider_1 = __webpack_require__(14);
const database_module_1 = __webpack_require__(31);
/**
 * Event-bus infrastructure shared by every consumer/sweep this Worker
 * milestone builds (Blueprint §10 as a whole): the EventBridge publisher,
 * the shared SQS client, and the idempotency repository. Concrete
 * consumers (`InsightsConsumer`, ...) and jobs
 * (`SilentDriftSweepJob`, ...) each import this module rather than
 * reconstructing any of these three.
 */
let EventsModule = class EventsModule {
};
exports.EventsModule = EventsModule;
exports.EventsModule = EventsModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [database_module_1.WorkerDatabaseModule],
        providers: [
            eventbridge_publisher_service_1.EventBridgePublisherService,
            processed_event_repository_1.ProcessedEventRepository,
            {
                provide: sqs_client_provider_1.SQS_CLIENT,
                inject: [config_1.ConfigService],
                useFactory: (configService) => (0, sqs_client_provider_1.sqsClientFactory)(configService),
            },
        ],
        exports: [eventbridge_publisher_service_1.EventBridgePublisherService, processed_event_repository_1.ProcessedEventRepository, sqs_client_provider_1.SQS_CLIENT],
    })
], EventsModule);


/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventBridgePublisherService = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const config_1 = __webpack_require__(12);
const client_eventbridge_1 = __webpack_require__(30);
const nestjs_pino_1 = __webpack_require__(3);
/**
 * Publishes an `EngagementSignalEnvelope` (Blueprint §10.3) onto the one
 * shared EventBridge bus (§10.2, `EVENTBRIDGE_BUS_NAME`, defaulted to
 * `ecclesia-engagement-signals`). Used two ways in this milestone's
 * vertical slice:
 *
 * 1. A live event producer in apps/api would call this to publish a
 *    real-time Engagement Signal - not built in this vertical slice (no
 *    apps/api call site emits one yet, same disclosed gap
 *    `INSIGHTS_DESIGN_NOTES.md` already names at length).
 * 2. `SilentDriftSweepJob` (this vertical slice) calls this to publish the
 *    *synthetic* Engagement Signal a scheduled sweep emits on detecting a
 *    condition (§10.8: "On detecting a condition, a sweep job emits a
 *    synthetic Engagement Signal onto the same bus... rather than calling
 *    the Notification service directly, keeping exactly one downstream
 *    reaction mechanism regardless of trigger source").
 *
 * **`Source`/`DetailType` on the underlying `PutEventsCommand` are an
 * inferred implementation detail, not a Blueprint citation.** EventBridge's
 * `PutEvents` API requires a `Source` string and accepts an optional
 * `DetailType`; neither document specifies what either should contain.
 * `Source` is fixed to `'ecclesia.worker'` (every publish in this codebase
 * currently originates from apps/worker); `DetailType` is set to the
 * envelope's own `eventType` (e.g. `pastoral_care.silent_drift_flagged`),
 * the most literal available value and one a real EventBridge Rule could
 * filter on. Both are flagged here as constructions, not requirements.
 */
let EventBridgePublisherService = class EventBridgePublisherService {
    configService;
    logger;
    client;
    busName;
    constructor(configService, logger) {
        this.configService = configService;
        this.logger = logger;
        this.client = new client_eventbridge_1.EventBridgeClient({ region: this.configService.get('AWS_REGION', { infer: true }) });
        this.busName = this.configService.get('EVENTBRIDGE_BUS_NAME', { infer: true });
    }
    async publish(envelope) {
        const command = new client_eventbridge_1.PutEventsCommand({
            Entries: [
                {
                    EventBusName: this.busName,
                    Source: 'ecclesia.worker',
                    DetailType: envelope.eventType,
                    Detail: JSON.stringify(envelope),
                },
            ],
        });
        const result = await this.client.send(command);
        if (result.FailedEntryCount && result.FailedEntryCount > 0) {
            const failure = result.Entries?.find((entry) => entry.ErrorCode);
            throw new Error(`EventBridge PutEvents failed for eventId=${envelope.eventId}: ${failure?.ErrorCode} ${failure?.ErrorMessage}`);
        }
        this.logger.info({ eventId: envelope.eventId, eventType: envelope.eventType }, 'Published Engagement Signal to EventBridge');
    }
};
exports.EventBridgePublisherService = EventBridgePublisherService;
exports.EventBridgePublisherService = EventBridgePublisherService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(1, (0, nestjs_pino_1.InjectPinoLogger)(EventBridgePublisherService.name)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof nestjs_pino_1.PinoLogger !== "undefined" && nestjs_pino_1.PinoLogger) === "function" ? _b : Object])
], EventBridgePublisherService);


/***/ }),
/* 30 */
/***/ ((module) => {

module.exports = require("@aws-sdk/client-eventbridge");

/***/ }),
/* 31 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkerDatabaseModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const prisma_service_1 = __webpack_require__(9);
/**
 * `PrismaService` for apps/worker (Worker milestone) - mirrors
 * `apps/api/src/platform/database/database.module.ts` exactly, minus the
 * `DatabaseHealthIndicator`, which is Terminus/HTTP-specific
 * (`@nestjs/terminus`'s `HealthIndicator` is designed to back an HTTP
 * `/health` endpoint) and apps/worker has no HTTP surface - it runs via
 * `NestFactory.createApplicationContext()`, not `NestFactory.create()`
 * (see `apps/worker/src/main.ts`). Database-reachability failures here
 * surface the same way every other worker startup failure does: the
 * process refuses to boot and logs why (`PrismaService.onModuleInit`).
 */
let WorkerDatabaseModule = class WorkerDatabaseModule {
};
exports.WorkerDatabaseModule = WorkerDatabaseModule;
exports.WorkerDatabaseModule = WorkerDatabaseModule = tslib_1.__decorate([
    (0, common_1.Module)({
        providers: [prisma_service_1.PrismaService],
        exports: [prisma_service_1.PrismaService],
    })
], WorkerDatabaseModule);


/***/ }),
/* 32 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InsightsConsumerModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const engagement_signal_repository_1 = __webpack_require__(33);
const insights_consumer_1 = __webpack_require__(34);
const events_module_1 = __webpack_require__(28);
let InsightsConsumerModule = class InsightsConsumerModule {
};
exports.InsightsConsumerModule = InsightsConsumerModule;
exports.InsightsConsumerModule = InsightsConsumerModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [events_module_1.EventsModule],
        providers: [engagement_signal_repository_1.WorkerEngagementSignalRepository, insights_consumer_1.InsightsConsumer],
        exports: [insights_consumer_1.InsightsConsumer],
    })
], InsightsConsumerModule);


/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkerEngagementSignalRepository = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const prisma_service_1 = __webpack_require__(9);
/**
 * apps/worker's own copy of `insights.engagement_signals` persistence -
 * deliberately **not** an import of
 * `apps/api/src/modules/insights/repositories/engagement-signal.repository.ts`,
 * even though the write shape is identical. Both apps generate their own
 * `PrismaClient` from the same `db/schema.prisma` and connect to the same
 * physical database (Blueprint ADR-003), but Nx's `enforce-module-
 * boundaries` lint rule (already active workspace-wide) forbids one app
 * importing another app's code directly - only `libs/*` are meant to be
 * shared. This mirrors the same "own repository, shared `libs/domain`/
 * `libs/contracts` only" split `WORKER_DESIGN_NOTES.md` documents for
 * every worker-side data access this milestone adds.
 */
let WorkerEngagementSignalRepository = class WorkerEngagementSignalRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.engagementSignal.create({ data: input });
    }
};
exports.WorkerEngagementSignalRepository = WorkerEngagementSignalRepository;
exports.WorkerEngagementSignalRepository = WorkerEngagementSignalRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], WorkerEngagementSignalRepository);


/***/ }),
/* 34 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var InsightsConsumer_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InsightsConsumer = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const config_1 = __webpack_require__(12);
const nestjs_pino_1 = __webpack_require__(3);
const engagement_signal_repository_1 = __webpack_require__(33);
const processed_event_repository_1 = __webpack_require__(13);
const sqs_client_provider_1 = __webpack_require__(14);
const sqs_consumer_base_1 = __webpack_require__(16);
/**
 * The `insights-consumer` SQS consumer (Blueprint §10.2). Every
 * Engagement Signal on the bus is relevant to Insights - Blueprint §4.3
 * rule 3 ("Insights depends only on the Engagement Signal stream") and
 * §12.8's flowchart both describe Insights as the one context that
 * ingests the whole stream, not a filtered subset - so `handle()` writes
 * every envelope it receives to `insights.engagement_signals` with no
 * `eventType` filtering, mirroring exactly what
 * `apps/api`'s `EngagementSignalService.record()` already does for a
 * (currently nonexistent) synchronous caller - see that service's own
 * doc comment: "This service is the landing point that future consumer
 * would call once it exists." This is that consumer.
 */
let InsightsConsumer = class InsightsConsumer extends sqs_consumer_base_1.SqsConsumerBase {
    static { InsightsConsumer_1 = this; }
    engagementSignalRepository;
    static CONSUMER_NAME = 'insights-consumer';
    constructor(sqsClient, configService, processedEventRepository, logger, engagementSignalRepository) {
        super(sqsClient, configService.get('SQS_INSIGHTS_QUEUE_URL', { infer: true }), InsightsConsumer_1.CONSUMER_NAME, processedEventRepository, logger);
        this.engagementSignalRepository = engagementSignalRepository;
    }
    async handle(envelope) {
        await this.engagementSignalRepository.create({
            branchId: envelope.branchId,
            personId: envelope.subjectPersonId,
            groupId: envelope.subjectGroupId,
            signalType: envelope.eventType,
            payload: envelope.payload,
            occurredAt: new Date(envelope.occurredAt),
        });
    }
};
exports.InsightsConsumer = InsightsConsumer;
exports.InsightsConsumer = InsightsConsumer = InsightsConsumer_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(sqs_client_provider_1.SQS_CLIENT)),
    tslib_1.__param(3, (0, nestjs_pino_1.InjectPinoLogger)(InsightsConsumer.name)),
    tslib_1.__metadata("design:paramtypes", [Object, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof processed_event_repository_1.ProcessedEventRepository !== "undefined" && processed_event_repository_1.ProcessedEventRepository) === "function" ? _b : Object, typeof (_c = typeof nestjs_pino_1.PinoLogger !== "undefined" && nestjs_pino_1.PinoLogger) === "function" ? _c : Object, typeof (_d = typeof engagement_signal_repository_1.WorkerEngagementSignalRepository !== "undefined" && engagement_signal_repository_1.WorkerEngagementSignalRepository) === "function" ? _d : Object])
], InsightsConsumer);


/***/ }),
/* 35 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationConsumerModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const notification_consumer_1 = __webpack_require__(36);
const events_module_1 = __webpack_require__(28);
let NotificationConsumerModule = class NotificationConsumerModule {
};
exports.NotificationConsumerModule = NotificationConsumerModule;
exports.NotificationConsumerModule = NotificationConsumerModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [events_module_1.EventsModule],
        providers: [notification_consumer_1.NotificationConsumer],
        exports: [notification_consumer_1.NotificationConsumer],
    })
], NotificationConsumerModule);


/***/ }),
/* 36 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var NotificationConsumer_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationConsumer = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const config_1 = __webpack_require__(12);
const nestjs_pino_1 = __webpack_require__(3);
const processed_event_repository_1 = __webpack_require__(13);
const sqs_client_provider_1 = __webpack_require__(14);
const sqs_consumer_base_1 = __webpack_require__(16);
/**
 * The `notification-consumer` SQS consumer (Blueprint §10.2). **This is
 * deliberately an idempotency-check-and-log stub, not a real send
 * mechanism** - see `WORKER_DESIGN_NOTES.md`'s "What this milestone
 * deliberately does not build" section (originally written for the first
 * vertical slice, restated here since it now applies to this consumer
 * directly): the PRD never commits to a notification delivery channel
 * anywhere. Every "alert"/"notification" requirement (FR-INS-03/05,
 * FR-STW-08/OQ-07, Pastoral Care §16.2, Ministry §16.3) uses only generic
 * language like "a visible alert"; the only named channel (WhatsApp) is an
 * explicitly parked Horizon 3+ idea contingent on "a defined integration
 * and consent model" that doesn't exist anywhere in this codebase.
 *
 * `handle()` therefore does the one thing that *is* well-defined
 * regardless of eventual channel - consume the message, let
 * `SqsConsumerBase` perform the idempotency check (so a channel added
 * later inherits "already notified, don't resend" for free), and log a
 * structured record of what *would* have been sent. This is not a
 * placeholder to silently forget - it's the honest shape of "notification
 * delivery is a genuinely undecided open question," not an oversight to
 * quietly work around with an invented channel.
 */
let NotificationConsumer = class NotificationConsumer extends sqs_consumer_base_1.SqsConsumerBase {
    static { NotificationConsumer_1 = this; }
    notificationLogger;
    static CONSUMER_NAME = 'notification-consumer';
    constructor(sqsClient, configService, processedEventRepository, notificationLogger) {
        super(sqsClient, configService.get('SQS_NOTIFICATION_QUEUE_URL', { infer: true }), NotificationConsumer_1.CONSUMER_NAME, processedEventRepository, notificationLogger);
        this.notificationLogger = notificationLogger;
    }
    async handle(envelope) {
        this.notificationLogger.info({
            eventId: envelope.eventId,
            eventType: envelope.eventType,
            branchId: envelope.branchId,
            subjectPersonId: envelope.subjectPersonId,
            subjectGroupId: envelope.subjectGroupId,
        }, 'Notification-worthy Engagement Signal received - no delivery channel is configured yet (see WORKER_DESIGN_NOTES.md); logged, not sent');
        return Promise.resolve();
    }
};
exports.NotificationConsumer = NotificationConsumer;
exports.NotificationConsumer = NotificationConsumer = NotificationConsumer_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(sqs_client_provider_1.SQS_CLIENT)),
    tslib_1.__param(3, (0, nestjs_pino_1.InjectPinoLogger)(NotificationConsumer.name)),
    tslib_1.__metadata("design:paramtypes", [Object, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof processed_event_repository_1.ProcessedEventRepository !== "undefined" && processed_event_repository_1.ProcessedEventRepository) === "function" ? _b : Object, typeof (_c = typeof nestjs_pino_1.PinoLogger !== "undefined" && nestjs_pino_1.PinoLogger) === "function" ? _c : Object])
], NotificationConsumer);


/***/ }),
/* 37 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AttendanceCompletenessSweepModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const attendance_completeness_sweep_job_1 = __webpack_require__(38);
const attendance_completeness_sweep_repository_1 = __webpack_require__(43);
const events_module_1 = __webpack_require__(28);
let AttendanceCompletenessSweepModule = class AttendanceCompletenessSweepModule {
};
exports.AttendanceCompletenessSweepModule = AttendanceCompletenessSweepModule;
exports.AttendanceCompletenessSweepModule = AttendanceCompletenessSweepModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [events_module_1.EventsModule],
        providers: [attendance_completeness_sweep_repository_1.AttendanceCompletenessSweepRepository, attendance_completeness_sweep_job_1.AttendanceCompletenessSweepJob],
        exports: [attendance_completeness_sweep_job_1.AttendanceCompletenessSweepJob],
    })
], AttendanceCompletenessSweepModule);


/***/ }),
/* 38 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var AttendanceCompletenessSweepJob_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AttendanceCompletenessSweepJob = exports.DEFAULT_COMPLETENESS_SWEEP_LOOKBACK_DAYS = void 0;
const tslib_1 = __webpack_require__(5);
const node_crypto_1 = __webpack_require__(39);
const common_1 = __webpack_require__(6);
const domain_gatherings_1 = __webpack_require__(40);
const nestjs_pino_1 = __webpack_require__(3);
const attendance_completeness_sweep_repository_1 = __webpack_require__(43);
const eventbridge_publisher_service_1 = __webpack_require__(29);
/** How far back the sweep looks for Gatherings to re-examine (see
 * `AttendanceCompletenessSweepRepository.listRecentlyEndedGatherings`'s
 * own doc comment). **[INFERRED]**, not a citation - generous relative to
 * `evaluateAttendanceCompleteness()`'s own 48-hour default window, chosen
 * so the sweep still catches a Gathering whose completeness window closed
 * a while ago but was never resolved, without scanning unbounded history. */
exports.DEFAULT_COMPLETENESS_SWEEP_LOOKBACK_DAYS = 14;
/**
 * The attendance-completeness sweep (Blueprint §10.8; FR-GTH-05/§16.4:
 * "flag Gatherings with no attendance recorded past the configured
 * window... a reminder surfaced to the relevant leader"). This is the
 * Branch-wide sweep `GATHERINGS_DESIGN_NOTES.md`'s own "what this
 * milestone deliberately does not build" section named by description
 * ("no scheduled sweep job, no aggregate 'all incomplete Gatherings this
 * week' query, and no notification delivery mechanism") -
 * `AttendanceRecordService.checkCompleteness()` (`apps/api/src/modules/
 * gatherings`) already evaluates one named Gathering on request; this job
 * runs that same pure function (`evaluateAttendanceCompleteness()`,
 * `libs/domain/gatherings`) across every recently-ended Gathering in
 * every Branch, unprompted.
 *
 * Same "detect and signal, don't invent a notification mechanism" pattern
 * as `FollowUpSlaSweepJob`: publishes a synthetic
 * `gatherings.attendance_incomplete` Engagement Signal per incomplete
 * Gathering found (Blueprint §10.8), rather than mutating `Gathering`
 * itself (no "flagged incomplete" field exists on that model, and adding
 * one is outside this milestone's scope) or inventing the "reminder
 * surfaced to the relevant leader" delivery FR-GTH-05 describes -
 * `notification-consumer`'s own doc comment already discloses why no real
 * delivery channel exists yet anywhere in this codebase. Re-publishes
 * every run for as long as a Gathering remains within the lookback window
 * and still has no attendance recorded - the same disclosed "keep
 * reminding, no persisted dedup marker" reasoning
 * `FollowUpSlaSweepJob`'s own doc comment gives, for the identical
 * "no schema field to record 'already signaled'" reason.
 */
let AttendanceCompletenessSweepJob = class AttendanceCompletenessSweepJob {
    static { AttendanceCompletenessSweepJob_1 = this; }
    repository;
    publisher;
    logger;
    static SIGNAL_TYPE = 'gatherings.attendance_incomplete';
    static SCHEMA_VERSION = 1;
    constructor(repository, publisher, logger) {
        this.repository = repository;
        this.publisher = publisher;
        this.logger = logger;
    }
    /** Returns the number of incomplete Gatherings signaled. */
    async run() {
        const branches = await this.repository.listBranches();
        let incompleteCount = 0;
        for (const branch of branches) {
            incompleteCount += await this.sweepBranch(branch.id);
        }
        return incompleteCount;
    }
    async sweepBranch(branchId) {
        const now = new Date();
        const gatherings = await this.repository.listRecentlyEndedGatherings(branchId, now, exports.DEFAULT_COMPLETENESS_SWEEP_LOOKBACK_DAYS);
        let incompleteCount = 0;
        for (const gathering of gatherings) {
            const hasAttendanceRecorded = await this.repository.hasAttendanceRecorded(gathering.id);
            const outcome = (0, domain_gatherings_1.evaluateAttendanceCompleteness)({ scheduledEnd: gathering.scheduledEnd, hasAttendanceRecorded, now });
            if (!outcome.incomplete) {
                continue;
            }
            await this.publisher.publish({
                eventId: (0, node_crypto_1.randomUUID)(),
                eventType: AttendanceCompletenessSweepJob_1.SIGNAL_TYPE,
                schemaVersion: AttendanceCompletenessSweepJob_1.SCHEMA_VERSION,
                branchId,
                occurredAt: now.toISOString(),
                subjectGroupId: gathering.ownerGroupId ?? undefined,
                payload: {
                    gatheringId: gathering.id,
                    // `scheduledEnd` is guaranteed non-null here - the repository
                    // query only ever returns rows where `scheduledEnd IS NOT NULL`.
                    scheduledEnd: gathering.scheduledEnd?.toISOString(),
                },
            });
            this.logger.info({ gatheringId: gathering.id }, 'Attendance-completeness gap signaled');
            incompleteCount += 1;
        }
        return incompleteCount;
    }
};
exports.AttendanceCompletenessSweepJob = AttendanceCompletenessSweepJob;
exports.AttendanceCompletenessSweepJob = AttendanceCompletenessSweepJob = AttendanceCompletenessSweepJob_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(2, (0, nestjs_pino_1.InjectPinoLogger)(AttendanceCompletenessSweepJob.name)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof attendance_completeness_sweep_repository_1.AttendanceCompletenessSweepRepository !== "undefined" && attendance_completeness_sweep_repository_1.AttendanceCompletenessSweepRepository) === "function" ? _a : Object, typeof (_b = typeof eventbridge_publisher_service_1.EventBridgePublisherService !== "undefined" && eventbridge_publisher_service_1.EventBridgePublisherService) === "function" ? _b : Object, typeof (_c = typeof nestjs_pino_1.PinoLogger !== "undefined" && nestjs_pino_1.PinoLogger) === "function" ? _c : Object])
], AttendanceCompletenessSweepJob);


/***/ }),
/* 39 */
/***/ ((module) => {

module.exports = require("node:crypto");

/***/ }),
/* 40 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(5);
tslib_1.__exportStar(__webpack_require__(41), exports);
tslib_1.__exportStar(__webpack_require__(42), exports);


/***/ }),
/* 41 */
/***/ ((__unused_webpack_module, exports) => {


/**
 * FR-GTH-05: "flag Gatherings with no attendance recorded past the
 * configured window." US-D3's acceptance criterion pins the shipped
 * default: "a Bacenta Meeting has no attendance recorded 48 hours past
 * its scheduled end." The window itself is Branch-configurable per
 * NFR-MAINT-01 (same "configuration, not hard-coded" discipline as every
 * other threshold in this codebase - silent-drift's N/M, Follow-up
 * task's SLA days).
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEFAULT_ATTENDANCE_COMPLETENESS_WINDOW_HOURS = void 0;
exports.evaluateAttendanceCompleteness = evaluateAttendanceCompleteness;
exports.DEFAULT_ATTENDANCE_COMPLETENESS_WINDOW_HOURS = 48;
function evaluateAttendanceCompleteness(input) {
    if (input.hasAttendanceRecorded) {
        return { incomplete: false, reason: 'Attendance has already been recorded for this Gathering' };
    }
    if (!input.scheduledEnd) {
        return {
            incomplete: false,
            reason: 'FR-GTH-05: this Gathering has no scheduledEnd to measure the completeness window against',
        };
    }
    const windowHours = input.windowHours ?? exports.DEFAULT_ATTENDANCE_COMPLETENESS_WINDOW_HOURS;
    const windowMs = windowHours * 60 * 60 * 1000;
    const deadline = new Date(input.scheduledEnd.getTime() + windowMs);
    const incomplete = input.now.getTime() > deadline.getTime();
    return {
        incomplete,
        reason: incomplete
            ? `FR-GTH-05: no attendance recorded ${windowHours}h past this Gathering's scheduled end`
            : `FR-GTH-05: still within the ${windowHours}h completeness window`,
    };
}


/***/ }),
/* 42 */
/***/ ((__unused_webpack_module, exports) => {


/**
 * `db/schema.prisma`'s `GatheringStatus` (`SCHEDULED`/`CANCELLED`/
 * `COMPLETED`) is itself `[PRD-DERIVED]`, not `[BLUEPRINT-EXACT]` -
 * PRD §12.4 names a `status` field without enumerating its values
 * (`db/DESIGN_NOTES.md` Open Question #6, already resolved with this
 * minimal 3-value set). No PRD text describes a transition diagram for
 * it either, so [INFERRED] this module treats it as forward-only from
 * `SCHEDULED` to one terminal state - the only reading consistent with
 * "cancelled" and "completed" both being outcomes of a scheduled
 * Gathering, and with §12.4's edge case (a recurring instance "can be
 * individually cancelled or reassigned") describing a one-way action, not
 * a reversible toggle.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GATHERING_STATUSES = void 0;
exports.isGatheringStatus = isGatheringStatus;
exports.checkGatheringStatusTransition = checkGatheringStatusTransition;
exports.isConfiguredGatheringType = isConfiguredGatheringType;
exports.GATHERING_STATUSES = ['SCHEDULED', 'CANCELLED', 'COMPLETED'];
function isGatheringStatus(value) {
    return exports.GATHERING_STATUSES.includes(value);
}
const TRANSITIONS = {
    SCHEDULED: ['CANCELLED', 'COMPLETED'],
    CANCELLED: [],
    COMPLETED: [],
};
function checkGatheringStatusTransition(from, to) {
    if (from === to) {
        return { allowed: false, reason: `'${from}' is already the current status; not a transition` };
    }
    const allowedNext = TRANSITIONS[from];
    if (!allowedNext.includes(to)) {
        return {
            allowed: false,
            reason: `[INFERRED forward-only model]: '${from}' -> '${to}' is not a modeled transition (allowed: ${allowedNext.length > 0 ? allowedNext.join(', ') : 'none - terminal status'})`,
        };
    }
    return { allowed: true, reason: `'${from}' -> '${to}' is a modeled Gathering status transition` };
}
/**
 * §12.4's Implementation note: "a `Gathering` table with a `type`
 * discriminator column... not as ten separate tables." Gathering types
 * are Branch-configurable (`Configuration.gatheringTypes`, a `String[]`,
 * not a fixed enum - FR-GTH-01/US-D4: "configure a new Gathering type...
 * without engineering support"), so validity is checked against a
 * Branch's own configured list, not a hard-coded union.
 */
function isConfiguredGatheringType(type, configuredTypes) {
    return configuredTypes.includes(type);
}


/***/ }),
/* 43 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AttendanceCompletenessSweepRepository = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const prisma_service_1 = __webpack_require__(9);
/**
 * apps/worker's own Prisma-backed queries for the attendance-completeness
 * sweep - see `AttendanceCompletenessSweepJob`'s own doc comment, and
 * `WORKER_DESIGN_NOTES.md` for the "own repository, not a cross-app
 * import" rationale shared with every other worker-side repository.
 */
let AttendanceCompletenessSweepRepository = class AttendanceCompletenessSweepRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listBranches() {
        return this.prisma.branch.findMany({ select: { id: true } });
    }
    /**
     * Every non-cancelled Gathering in a Branch whose `scheduledEnd` has
     * already passed, bounded to the trailing `lookbackDays` window -
     * `evaluateAttendanceCompleteness()`'s own default completeness window
     * is only 48 hours, so a Gathering whose `scheduledEnd` is, say, six
     * months old has long since had its completeness question settled by
     * whatever manual process resolved it; re-examining the Branch's entire
     * Gathering history every sweep run would grow unboundedly and answer a
     * question nobody is asking. `lookbackDays` bounds that, generously,
     * without needing a persisted "already resolved" marker on `Gathering`
     * itself (no such field exists in `db/schema.prisma`, and adding one is
     * outside this milestone's scope). `CANCELLED` Gatherings are excluded -
     * a cancelled Gathering was never going to have attendance recorded and
     * is not a real completeness gap. **[INFERRED]**, not a citation - see
     * `AttendanceCompletenessSweepJob`'s own doc comment.
     */
    listRecentlyEndedGatherings(branchId, now, lookbackDays) {
        const lookbackStart = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
        return this.prisma.gathering.findMany({
            where: {
                branchId,
                status: { not: 'CANCELLED' },
                scheduledEnd: { not: null, lte: now, gte: lookbackStart },
            },
        });
    }
    async hasAttendanceRecorded(gatheringId) {
        const count = await this.prisma.attendanceRecord.count({ where: { gatheringId } });
        return count > 0;
    }
};
exports.AttendanceCompletenessSweepRepository = AttendanceCompletenessSweepRepository;
exports.AttendanceCompletenessSweepRepository = AttendanceCompletenessSweepRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], AttendanceCompletenessSweepRepository);


/***/ }),
/* 44 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChurchPulseRecomputeModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const church_pulse_recompute_job_1 = __webpack_require__(45);
const church_pulse_recompute_repository_1 = __webpack_require__(49);
const database_module_1 = __webpack_require__(31);
/** No `EventsModule` import - unlike `SilentDriftSweepModule`, this job
 * publishes no Engagement Signal (see `ChurchPulseRecomputeJob`'s own doc
 * comment), so it needs only `WorkerDatabaseModule`'s `PrismaService`. */
let ChurchPulseRecomputeModule = class ChurchPulseRecomputeModule {
};
exports.ChurchPulseRecomputeModule = ChurchPulseRecomputeModule;
exports.ChurchPulseRecomputeModule = ChurchPulseRecomputeModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [database_module_1.WorkerDatabaseModule],
        providers: [church_pulse_recompute_repository_1.ChurchPulseRecomputeRepository, church_pulse_recompute_job_1.ChurchPulseRecomputeJob],
        exports: [church_pulse_recompute_job_1.ChurchPulseRecomputeJob],
    })
], ChurchPulseRecomputeModule);


/***/ }),
/* 45 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChurchPulseRecomputeJob = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const domain_insights_1 = __webpack_require__(46);
const nestjs_pino_1 = __webpack_require__(3);
const church_pulse_recompute_repository_1 = __webpack_require__(49);
/** FR-INS-03's one alert type - identical constant to
 * `apps/api/src/modules/insights/services/alert.service.ts`'s own
 * `PULSE_DECLINE_ALERT_TYPE`, duplicated rather than imported for the
 * same Nx app-to-app boundary reason as everything else in this file. */
const PULSE_DECLINE_ALERT_TYPE = 'PULSE_DECLINE';
function toWeightsRecord(raw) {
    if (!raw) {
        return domain_insights_1.DEFAULT_CHURCH_PULSE_WEIGHTS;
    }
    const weights = {};
    for (const type of domain_insights_1.CHURCH_PULSE_SIGNAL_TYPES) {
        if (typeof raw[type] === 'number') {
            weights[type] = raw[type];
        }
    }
    return weights;
}
/**
 * The church-pulse-recompute sweep (Blueprint §10.8's own worked example:
 * "Amazon EventBridge Scheduler triggering the Worker service... nightly
 * for silent-drift" implies a comparable cadence for the other named
 * jobs). `PulseScoreService.computeAndStore` (`apps/api/src/modules/
 * insights`) already implements this exact computation, but only
 * **compute-on-read** - "No scheduler/worker exists in this codebase... to
 * run this on the defined cadence FR-INS-01's acceptance criteria
 * describes," per that service's own doc comment. This job is that
 * missing scheduler: it runs the identical computation for **every**
 * Branch-scope and every active Bacenta-scope, not just whichever scope a
 * dashboard request happens to ask for, so `insights.pulse_scores`/
 * `pulse_score_history` stay fresh even when nobody is actively viewing a
 * dashboard, and FR-INS-03's decline alerts can fire on their own
 * schedule rather than only when a leader happens to open the dashboard
 * that would have recomputed the score anyway.
 *
 * **Deliberately publishes no Engagement Signal.** Unlike
 * `SilentDriftSweepJob`, this job's output (`Alert` rows) is already a
 * directly queryable resource `apps/api`'s existing dashboard endpoints
 * read (FR-INS-04) - there is no live-event counterpart for "Church Pulse
 * changed" that this needs to unify with under Blueprint §10.8's "one
 * downstream reaction mechanism regardless of trigger source" reasoning,
 * the way silent-drift's synthetic signal unifies with a (currently
 * unbuilt) live silent-drift-adjacent event. Publishing one here would be
 * inventing a consumer for it that doesn't exist.
 */
let ChurchPulseRecomputeJob = class ChurchPulseRecomputeJob {
    repository;
    logger;
    constructor(repository, logger) {
        this.repository = repository;
        this.logger = logger;
    }
    /** Returns the number of scopes (Branch + every active Bacenta) recomputed. */
    async run() {
        const branches = await this.repository.listBranches();
        let scopeCount = 0;
        for (const branch of branches) {
            await this.computeAndStore(branch.id, 'BRANCH', branch.id, undefined);
            scopeCount += 1;
            const groups = await this.repository.listActiveBacentaGroups(branch.id);
            for (const group of groups) {
                await this.computeAndStore(branch.id, 'GROUP', group.id, group.id);
                scopeCount += 1;
            }
        }
        return scopeCount;
    }
    async computeAndStore(branchId, scopeType, scopeId, groupIdFilter) {
        const now = new Date();
        const windowStart = new Date(now.getTime() - domain_insights_1.DEFAULT_CHURCH_PULSE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        const counts = await this.repository.countSignalsByTypeInWindow(branchId, groupIdFilter, windowStart, now);
        const signalCountsByType = {};
        for (const row of counts) {
            if ((0, domain_insights_1.isChurchPulseSignalType)(row.signalType)) {
                signalCountsByType[row.signalType] = row.count;
            }
        }
        const rawWeights = await this.repository.findChurchPulseWeights(branchId);
        const weights = toWeightsRecord(rawWeights);
        const score = (0, domain_insights_1.computeChurchPulseScore)(signalCountsByType, weights);
        await this.repository.upsertPulseScore({ branchId, scopeType, scopeId, score, computedAt: now });
        await this.repository.appendPulseScoreHistory({ branchId, scopeType, scopeId, score, computedAt: now });
        await this.evaluateAndCreateAlertIfNeeded(branchId, scopeType, scopeId, now);
    }
    async evaluateAndCreateAlertIfNeeded(branchId, scopeType, scopeId, now) {
        const since = new Date(now.getTime() - domain_insights_1.DEFAULT_PULSE_TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        const history = await this.repository.findRecentHistoryByScope(scopeType, scopeId, since);
        const evaluation = (0, domain_insights_1.evaluatePulseTrend)(history.map((point) => ({ score: point.score.toNumber(), computedAt: point.computedAt })), now);
        if (!evaluation.declined) {
            return;
        }
        const alreadyOpen = await this.repository.hasOpenAlert(scopeType, scopeId, PULSE_DECLINE_ALERT_TYPE);
        if (alreadyOpen) {
            this.logger.info({ scopeType, scopeId }, 'Church Pulse decline confirmed but an open PULSE_DECLINE alert already exists - no-op');
            return;
        }
        await this.repository.createAlert({ branchId, scopeType, scopeId, alertType: PULSE_DECLINE_ALERT_TYPE, message: evaluation.reason });
    }
};
exports.ChurchPulseRecomputeJob = ChurchPulseRecomputeJob;
exports.ChurchPulseRecomputeJob = ChurchPulseRecomputeJob = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(1, (0, nestjs_pino_1.InjectPinoLogger)(ChurchPulseRecomputeJob.name)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof church_pulse_recompute_repository_1.ChurchPulseRecomputeRepository !== "undefined" && church_pulse_recompute_repository_1.ChurchPulseRecomputeRepository) === "function" ? _a : Object, typeof (_b = typeof nestjs_pino_1.PinoLogger !== "undefined" && nestjs_pino_1.PinoLogger) === "function" ? _b : Object])
], ChurchPulseRecomputeJob);


/***/ }),
/* 46 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(5);
tslib_1.__exportStar(__webpack_require__(47), exports);
tslib_1.__exportStar(__webpack_require__(48), exports);


/***/ }),
/* 47 */
/***/ ((__unused_webpack_module, exports) => {


/**
 * PRD §12.8's Church Pulse weighted-scoring model: a stream of typed
 * Engagement Signals, reduced to a per-category sub-score, then combined
 * via configurable weights into one composite 0-100 score.
 *
 * **The six signal categories are `[PRD-DERIVED]`, not `[BLUEPRINT-EXACT]`.**
 * §12.8's own flowchart names six *signal source* boxes (Attendance
 * Records, Group Membership changes, Financial Transactions, Follow-up
 * task outcomes, Role Assignments, Visitor-to-Member conversions); §8.1
 * separately names six *scoring* categories (attendance consistency,
 * Bacenta participation, serving activity, follow-up responsiveness,
 * leadership engagement, visitor retention) that do not map 1:1 onto the
 * flowchart's six boxes (e.g. "leadership engagement" and "serving
 * activity" both plausibly derive from the same Role Assignment signal
 * source; "Financial Transactions" is a signal source with no
 * identically-named §8.1 scoring category). This module treats the
 * flowchart's six *signal source* types as the computational unit - one
 * weight per source type - since that is what the `EngagementSignal`
 * entity itself is typed by (`signalType`), and flags this narrative
 * inconsistency rather than silently resolving it with an invented
 * mapping table.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PROVISIONAL_SIGNALS_FOR_FULL_CATEGORY_SCORE = exports.DEFAULT_CHURCH_PULSE_WEIGHTS = exports.DEFAULT_CHURCH_PULSE_WINDOW_DAYS = exports.CHURCH_PULSE_SIGNAL_TYPES = void 0;
exports.isChurchPulseSignalType = isChurchPulseSignalType;
exports.computeCategoryScore = computeCategoryScore;
exports.computeChurchPulseScore = computeChurchPulseScore;
exports.CHURCH_PULSE_SIGNAL_TYPES = [
    'ATTENDANCE',
    'GROUP_MEMBERSHIP',
    'FINANCIAL_GIVING',
    'FOLLOW_UP_OUTCOME',
    'ROLE_ASSIGNMENT',
    'VISITOR_CONVERSION',
];
function isChurchPulseSignalType(value) {
    return exports.CHURCH_PULSE_SIGNAL_TYPES.includes(value);
}
/** PRD §8.1: "Church Pulse Score (congregation-level, trailing 4-week
 * average)" - the one concrete window PRD text gives anywhere for this
 * computation. `[PRD-DERIVED]`, not invented. */
exports.DEFAULT_CHURCH_PULSE_WINDOW_DAYS = 28;
/**
 * **Resolved OQ-10 (§24), provisional value:** "Release 1 ships with
 * equal weighting across all six signal categories as an explicitly
 * labeled provisional placeholder." This is that placeholder, exactly as
 * the PRD itself describes it - not this module's own invention.
 */
exports.DEFAULT_CHURCH_PULSE_WEIGHTS = {
    ATTENDANCE: 1 / 6,
    GROUP_MEMBERSHIP: 1 / 6,
    FINANCIAL_GIVING: 1 / 6,
    FOLLOW_UP_OUTCOME: 1 / 6,
    ROLE_ASSIGNMENT: 1 / 6,
    VISITOR_CONVERSION: 1 / 6,
};
/**
 * **`[INFERRED - PROVISIONAL]`, not a citation.** Neither the PRD nor the
 * Blueprint specify how a raw signal *count* within the trailing window
 * becomes a 0-100 sub-score for a category - §12.8 explicitly defers "the
 * exact weighting formula, decay function... and alert thresholds" to
 * this functional domain chapter, but PRD §13.6's FR-INS rows never
 * actually supply that formula either. This is a genuine specification
 * gap, not an oversight this module resolves quietly - `10 signals in the
 * trailing window == a full 100 for that category, linear below that` is
 * an explicitly-labeled placeholder in exactly the same spirit as OQ-10's
 * own "provisional... pending calibration" framing for the weights
 * themselves, not a considered product decision. See
 * `apps/api/src/modules/insights/INSIGHTS_DESIGN_NOTES.md`.
 */
exports.PROVISIONAL_SIGNALS_FOR_FULL_CATEGORY_SCORE = 10;
function computeCategoryScore(signalCount) {
    if (signalCount <= 0) {
        return 0;
    }
    return Math.min(100, (signalCount / exports.PROVISIONAL_SIGNALS_FOR_FULL_CATEGORY_SCORE) * 100);
}
/**
 * BR-INS-01: "must not be reducible to attendance alone." Combines each
 * category's sub-score via the supplied weights (defensively normalized
 * to sum to 1, so a caller supplying a partial or unnormalized weight set
 * - e.g. from `platform.configurations.church_pulse_weights` before an
 * Admin has ever touched it - still produces a valid 0-100 result rather
 * than a silently-wrong one). A category absent from `signalCountsByType`
 * is treated as a count of 0, not excluded from the weighted average -
 * missing data pulls the score down, it does not shrink the denominator
 * (the same "flag incompleteness, don't ignore it" principle
 * `evaluateAttendanceCompleteness` already applies to Gatherings).
 */
function computeChurchPulseScore(signalCountsByType, weights = exports.DEFAULT_CHURCH_PULSE_WEIGHTS) {
    const totalWeight = exports.CHURCH_PULSE_SIGNAL_TYPES.reduce((sum, type) => sum + (weights[type] ?? 0), 0);
    if (totalWeight <= 0) {
        return 0;
    }
    const weightedSum = exports.CHURCH_PULSE_SIGNAL_TYPES.reduce((sum, type) => {
        const weight = weights[type] ?? 0;
        const categoryScore = computeCategoryScore(signalCountsByType[type] ?? 0);
        return sum + weight * categoryScore;
    }, 0);
    return Math.round((weightedSum / totalWeight) * 100) / 100;
}


/***/ }),
/* 48 */
/***/ ((__unused_webpack_module, exports) => {


/**
 * FR-INS-03: "generate a proactive alert when a Bacenta's or Branch's
 * Church Pulse trend declines beyond a configurable threshold over a
 * configurable trailing window."
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEFAULT_PULSE_DECLINE_THRESHOLD_POINTS = exports.DEFAULT_PULSE_TREND_WINDOW_DAYS = void 0;
exports.evaluatePulseTrend = evaluatePulseTrend;
/** §11.2's Pastor Emmanuel scenario: "Bacenta 12's Church Pulse has
 * dropped 15 points over 3 weeks" - the one concrete window PRD narrative
 * gives anywhere for a trend alert. `[PRD-DERIVED]`, not invented. */
exports.DEFAULT_PULSE_TREND_WINDOW_DAYS = 21;
/**
 * `[INFERRED - PROVISIONAL]`, not a citation. FR-INS-03 requires the
 * threshold to be "configurable" but never states a default numeric
 * value anywhere in the PRD - unlike the trailing window (§11.2's
 * scenario gives a concrete 3-week example) or the signal-scoring window
 * (§8.1's "trailing 4-week average"), no comparable worked example pins a
 * threshold number. 10 points is a reasonable, disclosed placeholder
 * (smaller than §11.2's own 15-point illustrative drop, so that scenario
 * would in fact trigger under this default) - not a considered product
 * decision. See `apps/api/src/modules/insights/INSIGHTS_DESIGN_NOTES.md`.
 */
exports.DEFAULT_PULSE_DECLINE_THRESHOLD_POINTS = 10;
/**
 * Compares the earliest score within the trailing window against the
 * latest score overall. `history` need not be sorted - this function
 * sorts defensively rather than trusting caller order, since a
 * comparison in the wrong direction would silently invert "declined" into
 * "improved."
 */
function evaluatePulseTrend(history, now, windowDays = exports.DEFAULT_PULSE_TREND_WINDOW_DAYS, thresholdPoints = exports.DEFAULT_PULSE_DECLINE_THRESHOLD_POINTS) {
    const sorted = [...history].sort((a, b) => a.computedAt.getTime() - b.computedAt.getTime());
    if (sorted.length < 2) {
        return { declined: false, deltaPoints: 0, reason: 'Not enough score history to evaluate a trend' };
    }
    const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const withinWindow = sorted.filter((point) => point.computedAt.getTime() >= windowStart.getTime());
    const earliest = withinWindow.length > 0 ? withinWindow[0] : sorted[0];
    const latest = sorted[sorted.length - 1];
    const deltaPoints = latest.score - earliest.score;
    const declined = deltaPoints <= -thresholdPoints;
    return {
        declined,
        deltaPoints,
        reason: declined
            ? `FR-INS-03: Church Pulse declined ${Math.abs(deltaPoints).toFixed(2)} points over the trailing ${windowDays}-day window (threshold: ${thresholdPoints})`
            : `FR-INS-03: Church Pulse change of ${deltaPoints.toFixed(2)} points is within the trailing ${windowDays}-day window's ${thresholdPoints}-point threshold`,
    };
}


/***/ }),
/* 49 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChurchPulseRecomputeRepository = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const prisma_service_1 = __webpack_require__(9);
/**
 * apps/worker's own Prisma-backed queries for the church-pulse-recompute
 * sweep - a worker-local mirror of `apps/api/src/modules/insights`'s
 * `EngagementSignalRepository.countByTypeInWindow`, `PulseScoreRepository`,
 * `PulseScoreHistoryRepository`, and `AlertRepository`'s
 * `create`/`hasOpenAlert` methods, consolidated into one repository file
 * the same way `SilentDriftSweepRepository` consolidates several small
 * queries for its own job - not an import of any of those apps/api
 * classes, for the same Nx app-to-app boundary reason documented
 * throughout `WORKER_DESIGN_NOTES.md`.
 */
let ChurchPulseRecomputeRepository = class ChurchPulseRecomputeRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listBranches() {
        return this.prisma.branch.findMany({ select: { id: true } });
    }
    /** Every currently-`ACTIVE` Bacenta (`GroupType.PASTORAL_CARE`) in a
     * Branch - `PulseScoreService.computeAndStoreGroupScore`'s own
     * per-request equivalent, run here for every Bacenta on a schedule
     * instead of only the one a dashboard read happens to ask for. */
    listActiveBacentaGroups(branchId) {
        return this.prisma.group.findMany({
            where: { branchId, type: 'PASTORAL_CARE', lifecycleStatus: 'ACTIVE' },
            select: { id: true },
        });
    }
    /** Mirrors `EngagementSignalRepository.countByTypeInWindow` exactly -
     * `groupId` omitted computes the Branch-wide count, supplied computes
     * one Group's. */
    async countSignalsByTypeInWindow(branchId, groupId, windowStart, now) {
        const grouped = await this.prisma.engagementSignal.groupBy({
            by: ['signalType'],
            where: {
                branchId,
                ...(groupId ? { groupId } : {}),
                occurredAt: { gte: windowStart, lte: now },
            },
            _count: { _all: true },
        });
        return grouped.map((row) => ({ signalType: row.signalType, count: row._count._all }));
    }
    /** Mirrors `PulseScoreRepository.findChurchPulseWeights` exactly. */
    async findChurchPulseWeights(branchId) {
        const configuration = await this.prisma.configuration.findUnique({
            where: { branchId },
            select: { churchPulseWeights: true },
        });
        if (!configuration || configuration.churchPulseWeights === null || typeof configuration.churchPulseWeights !== 'object') {
            return null;
        }
        return configuration.churchPulseWeights;
    }
    upsertPulseScore(input) {
        return this.prisma.pulseScore.upsert({
            where: { scopeType_scopeId: { scopeType: input.scopeType, scopeId: input.scopeId } },
            create: input,
            update: { score: input.score, computedAt: input.computedAt },
        });
    }
    appendPulseScoreHistory(input) {
        return this.prisma.pulseScoreHistory.create({ data: input });
    }
    findRecentHistoryByScope(scopeType, scopeId, since) {
        return this.prisma.pulseScoreHistory.findMany({
            where: { scopeType, scopeId, computedAt: { gte: since } },
            orderBy: { computedAt: 'asc' },
        });
    }
    async hasOpenAlert(scopeType, scopeId, alertType) {
        const existing = await this.prisma.alert.findFirst({ where: { scopeType, scopeId, alertType, status: 'OPEN' } });
        return existing !== null;
    }
    createAlert(input) {
        return this.prisma.alert.create({ data: input });
    }
};
exports.ChurchPulseRecomputeRepository = ChurchPulseRecomputeRepository;
exports.ChurchPulseRecomputeRepository = ChurchPulseRecomputeRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ChurchPulseRecomputeRepository);


/***/ }),
/* 50 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FollowUpSlaSweepModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const follow_up_sla_sweep_job_1 = __webpack_require__(51);
const follow_up_sla_sweep_repository_1 = __webpack_require__(56);
const events_module_1 = __webpack_require__(28);
let FollowUpSlaSweepModule = class FollowUpSlaSweepModule {
};
exports.FollowUpSlaSweepModule = FollowUpSlaSweepModule;
exports.FollowUpSlaSweepModule = FollowUpSlaSweepModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [events_module_1.EventsModule],
        providers: [follow_up_sla_sweep_repository_1.FollowUpSlaSweepRepository, follow_up_sla_sweep_job_1.FollowUpSlaSweepJob],
        exports: [follow_up_sla_sweep_job_1.FollowUpSlaSweepJob],
    })
], FollowUpSlaSweepModule);


/***/ }),
/* 51 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var FollowUpSlaSweepJob_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FollowUpSlaSweepJob = void 0;
const tslib_1 = __webpack_require__(5);
const node_crypto_1 = __webpack_require__(39);
const common_1 = __webpack_require__(6);
const domain_pastoral_care_1 = __webpack_require__(52);
const nestjs_pino_1 = __webpack_require__(3);
const follow_up_sla_sweep_repository_1 = __webpack_require__(56);
const eventbridge_publisher_service_1 = __webpack_require__(29);
/**
 * The follow-up-sla-sweep (Blueprint §10.8: "...hourly for SLA checks").
 * Evaluates every `OPEN` Follow-up task with a `dueAt` set against
 * `isFollowUpTaskPastSla()` (`libs/domain/pastoral-care`, BR-PC-04) and
 * publishes a synthetic `pastoral_care.follow_up_task_sla_breached`
 * Engagement Signal for each one found past its SLA window - the same
 * §10.8 "sweep detects a condition, emits a synthetic signal onto the
 * same bus" pattern `SilentDriftSweepJob` already established.
 *
 * **Deliberately never mutates `FollowUpTask` itself - detects and
 * signals only, never auto-escalates.** BR-PC-04's escalation
 * ("escalates to the assigned Person's organizational superior") requires
 * resolving *who* that superior is - `FollowUpTaskService`'s own doc
 * comment (`apps/api/src/modules/pastoral-care`) already establishes that
 * no such resolution exists anywhere in this codebase (no rotation-state
 * field, no reporting-line pointer), and `FollowUpTaskService.escalate()`
 * requires an explicit, human-supplied `escalatedToPersonId`. If this
 * sweep instead flipped `status` to `ESCALATED` itself (with no target),
 * it would permanently block that same human escalation afterward -
 * `FollowUpTaskService.escalate()`'s `requireOpenOrEscalated` check throws
 * a `ConflictException` on an already-`ESCALATED` task, so a
 * system-initiated status change here would lock out the real,
 * human-initiated one. Publishing a signal (for a human/dashboard to act
 * on) rather than mutating state avoids that conflict entirely.
 *
 * **Re-publishes every run for as long as a task remains open and past
 * SLA - an intentional "keep reminding" behavior, not a missing dedup
 * check.** Unlike `SilentDriftSweepJob` (one `SilentDriftFlag` row makes
 * "already flagged" a real, persisted fact to check), there is no
 * schema entity here recording "this breach was already signaled" - and
 * unlike a silent-drift flag (a discrete new condition), an SLA breach is
 * genuinely ongoing every day it isn't resolved, so re-signaling each run
 * is the more defensible default in the absence of one. A future
 * iteration could reduce this signal volume with a `lastSlaBreachSignaledAt`
 * column, but that is a schema change outside this milestone's scope.
 */
let FollowUpSlaSweepJob = class FollowUpSlaSweepJob {
    static { FollowUpSlaSweepJob_1 = this; }
    repository;
    publisher;
    logger;
    static SIGNAL_TYPE = 'pastoral_care.follow_up_task_sla_breached';
    static SCHEMA_VERSION = 1;
    constructor(repository, publisher, logger) {
        this.repository = repository;
        this.publisher = publisher;
        this.logger = logger;
    }
    /** Returns the number of SLA breaches signaled. */
    async run() {
        const branches = await this.repository.listBranches();
        let breachedCount = 0;
        for (const branch of branches) {
            breachedCount += await this.sweepBranch(branch.id);
        }
        return breachedCount;
    }
    async sweepBranch(branchId) {
        const now = new Date();
        const tasks = await this.repository.listOpenTasksWithDueDate(branchId);
        let breachedCount = 0;
        for (const task of tasks) {
            const pastSla = (0, domain_pastoral_care_1.isFollowUpTaskPastSla)({ status: task.status, dueAt: task.dueAt, now });
            if (!pastSla) {
                continue;
            }
            await this.publisher.publish({
                eventId: (0, node_crypto_1.randomUUID)(),
                eventType: FollowUpSlaSweepJob_1.SIGNAL_TYPE,
                schemaVersion: FollowUpSlaSweepJob_1.SCHEMA_VERSION,
                branchId,
                occurredAt: now.toISOString(),
                subjectPersonId: task.personId,
                subjectGroupId: task.groupId ?? undefined,
                payload: {
                    followUpTaskId: task.id,
                    assignedToPersonId: task.assignedToPersonId,
                    // `dueAt` is guaranteed non-null here - `listOpenTasksWithDueDate`
                    // only ever returns rows where `dueAt IS NOT NULL`.
                    dueAt: task.dueAt?.toISOString(),
                },
            });
            this.logger.info({ followUpTaskId: task.id, dueAt: task.dueAt }, 'Follow-up task SLA breach signaled');
            breachedCount += 1;
        }
        return breachedCount;
    }
};
exports.FollowUpSlaSweepJob = FollowUpSlaSweepJob;
exports.FollowUpSlaSweepJob = FollowUpSlaSweepJob = FollowUpSlaSweepJob_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(2, (0, nestjs_pino_1.InjectPinoLogger)(FollowUpSlaSweepJob.name)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof follow_up_sla_sweep_repository_1.FollowUpSlaSweepRepository !== "undefined" && follow_up_sla_sweep_repository_1.FollowUpSlaSweepRepository) === "function" ? _a : Object, typeof (_b = typeof eventbridge_publisher_service_1.EventBridgePublisherService !== "undefined" && eventbridge_publisher_service_1.EventBridgePublisherService) === "function" ? _b : Object, typeof (_c = typeof nestjs_pino_1.PinoLogger !== "undefined" && nestjs_pino_1.PinoLogger) === "function" ? _c : Object])
], FollowUpSlaSweepJob);


/***/ }),
/* 52 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(5);
tslib_1.__exportStar(__webpack_require__(53), exports);
tslib_1.__exportStar(__webpack_require__(54), exports);
tslib_1.__exportStar(__webpack_require__(55), exports);


/***/ }),
/* 53 */
/***/ ((__unused_webpack_module, exports) => {


/**
 * Follow-up task workflow rules: FR-PC-03 (automatic creation), FR-PC-04
 * (assignment + SLA + escalation), BR-PC-03/BR-PC-04.
 *
 * Lifecycle-stage values are accepted as plain strings, not imported from
 * `libs/domain/people`'s `LifecycleStage` type - `libs/domain/pastoral-care`
 * may depend only on `libs/contracts` (this library's own README,
 * Blueprint §6.2/§6.4 module-boundary rule), and Prisma's generated
 * `LifecycleStage` enum is an `apps/api`-layer concern. Same duplication
 * tradeoff `libs/domain/people/lifecycle-stage.ts`'s own doc comment
 * already documents for its own enum.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEFAULT_FOLLOW_UP_SLA_DAYS = void 0;
exports.determineFollowUpTaskTrigger = determineFollowUpTaskTrigger;
exports.computeFollowUpTaskDueAt = computeFollowUpTaskDueAt;
exports.isFollowUpTaskPastSla = isFollowUpTaskPastSla;
/**
 * `toStage`/`fromStage` are whatever `libs/domain/people`'s
 * `LifecycleStage` values the caller already validated a transition
 * against - this function only pattern-matches the two specific
 * transitions FR-PC-03 names, it does not itself validate that the
 * transition is legal (that's `checkLifecycleTransition`'s job, already
 * run by the time a caller reaches this point).
 */
function determineFollowUpTaskTrigger(toStage, fromStage) {
    if (toStage === 'FIRST_TIME_GUEST') {
        return 'FIRST_TIME_GUEST';
    }
    if (fromStage === 'LAPSED' && toStage === 'FOLLOW_UP') {
        return 'LAPSED_REENGAGEMENT';
    }
    return null;
}
/**
 * **Resolved OQ-06 (PRD §24):** "default SLA is 3 days for First-Time
 * Guest follow-up, 14 days for Lapsed re-engagement, both
 * Branch-configurable." These are the shipped defaults - a Branch's own
 * `platform.configurations.followup_sla_defaults` JSON value (shape
 * unpinned in `db/schema.prisma`, per NFR-MAINT-01) overrides them; see
 * `computeFollowUpTaskDueAt`'s `slaDaysOverride` parameter.
 */
exports.DEFAULT_FOLLOW_UP_SLA_DAYS = {
    FIRST_TIME_GUEST: 3,
    LAPSED_REENGAGEMENT: 14,
};
/**
 * FR-PC-04's SLA window, expressed as a concrete due date computed from
 * when the task was created. `slaDaysOverride` is the caller's own
 * Branch-configured value (`Configuration.followupSlaDefaults`) when one
 * exists; falls back to `DEFAULT_FOLLOW_UP_SLA_DAYS` (OQ-06's shipped
 * default) when it does not.
 */
function computeFollowUpTaskDueAt(trigger, createdAt, slaDaysOverride) {
    const slaDays = slaDaysOverride ?? exports.DEFAULT_FOLLOW_UP_SLA_DAYS[trigger];
    const dueAt = new Date(createdAt.getTime());
    dueAt.setUTCDate(dueAt.getUTCDate() + slaDays);
    return dueAt;
}
/**
 * FR-PC-04 / BR-PC-04: "An unactioned Follow-up task past its configured
 * SLA window escalates ... ". `COMPLETED` and already-`ESCALATED` tasks
 * are never (re-)escalated by this check - escalation is a one-time state
 * transition (`OPEN -> ESCALATED`, `db/schema.prisma`'s
 * `FollowUpTaskStatus`), not a recurring alert. A task with no `dueAt`
 * set has nothing to breach and is never escalated by this rule.
 */
function isFollowUpTaskPastSla(input) {
    if (input.status !== 'OPEN' || !input.dueAt) {
        return false;
    }
    return input.now.getTime() > input.dueAt.getTime();
}


/***/ }),
/* 54 */
/***/ ((__unused_webpack_module, exports) => {


/**
 * FR-PC-06: "track Poimen training enrollment and completion status per
 * Person." `db/schema.prisma`'s `PoimenStatus` enum (`NOT_STARTED`,
 * `IN_PROGRESS`, `COMPLETE`) models this as a linear progression - the
 * PRD names no regression path (no requirement or user story describes
 * completed training being revoked or in-progress training being reset),
 * so [INFERRED] this module treats the progression as forward-only,
 * mirroring `libs/domain/people/lifecycle-stage.ts`'s same
 * "not-shown-means-disallowed" discipline for its own state machine.
 * Whether Poimen completion *gates* the Shepherd Role Assignment is a
 * separate, already-resolved concern (PRD §24 OQ-02) implemented as
 * `libs/rbac`'s `POIMEN_GATE_IF_ENABLED` record-level check - this module
 * only validates the enrollment status transition itself, not its
 * downstream authorization effect.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.POIMEN_STATUSES = void 0;
exports.isPoimenStatus = isPoimenStatus;
exports.checkPoimenStatusTransition = checkPoimenStatusTransition;
exports.POIMEN_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE'];
function isPoimenStatus(value) {
    return exports.POIMEN_STATUSES.includes(value);
}
const TRANSITIONS = {
    NOT_STARTED: ['IN_PROGRESS'],
    IN_PROGRESS: ['COMPLETE'],
    COMPLETE: [],
};
function checkPoimenStatusTransition(from, to) {
    if (from === to) {
        return { allowed: false, reason: `'${from}' is already the current Poimen status; not a transition` };
    }
    const allowedNext = TRANSITIONS[from];
    if (!allowedNext.includes(to)) {
        return {
            allowed: false,
            reason: `FR-PC-06 [INFERRED forward-only progression]: '${from}' -> '${to}' is not a modeled transition (allowed: ${allowedNext.length > 0 ? allowedNext.join(', ') : 'none - terminal status'})`,
        };
    }
    return { allowed: true, reason: `FR-PC-06: '${from}' -> '${to}' is a modeled Poimen enrollment transition` };
}


/***/ }),
/* 55 */
/***/ ((__unused_webpack_module, exports) => {


/**
 * PRD §15.8's decision tree, transcribed into an implementable,
 * framework-agnostic function - BR-PC-02 ("a Person attending Sunday/
 * Wednesday/Friday Gatherings regularly while not attending their
 * assigned Bacenta's meetings constitutes a pastoral concern") and
 * FR-PC-05 (the system-level requirement to detect and flag it).
 *
 * ```mermaid
 * flowchart TD
 *     A[Person has an active Bacenta assignment?] -->|No| Z1[Not evaluated - BR-PPL-01 data-integrity issue]
 *     A -->|Yes| B{Attended >= threshold of last N Sunday/Wed/Fri Gatherings?}
 *     B -->|No| Z2[Not flagged - may be general disengagement, a separate signal]
 *     B -->|Yes| C{Attended >= threshold of last M Bacenta Meetings?}
 *     C -->|Yes| Z3[Healthy - no flag]
 *     C -->|No| D[Flag as Silent Drift]
 * ```
 *
 * §19.3 step 1 makes explicit that nodes D onward (notify Shepherd, SLA,
 * escalate to Assistant Pastor per BR-PC-04) are the *response* workflow
 * that follows a flag being raised - modeled separately in
 * `follow-up-task.ts`'s SLA/escalation functions, since a
 * `SilentDriftFlag`'s subsequent lifecycle (`SilentDriftStatus`:
 * FLAGGED -> RESOLVED/ESCALATED, `db/schema.prisma`) is a stateful record,
 * not a re-evaluation of this same decision.
 *
 * **The "N" / "threshold" wording, resolved.** PRD §15.8's own diagram
 * text says "Attended >= threshold of last N ... Gatherings" for one
 * value (N) and, symmetrically, "last M Bacenta Meetings" for the other -
 * but §15.8's prose and FR-PC-05/OQ-04 never introduce a third, separately
 * -configured "threshold" distinct from N and M themselves ("ships with
 * N=3/M=3 as an explicitly provisional placeholder" - only two numbers are
 * ever named). [INFERRED] This function therefore treats N and M as both
 * the evaluation window size *and* the required attended-count within
 * that window (i.e. "attended >= N of the last N" - perfect attendance
 * required to pass node B, and symmetrically for node C) - the only
 * reading consistent with exactly two configured symbols existing. See
 * `PASTORAL_CARE_DESIGN_NOTES.md`.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.evaluateSilentDrift = evaluateSilentDrift;
/**
 * The pure decision. Takes attendance *counts* as inputs rather than raw
 * attendance records - deliberately, since the Gatherings domain (the
 * actual source of `gatherings.attendance_records`) does not exist yet in
 * this codebase. See `PASTORAL_CARE_DESIGN_NOTES.md`'s open-question entry
 * for the real sweep/trigger that will compute these counts once
 * Gatherings is built; this function is ready to consume that output
 * unchanged.
 */
function evaluateSilentDrift(input) {
    // Node A
    if (!input.hasActiveBacentaAssignment) {
        return {
            flagged: false,
            classification: 'NO_ACTIVE_BACENTA',
            reason: 'PRD §15.8 node Z1 / §19.3 Exceptions: no active Bacenta assignment - a BR-PPL-01 data-integrity issue, not a silent-drift evaluation',
        };
    }
    // Node B
    if (input.recentGatheringAttendedCount < input.attendanceThreshold) {
        return {
            flagged: false,
            classification: 'GENERAL_DISENGAGEMENT',
            reason: `PRD §15.8 node Z2: attended ${input.recentGatheringAttendedCount} of the last ${input.attendanceThreshold} Sunday/Wed/Fri Gatherings - below threshold, so not silent drift (may be general disengagement, a separate signal)`,
        };
    }
    // Node C
    if (input.recentBacentaAttendedCount >= input.bacentaThreshold) {
        return {
            flagged: false,
            classification: 'HEALTHY',
            reason: `PRD §15.8 node Z3: attended ${input.recentBacentaAttendedCount} of the last ${input.bacentaThreshold} Bacenta Meetings - healthy, no flag`,
        };
    }
    // Node D
    const attendanceMissedCount = Math.max(input.attendanceThreshold - input.recentGatheringAttendedCount, 0);
    const bacentaMissedCount = Math.max(input.bacentaThreshold - input.recentBacentaAttendedCount, 0);
    return {
        flagged: true,
        classification: 'SILENT_DRIFT',
        reason: `PRD §15.8 node D / BR-PC-02: attended ${input.recentGatheringAttendedCount} of the last ${input.attendanceThreshold} Sunday/Wed/Fri Gatherings but only ${input.recentBacentaAttendedCount} of the last ${input.bacentaThreshold} Bacenta Meetings`,
        attendanceMissedCount,
        bacentaMissedCount,
    };
}


/***/ }),
/* 56 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FollowUpSlaSweepRepository = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const prisma_service_1 = __webpack_require__(9);
/**
 * apps/worker's own Prisma-backed queries for the follow-up-sla-sweep -
 * see `FollowUpSlaSweepJob`'s own doc comment for why this job never
 * mutates `FollowUpTask` (only publishes a signal), and
 * `WORKER_DESIGN_NOTES.md` for the "own repository, not a cross-app
 * import" rationale shared with every other worker-side repository.
 */
let FollowUpSlaSweepRepository = class FollowUpSlaSweepRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listBranches() {
        return this.prisma.branch.findMany({ select: { id: true } });
    }
    /** Every `OPEN` Follow-up task in a Branch with a `dueAt` set - the
     * candidate population `isFollowUpTaskPastSla()` evaluates. Tasks with
     * no `dueAt` (schema allows it to be null) have nothing to breach and
     * are excluded at the query level rather than left to the pure
     * function's own null-check, purely to keep the candidate set small. */
    listOpenTasksWithDueDate(branchId) {
        return this.prisma.followUpTask.findMany({
            where: { branchId, status: 'OPEN', dueAt: { not: null } },
        });
    }
};
exports.FollowUpSlaSweepRepository = FollowUpSlaSweepRepository;
exports.FollowUpSlaSweepRepository = FollowUpSlaSweepRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], FollowUpSlaSweepRepository);


/***/ }),
/* 57 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SilentDriftSweepModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const silent_drift_sweep_job_1 = __webpack_require__(58);
const silent_drift_sweep_repository_1 = __webpack_require__(59);
const events_module_1 = __webpack_require__(28);
let SilentDriftSweepModule = class SilentDriftSweepModule {
};
exports.SilentDriftSweepModule = SilentDriftSweepModule;
exports.SilentDriftSweepModule = SilentDriftSweepModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [events_module_1.EventsModule],
        providers: [silent_drift_sweep_repository_1.SilentDriftSweepRepository, silent_drift_sweep_job_1.SilentDriftSweepJob],
        exports: [silent_drift_sweep_job_1.SilentDriftSweepJob],
    })
], SilentDriftSweepModule);


/***/ }),
/* 58 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var SilentDriftSweepJob_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SilentDriftSweepJob = void 0;
const tslib_1 = __webpack_require__(5);
const node_crypto_1 = __webpack_require__(39);
const common_1 = __webpack_require__(6);
const domain_pastoral_care_1 = __webpack_require__(52);
const nestjs_pino_1 = __webpack_require__(3);
const silent_drift_sweep_repository_1 = __webpack_require__(59);
const eventbridge_publisher_service_1 = __webpack_require__(29);
/**
 * The silent-drift sweep (Blueprint §10.8: "Amazon EventBridge Scheduler
 * triggering the Worker service, e.g., nightly for silent-drift"). Chosen
 * as this milestone's one sweep job because it was the most-cited dormant
 * piece across the whole codebase - `evaluateSilentDrift()`
 * (`libs/domain/pastoral-care`) has been ready-to-consume, with zero real
 * callers, since the Pastoral Care domain milestone, and
 * `GATHERINGS_DESIGN_NOTES.md`'s own "what this milestone deliberately
 * does not build" section names this exact gap by name ("wiring
 * `evaluateSilentDrift()` up to real attendance counts is Pastoral Care's
 * own follow-up work").
 *
 * For every Branch: loads its N/M thresholds, evaluates every Person with
 * an open Bacenta membership against the pure decision function, and for
 * every newly-flagged Person (skipping anyone who already has an open,
 * unresolved flag) writes a `SilentDriftFlag` row and publishes a
 * synthetic `pastoral_care.silent_drift_flagged` Engagement Signal onto
 * the shared bus (§10.8: "emits a synthetic Engagement Signal onto the
 * same bus... rather than calling the Notification service directly,
 * keeping exactly one downstream reaction mechanism regardless of trigger
 * source").
 */
let SilentDriftSweepJob = class SilentDriftSweepJob {
    static { SilentDriftSweepJob_1 = this; }
    repository;
    publisher;
    logger;
    static SIGNAL_TYPE = 'pastoral_care.silent_drift_flagged';
    static SCHEMA_VERSION = 1;
    constructor(repository, publisher, logger) {
        this.repository = repository;
        this.publisher = publisher;
        this.logger = logger;
    }
    /** Runs the sweep across every Branch. Returns the number of new flags
     * raised, the unit `main.ts`'s dispatcher logs on completion. */
    async run() {
        const branches = await this.repository.listBranches();
        let flaggedCount = 0;
        for (const branch of branches) {
            flaggedCount += await this.sweepBranch(branch.id);
        }
        return flaggedCount;
    }
    async sweepBranch(branchId) {
        const { n, m } = await this.repository.getThresholds(branchId);
        const memberships = await this.repository.listActiveBacentaMemberships(branchId);
        const recentMainServiceGatheringIds = await this.repository.listRecentMainServiceGatheringIds(branchId, n);
        let flaggedCount = 0;
        for (const membership of memberships) {
            const recentBacentaGatheringIds = await this.repository.listRecentBacentaGatheringIds(membership.groupId, m);
            const [recentGatheringAttendedCount, recentBacentaAttendedCount] = await Promise.all([
                this.repository.countPresentAttendance(membership.personId, recentMainServiceGatheringIds),
                this.repository.countPresentAttendance(membership.personId, recentBacentaGatheringIds),
            ]);
            const outcome = (0, domain_pastoral_care_1.evaluateSilentDrift)({
                hasActiveBacentaAssignment: true,
                recentGatheringAttendedCount,
                attendanceThreshold: n,
                recentBacentaAttendedCount,
                bacentaThreshold: m,
            });
            if (!outcome.flagged) {
                continue;
            }
            const existingFlag = await this.repository.findOpenFlag(membership.personId);
            if (existingFlag) {
                this.logger.info({ personId: membership.personId }, 'Silent drift confirmed but an open flag already exists - no-op');
                continue;
            }
            const flag = await this.repository.createFlag({
                branchId,
                groupId: membership.groupId,
                personId: membership.personId,
                attendanceMissedCount: outcome.attendanceMissedCount ?? 0,
                attendanceThreshold: n,
                bacentaMissedCount: outcome.bacentaMissedCount ?? 0,
                bacentaThreshold: m,
            });
            await this.publisher.publish({
                eventId: (0, node_crypto_1.randomUUID)(),
                eventType: SilentDriftSweepJob_1.SIGNAL_TYPE,
                schemaVersion: SilentDriftSweepJob_1.SCHEMA_VERSION,
                branchId,
                occurredAt: new Date().toISOString(),
                subjectPersonId: membership.personId,
                subjectGroupId: membership.groupId,
                payload: {
                    silentDriftFlagId: flag.id,
                    attendanceMissedCount: flag.attendanceMissedCount,
                    attendanceThreshold: flag.attendanceThreshold,
                    bacentaMissedCount: flag.bacentaMissedCount,
                    bacentaThreshold: flag.bacentaThreshold,
                },
            });
            flaggedCount += 1;
        }
        return flaggedCount;
    }
};
exports.SilentDriftSweepJob = SilentDriftSweepJob;
exports.SilentDriftSweepJob = SilentDriftSweepJob = SilentDriftSweepJob_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(2, (0, nestjs_pino_1.InjectPinoLogger)(SilentDriftSweepJob.name)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof silent_drift_sweep_repository_1.SilentDriftSweepRepository !== "undefined" && silent_drift_sweep_repository_1.SilentDriftSweepRepository) === "function" ? _a : Object, typeof (_b = typeof eventbridge_publisher_service_1.EventBridgePublisherService !== "undefined" && eventbridge_publisher_service_1.EventBridgePublisherService) === "function" ? _b : Object, typeof (_c = typeof nestjs_pino_1.PinoLogger !== "undefined" && nestjs_pino_1.PinoLogger) === "function" ? _c : Object])
], SilentDriftSweepJob);


/***/ }),
/* 59 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SilentDriftSweepRepository = exports.DEFAULT_SILENT_DRIFT_THRESHOLDS = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const prisma_service_1 = __webpack_require__(9);
/** OQ-04's own resolution, restated here since apps/worker has no import
 * path back to `db/DESIGN_NOTES.md`'s prose: "ships with N=3/M=3 as an
 * explicit placeholder." Used whenever a Branch's
 * `platform.configurations.silent_drift_config` is missing or doesn't
 * parse as `{ n: number; m: number }`. */
exports.DEFAULT_SILENT_DRIFT_THRESHOLDS = { n: 3, m: 3 };
/**
 * apps/worker's own Prisma-backed queries for the silent-drift sweep -
 * deliberately not importing anything from `apps/api/src/modules/
 * pastoral-care` (which, per `PASTORAL_CARE_DESIGN_NOTES.md`, has no
 * `SilentDriftFlag` repository/service/controller of its own yet anyway -
 * that milestone built the table and the pure decision function but
 * nothing to trigger it against). Same "own repository, shared
 * `libs/domain`/`libs/contracts` only" split as `WorkerEngagementSignalRepository`.
 */
let SilentDriftSweepRepository = class SilentDriftSweepRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listBranches() {
        return this.prisma.branch.findMany({ select: { id: true } });
    }
    /**
     * PRD §15.8's own N/M thresholds (see `libs/domain/pastoral-care`'s
     * `silent-drift.ts` doc comment for why N and M are read as both the
     * window size and the required-attended count). Falls back to
     * `DEFAULT_SILENT_DRIFT_THRESHOLDS` if the Branch has no Configuration
     * row yet, or its `silent_drift_config` JSON doesn't have the expected
     * shape - a Branch without configuration should still get sensible
     * placeholder behavior, not a sweep failure.
     */
    async getThresholds(branchId) {
        const configuration = await this.prisma.configuration.findUnique({
            where: { branchId },
            select: { silentDriftConfig: true },
        });
        const raw = configuration?.silentDriftConfig;
        const n = typeof raw?.n === 'number' && raw.n > 0 ? raw.n : exports.DEFAULT_SILENT_DRIFT_THRESHOLDS.n;
        const m = typeof raw?.m === 'number' && raw.m > 0 ? raw.m : exports.DEFAULT_SILENT_DRIFT_THRESHOLDS.m;
        return { n, m };
    }
    /** Node A's population: every Person with a currently-open
     * PASTORAL_CARE (Bacenta) GroupMembership in this Branch. */
    listActiveBacentaMemberships(branchId) {
        return this.prisma.groupMembership.findMany({
            where: { branchId, groupType: 'PASTORAL_CARE', endedAt: null },
            select: { personId: true, groupId: true },
        });
    }
    /**
     * The Branch's most recent `limit` main-service Gatherings (Node B's
     * "last N Sunday/Wed/Fri Gatherings"). Distinguished from a Bacenta
     * Meeting via `ownerGroupId IS NULL` - `Gathering.type` is a Branch-
     * configured free string with no fixed enum (`GATHERINGS_DESIGN_NOTES.md`),
     * so `ownerGroupId` (set only for a Group-owned recurring Gathering
     * like a Bacenta Meeting, per FR-GTH-03's own "Branch/Bacenta-level
     * scoping via ownerGroupId") is the one schema-grounded signal available
     * to tell the two apart, rather than pattern-matching on `type` string
     * values that are themselves not fixed by any document.
     * **[INFERRED]**, flagged in `WORKER_DESIGN_NOTES.md`.
     */
    async listRecentMainServiceGatheringIds(branchId, limit) {
        const gatherings = await this.prisma.gathering.findMany({
            where: { branchId, ownerGroupId: null },
            orderBy: { scheduledStart: 'desc' },
            take: limit,
            select: { id: true },
        });
        return gatherings.map((g) => g.id);
    }
    /** The Bacenta's most recent `limit` own Gatherings (Node C's "last M
     * Bacenta Meetings") - `ownerGroupId = groupId`, the Bacenta-owned
     * counterpart to the query above. */
    async listRecentBacentaGatheringIds(groupId, limit) {
        const gatherings = await this.prisma.gathering.findMany({
            where: { ownerGroupId: groupId },
            orderBy: { scheduledStart: 'desc' },
            take: limit,
            select: { id: true },
        });
        return gatherings.map((g) => g.id);
    }
    /** "Attended" = `AttendanceStatus.PRESENT` - PRD §12.2's 3-value status
     * (present/absent/excused); `EXCUSED` is deliberately not counted as
     * attendance for this evaluation, only `PRESENT` is. */
    countPresentAttendance(personId, gatheringIds) {
        if (gatheringIds.length === 0) {
            return Promise.resolve(0);
        }
        return this.prisma.attendanceRecord.count({
            where: { personId, gatheringId: { in: gatheringIds }, status: 'PRESENT' },
        });
    }
    /** Business-level idempotency (distinct from `ProcessedEventRepository`'s
     * event-delivery idempotency): a Person already carrying an unresolved
     * `FLAGGED` flag should not get a second one from the next nightly
     * sweep run before the first is resolved/escalated. */
    findOpenFlag(personId) {
        return this.prisma.silentDriftFlag.findFirst({
            where: { personId, status: 'FLAGGED' },
        });
    }
    createFlag(input) {
        return this.prisma.silentDriftFlag.create({ data: input });
    }
};
exports.SilentDriftSweepRepository = SilentDriftSweepRepository;
exports.SilentDriftSweepRepository = SilentDriftSweepRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], SilentDriftSweepRepository);


/***/ }),
/* 60 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkerPlatformModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(6);
const config_1 = __webpack_require__(12);
const nestjs_pino_1 = __webpack_require__(3);
const env_schema_1 = __webpack_require__(61);
const database_module_1 = __webpack_require__(31);
/**
 * `WorkerPlatformModule` (Worker milestone) - apps/worker's own analogue
 * of `apps/api/src/platform/platform.module.ts`, deliberately smaller:
 *
 * - `ConfigModule`/`LoggerModule`/`WorkerDatabaseModule` are carried over
 *   unchanged in spirit (typed env, structured pino logging, Prisma).
 * - `TerminusModule`/`HealthController` are dropped - apps/worker has no
 *   HTTP surface (it runs via `NestFactory.createApplicationContext()`),
 *   so there is no `/health` route to back.
 * - `AllExceptionsFilter` (`APP_FILTER`) is dropped - that filter's job is
 *   translating thrown errors into HTTP responses; a Worker command that
 *   throws should propagate the error to its caller (`main.ts`'s
 *   dispatcher) and exit non-zero, not format an HTTP body nobody reads.
 * - `AuditModule`/`AuthModule`/`RbacPlatformModule` are dropped entirely,
 *   not merely deferred. Worker-initiated writes bypass HTTP+RBAC guards
 *   by construction (see `WORKER_DESIGN_NOTES.md`'s "No system actor"
 *   section) - there is no `ActorContext` to resolve and no per-request
 *   authorization decision to audit-log here the way apps/api has one for
 *   every human-initiated request.
 */
let WorkerPlatformModule = class WorkerPlatformModule {
};
exports.WorkerPlatformModule = WorkerPlatformModule;
exports.WorkerPlatformModule = WorkerPlatformModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validate: env_schema_1.validateEnv,
            }),
            nestjs_pino_1.LoggerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    pinoHttp: {
                        level: configService.get('LOG_LEVEL', { infer: true }),
                        // Same "pretty locally, structured JSON everywhere else"
                        // reasoning as apps/api's PlatformModule - no `autoLogging`
                        // ignore rule is needed here since apps/worker has no HTTP
                        // requests to auto-log in the first place.
                        transport: configService.get('NODE_ENV', { infer: true }) === 'development'
                            ? { target: 'pino-pretty', options: { singleLine: true } }
                            : undefined,
                    },
                }),
            }),
            database_module_1.WorkerDatabaseModule,
        ],
        exports: [config_1.ConfigModule, database_module_1.WorkerDatabaseModule],
    })
], WorkerPlatformModule);


/***/ }),
/* 61 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.envSchema = void 0;
exports.validateEnv = validateEnv;
const zod_1 = __webpack_require__(20);
/**
 * Process environment schema for apps/worker (Worker milestone, mirroring
 * `apps/api/src/platform/config/env.schema.ts`'s own doc comment and
 * conventions exactly - see that file for why this is a Zod schema
 * separate from `libs/config`, and why it's an app-private file rather
 * than a shared `libs/env`: no such shared lib exists, and Nx's
 * app-to-app `enforce-module-boundaries` rule already active in this
 * workspace would forbid apps/worker importing from apps/api directly.
 *
 * The Worker milestone's first vertical slice ("Foundation + one full
 * vertical slice first" - see `apps/worker/WORKER_DESIGN_NOTES.md`)
 * declared only `SQS_INSIGHTS_QUEUE_URL`; this follow-up milestone (the
 * remaining two consumers + three sweep jobs) adds
 * `SQS_NOTIFICATION_QUEUE_URL`/`SQS_AUDIT_QUEUE_URL` for the same reason.
 */
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    /**
     * pino log level - identical purpose/citation to apps/api's own
     * `LOG_LEVEL` (Blueprint §14.1 code-quality).
     */
    LOG_LEVEL: zod_1.z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    /**
     * PostgreSQL connection string. Identical purpose to apps/api's own
     * `DATABASE_URL` - both processes connect to the one shared Postgres
     * database (Blueprint ADR-003: schema-per-bounded-context in a single
     * database, not a database per service), each with its own PrismaClient
     * instance since no shared `libs/database` exists (see
     * `apps/worker/src/platform/database/prisma.service.ts`'s doc comment).
     * Required, no default - same "fail fast" reasoning as apps/api.
     */
    DATABASE_URL: zod_1.z
        .string()
        .min(1, 'DATABASE_URL is required')
        .refine((value) => value.startsWith('postgresql://') || value.startsWith('postgres://'), 'DATABASE_URL must be a postgresql:// or postgres:// connection string'),
    /**
     * AWS region the EventBridge bus and SQS queues live in (Blueprint
     * §10.1/§10.2, ADR-007's EventBridge/SQS event architecture). Required,
     * no default: a Worker process that cannot reach the event bus should
     * refuse to boot, not start and fail on the first publish/poll - the
     * same reasoning `DATABASE_URL` and Cognito's `COGNITO_REGION` already
     * apply in apps/api.
     */
    AWS_REGION: zod_1.z.string().min(1, 'AWS_REGION is required'),
    /**
     * The single EventBridge bus name (Blueprint §10.2 names it
     * `ecclesia-engagement-signals`) that `EventBridgePublisherService`
     * publishes every Engagement Signal onto, and that scheduled sweeps
     * (§10.8) publish their synthetic signals onto too. Defaulted to the
     * Blueprint's own named value rather than left required, since it is a
     * fixed architectural constant, not an environment-specific value that
     * legitimately differs between deployments.
     */
    EVENTBRIDGE_BUS_NAME: zod_1.z.string().min(1).default('ecclesia-engagement-signals'),
    /**
     * The `insights-consumer` SQS queue's URL (Blueprint §10.2 names the
     * queue `insights-consumer`; the full queue URL, not just the name, is
     * what `@aws-sdk/client-sqs`'s `ReceiveMessageCommand`/
     * `DeleteMessageCommand` require). Required, no default - the same
     * "fail fast" reasoning as `DATABASE_URL`: a consumer process with no
     * queue to poll should refuse to boot. **[PRD-DERIVED]**: the Blueprint
     * names the queue, not the config variable that carries its URL - this
     * naming is a reasonable construction, not a citation.
     */
    SQS_INSIGHTS_QUEUE_URL: zod_1.z.string().min(1, 'SQS_INSIGHTS_QUEUE_URL is required'),
    /**
     * The `notification-consumer` SQS queue's URL (Blueprint §10.2 names
     * the queue `notification-consumer`). Same "required, no default, fail
     * fast" reasoning as `SQS_INSIGHTS_QUEUE_URL`. **[PRD-DERIVED]** naming,
     * same caveat as that variable.
     */
    SQS_NOTIFICATION_QUEUE_URL: zod_1.z.string().min(1, 'SQS_NOTIFICATION_QUEUE_URL is required'),
    /**
     * The `audit-consumer` SQS queue's URL (Blueprint §10.2 names the queue
     * `audit-consumer`). Same reasoning as the two queue URLs above.
     */
    SQS_AUDIT_QUEUE_URL: zod_1.z.string().min(1, 'SQS_AUDIT_QUEUE_URL is required'),
});
/**
 * `@nestjs/config`'s `ConfigModule.forRoot({ validate })` hook - identical
 * "fail fast on invalid/missing config" reasoning as apps/api's own
 * `validateEnv`.
 */
function validateEnv(rawConfig) {
    const result = exports.envSchema.safeParse(rawConfig);
    if (!result.success) {
        const issues = result.error.issues
            .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
            .join('; ');
        throw new Error(`Invalid environment configuration - ${issues}`);
    }
    return result.data;
}


/***/ }),
/* 62 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseCommand = parseCommand;
exports.runCommand = runCommand;
const nestjs_pino_1 = __webpack_require__(3);
const audit_consumer_1 = __webpack_require__(11);
const insights_consumer_1 = __webpack_require__(34);
const notification_consumer_1 = __webpack_require__(36);
const attendance_completeness_sweep_job_1 = __webpack_require__(38);
const church_pulse_recompute_job_1 = __webpack_require__(45);
const follow_up_sla_sweep_job_1 = __webpack_require__(51);
const silent_drift_sweep_job_1 = __webpack_require__(58);
const VALID_COMMANDS = [
    'consume:insights',
    'consume:notification',
    'consume:audit',
    'sweep:silent-drift',
    'sweep:church-pulse-recompute',
    'sweep:follow-up-sla',
    'sweep:attendance-completeness',
];
/**
 * Parses `process.argv`'s one positional command argument (e.g.
 * `node main.js consume:insights`) into a known `WorkerCommand`.
 */
function parseCommand(argv) {
    const [, , command] = argv;
    if (!command || !VALID_COMMANDS.includes(command)) {
        throw new Error(`Unknown or missing worker command '${command ?? ''}' - expected one of: ${VALID_COMMANDS.join(', ')}`);
    }
    return command;
}
/** Runs one long-poll consumer against `app.get(consumerType)` until
 * SIGTERM/SIGINT - the shared body every `consume:*` case needs. */
async function runConsumer(app, consumerType) {
    const consumer = app.get(consumerType);
    const controller = new AbortController();
    process.once('SIGTERM', () => controller.abort());
    process.once('SIGINT', () => controller.abort());
    await consumer.run(controller.signal);
}
/** Runs one scheduled sweep once against `app.get(jobType)` and logs the
 * count it returns - the shared body every `sweep:*` case needs. */
async function runSweep(app, jobType, describeResult) {
    const job = app.get(jobType);
    const count = await job.run();
    app.get(nestjs_pino_1.Logger).log(describeResult(count));
}
/**
 * Runs one `WorkerCommand` against an already-constructed Nest application
 * context.
 */
async function runCommand(command, app) {
    switch (command) {
        case 'consume:insights':
            return runConsumer(app, insights_consumer_1.InsightsConsumer);
        case 'consume:notification':
            return runConsumer(app, notification_consumer_1.NotificationConsumer);
        case 'consume:audit':
            return runConsumer(app, audit_consumer_1.AuditConsumer);
        case 'sweep:silent-drift':
            return runSweep(app, silent_drift_sweep_job_1.SilentDriftSweepJob, (count) => `silent-drift-sweep flagged ${count} Person(s)`);
        case 'sweep:church-pulse-recompute':
            return runSweep(app, church_pulse_recompute_job_1.ChurchPulseRecomputeJob, (count) => `church-pulse-recompute recomputed ${count} scope(s)`);
        case 'sweep:follow-up-sla':
            return runSweep(app, follow_up_sla_sweep_job_1.FollowUpSlaSweepJob, (count) => `follow-up-sla-sweep signaled ${count} breach(es)`);
        case 'sweep:attendance-completeness':
            return runSweep(app, attendance_completeness_sweep_job_1.AttendanceCompletenessSweepJob, (count) => `attendance-completeness-sweep signaled ${count} incomplete Gathering(s)`);
    }
}


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	const __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		const cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		const module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = __webpack_module_cache__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// module cache are used so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	let __webpack_exports__ = __webpack_require__(__webpack_require__.s = 0);
/******/ 	
/******/ })()
;
//# sourceMappingURL=main.js.map