/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("reflect-metadata");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("nestjs-pino");

/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const app_controller_1 = __webpack_require__(9);
const app_service_1 = __webpack_require__(10);
const platform_module_1 = __webpack_require__(11);
/**
 * Root module. Bounded-context modules (Blueprint Ch.1 §4.2 module
 * inventory: PeopleModule, PastoralCareModule, MinistryModule,
 * GatheringsModule, StewardshipModule, InsightsModule, PlatformModule)
 * are registered in `imports` here as each is built.
 *
 * `PlatformModule` (Sprint 1.2) is the first: config, structured logging,
 * the `/health` endpoint, and the workspace-wide exception filter. The
 * remaining six are still unbuilt - People and the rest land after
 * Sprints 1.3 (database) and 1.4 (authentication), per the locked
 * roadmap.
 */
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [platform_module_1.PlatformModule],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);


/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const app_service_1 = __webpack_require__(10);
/**
 * Placeholder root controller (`GET /v1`, versioned per Blueprint §14.7
 * since Sprint 1.2 - see `main.ts`'s `enableVersioning`). Still exists
 * only to prove the HTTP layer, DI container, and build pipeline work end
 * to end; `PlatformModule`'s `/health` is the real infrastructure check
 * now (Sprint 1.2). Bounded-context controllers (e.g.
 * `stewardship/financial-transaction.controller.ts`, per Blueprint §6.4)
 * are added in later milestones as their owning modules are built.
 */
let AppController = class AppController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    getStatus() {
        return this.appService.getStatus();
    }
};
exports.AppController = AppController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Object)
], AppController.prototype, "getStatus", null);
exports.AppController = AppController = tslib_1.__decorate([
    (0, common_1.Controller)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof app_service_1.AppService !== "undefined" && app_service_1.AppService) === "function" ? _a : Object])
], AppController);


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
/**
 * Placeholder service proving dependency injection is wired correctly.
 * Real service logic is added per bounded-context module (people,
 * pastoral-care, ministry, gatherings, stewardship, insights, platform)
 * in the milestones that follow - not here.
 */
let AppService = class AppService {
    getStatus() {
        return { service: 'ecclesia-api', status: 'scaffold' };
    }
};
exports.AppService = AppService;
exports.AppService = AppService = tslib_1.__decorate([
    (0, common_1.Injectable)()
], AppService);


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlatformModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(4);
const core_1 = __webpack_require__(3);
const terminus_1 = __webpack_require__(12);
const nestjs_pino_1 = __webpack_require__(6);
const env_schema_1 = __webpack_require__(13);
const all_exceptions_filter_1 = __webpack_require__(15);
const health_controller_1 = __webpack_require__(16);
/**
 * PlatformModule (Sprint 1.2) - the module named but not yet built in
 * `apps/api/src/app/app.module.ts`'s bounded-context list and in
 * `apps/api/README.md`. Everything here is cross-cutting infrastructure
 * (config, logging, health, error handling), never business logic per
 * engineering-principles.md §1 - no PRD requirement is implemented by
 * this module, it exists to let every other bounded-context module be
 * built safely on top of it.
 */
let PlatformModule = class PlatformModule {
};
exports.PlatformModule = PlatformModule;
exports.PlatformModule = PlatformModule = tslib_1.__decorate([
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
                        // Pretty-printed, human-readable logs locally; structured JSON
                        // (pino's default) everywhere else, since that is what a log
                        // aggregator in the eventual ECS deployment (Blueprint §11.1)
                        // actually needs to index and query.
                        transport: configService.get('NODE_ENV', { infer: true }) === 'development'
                            ? { target: 'pino-pretty', options: { singleLine: true } }
                            : undefined,
                        // Never log credentials or session tokens, even by accident via
                        // a header dump - engineering-principles.md §5, Security by
                        // Default.
                        redact: {
                            paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
                            remove: true,
                        },
                        autoLogging: {
                            // The infra health check would otherwise dominate the log
                            // stream with a line every few seconds.
                            ignore: (req) => req.url === '/health',
                        },
                    },
                }),
            }),
            terminus_1.TerminusModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [
            {
                provide: core_1.APP_FILTER,
                useClass: all_exceptions_filter_1.AllExceptionsFilter,
            },
        ],
        exports: [config_1.ConfigModule],
    })
], PlatformModule);


/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("@nestjs/terminus");

/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.envSchema = void 0;
exports.validateEnv = validateEnv;
const zod_1 = __webpack_require__(14);
/**
 * Process environment schema for apps/api (Sprint 1.2, Blueprint §6.2's
 * "typed configuration loading" applied to bootstrap/process config).
 *
 * This is deliberately separate from `libs/config`, which holds *Branch*
 * configuration (gathering types, Church Pulse weights, the Poimen-gate
 * flag) - business data that lives in the database and lands with the
 * Prisma milestone (Sprint 1.3). This schema is process configuration:
 * values that exist before any database connection does, read once at
 * boot from `process.env`.
 *
 * Zod, not class-validator, per the ADR already recorded in
 * `libs/contracts/src/lib/contracts.ts` (Blueprint §6.3: "Shared DTOs /
 * Zod schemas"). One validation library for the whole API, not two.
 */
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    /** HTTP port the API listens on. */
    PORT: zod_1.z.coerce.number().int().positive().default(3000),
    /**
     * pino log level (Blueprint §14.1 code-quality; also feeds the denial
     * audit logging required by engineering-principles.md §5, Security by
     * Default). `silent` is intentionally excluded - a production deploy
     * that accidentally silences logging is a bug, not a valid setting.
     */
    LOG_LEVEL: zod_1.z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    /**
     * Whether to mount the Swagger UI at `/docs`. Defaults on for local
     * development and CI; operators deploying to an environment reachable
     * outside the VPC should set this to `false` until Sprint 1.4
     * authentication can gate the docs route itself.
     */
    API_DOCS_ENABLED: zod_1.z
        .enum(['true', 'false'])
        .default('true')
        .transform((value) => value === 'true'),
});
/**
 * `@nestjs/config`'s `ConfigModule.forRoot({ validate })` hook. Throwing
 * here means the process refuses to boot on an invalid or missing
 * required variable, rather than starting in a half-configured state and
 * failing confusingly later - the same "fail fast" reasoning
 * engineering-principles.md §5 applies to authorization applies to
 * configuration.
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
/* 14 */
/***/ ((module) => {

module.exports = require("zod");

/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var AllExceptionsFilter_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AllExceptionsFilter = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const nestjs_pino_1 = __webpack_require__(6);
/**
 * Workspace-wide exception filter (Sprint 1.2). Every response the API
 * ever sends for an error - a validation failure, an `RbacGuard` denial
 * (Blueprint §9.4), an unexpected bug - passes through here, so the
 * response shape is one thing, not "whatever the throwing code happened
 * to return."
 *
 * Registered as an `APP_FILTER` provider (see `platform.module.ts`)
 * rather than `app.useGlobalFilters()` in `main.ts`, so Nest's DI
 * container can inject the request-scoped pino logger into it - a
 * manually constructed filter in `main.ts` would not get that.
 *
 * engineering-principles.md §5 (Security by Default) states "denials are
 * logged as rigorously as approvals" - every 4xx here logs at `warn`
 * (this includes the 403s `RbacGuard`/`RecordLevelPolicyGuard` will throw
 * once wired to a controller), and every 5xx logs at `error` with the
 * full exception for diagnosis. Nothing that reaches this filter is
 * dropped silently.
 */
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException ? exception.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = AllExceptionsFilter_1.resolveMessage(exception, status);
        const body = {
            statusCode: status,
            path: request.url,
            timestamp: new Date().toISOString(),
            message,
        };
        if (status >= common_1.HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error({ err: exception, path: request.url }, 'Unhandled exception');
        }
        else {
            this.logger.warn({ statusCode: status, path: request.url }, 'Request denied');
        }
        response.status(status).json(body);
    }
    static resolveMessage(exception, status) {
        if (exception instanceof common_1.HttpException) {
            const httpResponse = exception.getResponse();
            if (typeof httpResponse === 'string') {
                return httpResponse;
            }
            if (typeof httpResponse === 'object' &&
                httpResponse !== null &&
                'message' in httpResponse &&
                (typeof httpResponse.message === 'string' ||
                    Array.isArray(httpResponse.message))) {
                return httpResponse.message;
            }
            return exception.message;
        }
        // Never leak an unknown internal error's message to the client - only
        // the generic reason phrase for the status code.
        return status === common_1.HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal server error' : 'Unexpected error';
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = tslib_1.__decorate([
    (0, common_1.Catch)(),
    tslib_1.__param(0, (0, nestjs_pino_1.InjectPinoLogger)(AllExceptionsFilter.name)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof nestjs_pino_1.PinoLogger !== "undefined" && nestjs_pino_1.PinoLogger) === "function" ? _a : Object])
], AllExceptionsFilter);


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HealthController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const terminus_1 = __webpack_require__(12);
const HEAP_THRESHOLD_BYTES = 300 * 1024 * 1024;
// RSS needs meaningfully more headroom than heap: it also covers V8
// engine overhead and native addons (e.g. @swc/core's binary), which sit
// outside the JS heap entirely. A 300MB RSS ceiling tripped on real
// startup (confirmed empirically, Sprint 1.2 verification: "Used rss
// exceeded the set threshold" against a perfectly healthy process). This
// is a starting point, not a tuned production value - revisit once the
// ECS Fargate task's actual memory allocation is known (Blueprint Ch.5
// infra milestone).
const RSS_THRESHOLD_BYTES = 512 * 1024 * 1024;
/**
 * `GET /health` (Sprint 1.2). Deliberately `VERSION_NEUTRAL` - unlike
 * every business endpoint (Blueprint §14.7's `/v1/...` convention), a
 * load balancer or container orchestrator's health check should not need
 * to track an API version bump. This is the one endpoint in the service
 * that infrastructure, not a client, calls.
 *
 * Only process-level checks exist so far (heap/RSS memory, both cheap and
 * dependency-free) because there is no database connection yet - Sprint
 * 1.3 (Prisma/PostgreSQL) adds a `PrismaHealthIndicator` here so the
 * check reflects real downstream health, not just "the Node process is
 * still running."
 */
let HealthController = class HealthController {
    health;
    memory;
    constructor(health, memory) {
        this.health = health;
        this.memory = memory;
    }
    check() {
        return this.health.check([
            () => this.memory.checkHeap('memory_heap', HEAP_THRESHOLD_BYTES),
            () => this.memory.checkRSS('memory_rss', RSS_THRESHOLD_BYTES),
        ]);
    }
};
exports.HealthController = HealthController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    (0, terminus_1.HealthCheck)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = tslib_1.__decorate([
    (0, common_1.Controller)({ path: 'health', version: common_1.VERSION_NEUTRAL }),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof terminus_1.HealthCheckService !== "undefined" && terminus_1.HealthCheckService) === "function" ? _a : Object, typeof (_b = typeof terminus_1.MemoryHealthIndicator !== "undefined" && terminus_1.MemoryHealthIndicator) === "function" ? _b : Object])
], HealthController);


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
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
let __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
let exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Entry point for the Ecclesia API service (Blueprint Ch.1 §3: the
 * modular monolith exposing one NestJS module per bounded context).
 *
 * Sprint 1.2 adds the platform foundation - typed/validated config,
 * structured logging, URI-path API versioning (Blueprint §14.7), Swagger,
 * and workspace-wide exception handling (see `app/app.module.ts`'s
 * `PlatformModule` import). No bounded-context (people, stewardship, ...)
 * modules, database connection, or authentication exist yet - those are
 * Sprints 1.3/1.4 and the People domain milestone that follows.
 */
__webpack_require__(1);
const common_1 = __webpack_require__(2);
const core_1 = __webpack_require__(3);
const config_1 = __webpack_require__(4);
const swagger_1 = __webpack_require__(5);
const nestjs_pino_1 = __webpack_require__(6);
const app_module_1 = __webpack_require__(7);
async function bootstrap() {
    // `bufferLogs: true` holds Nest's own bootstrap log lines until the real
    // pino logger below is attached, so nothing is lost or logged twice
    // through two different loggers during startup.
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    const configService = app.get(config_1.ConfigService);
    // Blueprint §14.7: every business endpoint is versioned from the first
    // one, at the path level (`/v1/...`), not left unversioned "until it
    // matters" - `HealthController` opts out via `VERSION_NEUTRAL` since it
    // is an infrastructure endpoint, not a client-facing one.
    app.enableVersioning({ type: common_1.VersioningType.URI, defaultVersion: '1' });
    const docsEnabled = configService.get('API_DOCS_ENABLED', { infer: true });
    if (docsEnabled) {
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle('Ecclesia API')
            .setDescription('Ecclesia Church Operating System API (Blueprint Ch.1 §3). Sprint 1.2: platform foundation only.')
            .setVersion('1.0')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup('docs', app, document);
    }
    const port = configService.get('PORT', { infer: true });
    await app.listen(port);
    const logger = app.get(nestjs_pino_1.Logger);
    logger.log(`Ecclesia API listening on port ${port} (docs: ${docsEnabled ? '/docs' : 'disabled'})`);
}
bootstrap().catch((error) => {
    // The pino logger may not exist yet if bootstrap failed before
    // `NestFactory.create` resolved (e.g. invalid environment config) -
    // console.error is the only guaranteed-available fallback here. No
    // eslint-disable needed: the workspace `no-console` rule explicitly
    // allows `console.error` (eslint.config.cjs).
    console.error('[api] Fatal error during bootstrap', error);
    process.exitCode = 1;
});

})();

/******/ })()
;