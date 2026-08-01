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
const audit_module_1 = __webpack_require__(13);
const auth_module_1 = __webpack_require__(19);
const env_schema_1 = __webpack_require__(25);
const database_module_1 = __webpack_require__(14);
const all_exceptions_filter_1 = __webpack_require__(27);
const health_controller_1 = __webpack_require__(28);
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
            database_module_1.DatabaseModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [
            {
                provide: core_1.APP_FILTER,
                useClass: all_exceptions_filter_1.AllExceptionsFilter,
            },
        ],
        exports: [config_1.ConfigModule, database_module_1.DatabaseModule, audit_module_1.AuditModule, auth_module_1.AuthModule],
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
exports.AuditModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const database_module_1 = __webpack_require__(14);
const audit_log_service_1 = __webpack_require__(18);
/**
 * `AuditLogService` (Sprint 1.4), exported so `AuthModule` and every
 * future bounded-context module can write to `platform.audit_log` through
 * one shared writer rather than each reimplementing it.
 */
let AuditModule = class AuditModule {
};
exports.AuditModule = AuditModule;
exports.AuditModule = AuditModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        providers: [audit_log_service_1.AuditLogService],
        exports: [audit_log_service_1.AuditLogService],
    })
], AuditModule);


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const database_health_indicator_1 = __webpack_require__(15);
const prisma_service_1 = __webpack_require__(16);
/**
 * `PrismaService` + `DatabaseHealthIndicator` (Sprint 1.3), exported so
 * both `PlatformModule`'s `HealthController` and every future
 * bounded-context module (People, Stewardship, ...) can inject
 * `PrismaService` without each redeclaring the connection lifecycle.
 */
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = tslib_1.__decorate([
    (0, common_1.Module)({
        providers: [prisma_service_1.PrismaService, database_health_indicator_1.DatabaseHealthIndicator],
        exports: [prisma_service_1.PrismaService, database_health_indicator_1.DatabaseHealthIndicator],
    })
], DatabaseModule);


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseHealthIndicator = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const terminus_1 = __webpack_require__(12);
const prisma_service_1 = __webpack_require__(16);
/**
 * The `PrismaHealthIndicator` `health.controller.ts`'s Sprint 1.2 doc
 * comment said would land "once there is no database connection yet" -
 * Sprint 1.3 is that milestone. A trivial `SELECT 1` proves the
 * connection pool can actually reach PostgreSQL, which the process being
 * "up" alone does not (a crashed/unreachable database still leaves the
 * Node process running).
 */
let DatabaseHealthIndicator = class DatabaseHealthIndicator extends terminus_1.HealthIndicator {
    prisma;
    constructor(prisma) {
        super();
        this.prisma = prisma;
    }
    async isHealthy(key) {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return this.getStatus(key, true);
        }
        catch (error) {
            const status = this.getStatus(key, false, {
                message: error instanceof Error ? error.message : 'Unknown database error',
            });
            throw new terminus_1.HealthCheckError('Database health check failed', status);
        }
    }
};
exports.DatabaseHealthIndicator = DatabaseHealthIndicator;
exports.DatabaseHealthIndicator = DatabaseHealthIndicator = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], DatabaseHealthIndicator);


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const client_1 = __webpack_require__(17);
const nestjs_pino_1 = __webpack_require__(6);
/**
 * The one PrismaClient instance for apps/api (Sprint 1.3). Generated from
 * `db/schema.prisma` - see `db/DESIGN_NOTES.md` for what that schema is
 * and is not yet backed by real Blueprint text.
 *
 * `$connect()`/`$disconnect()` are called explicitly in `onModuleInit`/
 * `onModuleDestroy` rather than left to Prisma's lazy-connect-on-first-query
 * default, so a broken database connection fails the app's startup (and
 * `/health`, once wired) immediately and loudly, not on whatever request
 * happens to be first (engineering-principles.md §5, Security/Reliability
 * by Default - a half-working boot state is worse than a refused one).
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
/* 17 */
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuditLogService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(16);
/**
 * Writer for `platform.audit_log` (Sprint 1.4). This table is the
 * business-meaning, long-retention record Blueprint §12.1 explicitly
 * distinguishes from short-retention operational logs (pino/CloudWatch) -
 * "who did what to church data," not "why is the system behaving this way
 * right now." Nothing here should be called for routine successful
 * request handling; see call sites (`AuthGuard`, `RbacAuditInterceptor`)
 * for exactly which events qualify.
 *
 * A single shared writer rather than one per concern (auth failures, RBAC
 * denials, and eventually financial-transaction/role-assignment audit
 * trails per Blueprint §7.4/§7.5) - one place that knows how to shape a
 * `platform.audit_log` row, reused by every caller that needs to write one.
 */
let AuditLogService = class AuditLogService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(entry) {
        await this.prisma.auditLog.create({
            data: {
                branchId: entry.branchId,
                actorUserId: entry.actorUserId,
                action: entry.action,
                effect: entry.effect,
                resourceType: entry.resourceType,
                resourceId: entry.resourceId,
                reason: entry.reason,
                deviceId: entry.deviceId,
                ipAddress: entry.ipAddress,
            },
        });
    }
};
exports.AuditLogService = AuditLogService;
exports.AuditLogService = AuditLogService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], AuditLogService);


/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const core_1 = __webpack_require__(3);
const audit_module_1 = __webpack_require__(13);
const database_module_1 = __webpack_require__(14);
const actor_context_resolver_service_1 = __webpack_require__(20);
const auth_guard_1 = __webpack_require__(21);
const cognito_verifier_service_1 = __webpack_require__(22);
/**
 * Wires Cognito JWT verification + `ActorContext` resolution (Sprint 1.4)
 * as a global guard, so every route requires a verified identity by
 * default (opt out via `@Public()`) rather than requiring each future
 * domain controller to remember `@UseGuards(AuthGuard)` individually -
 * the same "secure by default, not by convention" reasoning already
 * applied to `AllExceptionsFilter`'s `APP_FILTER` registration.
 */
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, audit_module_1.AuditModule],
        providers: [
            cognito_verifier_service_1.CognitoVerifierService,
            actor_context_resolver_service_1.ActorContextResolverService,
            {
                provide: core_1.APP_GUARD,
                useClass: auth_guard_1.AuthGuard,
            },
        ],
        exports: [cognito_verifier_service_1.CognitoVerifierService, actor_context_resolver_service_1.ActorContextResolverService],
    })
], AuthModule);


/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ActorContextResolverService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const nestjs_pino_1 = __webpack_require__(6);
const prisma_service_1 = __webpack_require__(16);
/**
 * Resolves a verified Cognito access token's `sub` claim into the
 * `ActorContext` shape `libs/rbac`'s guards consume (Sprint 1.4, filling
 * exactly the gap `request-context.ts` describes: "`actor` is derived
 * from a validated JWT ... not yet implemented").
 *
 * Path: `platform.users.cognito_sub` -> `platform.users.person_id` ->
 * `people.persons` -> that Person's currently-active
 * `people.role_assignments` row(s) (Blueprint §7.5: "active" means
 * `effective_from <= now` and `effective_to` is null or in the future).
 *
 * Two genuine gaps found while building this, both deliberately NOT
 * papered over with a guessed default - see AUTH_DESIGN_NOTES.md:
 *
 * 1. **Multiple concurrent active Role Assignments.** `ActorContext.role`
 *    is a single `Role` (a Sprint 1.1 / libs/rbac design decision, out of
 *    this sprint's scope to change). Neither the Blueprint nor the PRD
 *    say what happens when a Person holds two roles at once (e.g.
 *    Treasurer and Shepherd) - this throws `ConflictException` rather
 *    than silently picking one, since a wrong silent choice is a
 *    security-relevant bug, not a cosmetic one.
 * 2. **CLUSTER scope has no resolvable identifier.** `ActorContext.clusterId`
 *    is compared against `ResourceContext.clusterId` by
 *    `libs/rbac`'s `evaluate.ts` (`actor.clusterId === resource.clusterId`),
 *    but `db/schema.prisma` has no Cluster entity and no `cluster_id`
 *    column anywhere (PRD §17.2's own words: "cluster assignment is
 *    itself a configuration, not a hard-coded structure" -
 *    `db/DESIGN_NOTES.md` Open Question #1). This resolver therefore
 *    never populates `clusterId`, which means any `CLUSTER`-scope
 *    permission rule (Assistant Pastor's grants) will always evaluate to
 *    DENY via `evaluate.ts`'s own `actor.clusterId !== undefined` check -
 *    a fail-closed default, not a fail-open guess, but a real product gap
 *    that needs a decision (either add a real cluster identifier to the
 *    schema, or change `libs/rbac`'s `Scope`/`ActorContext` shape to
 *    match a set of Bacenta ids) before Assistant Pastor's day-to-day
 *    cluster-scoped actions can work at all.
 */
let ActorContextResolverService = class ActorContextResolverService {
    prisma;
    logger;
    constructor(prisma, logger) {
        this.prisma = prisma;
        this.logger = logger;
    }
    async resolve(cognitoSub) {
        const user = await this.prisma.user.findUnique({
            where: { cognitoSub },
            include: { person: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('No platform.users record matches this authenticated identity');
        }
        if (!user.person) {
            throw new common_1.UnauthorizedException('Authenticated user is not yet linked to a Person record');
        }
        const now = new Date();
        const activeAssignments = await this.prisma.roleAssignment.findMany({
            where: {
                personId: user.person.id,
                effectiveFrom: { lte: now },
                OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
            },
            include: { group: true },
        });
        if (activeAssignments.length > 1) {
            this.logger.error({ personId: user.person.id, roles: activeAssignments.map((a) => a.role) }, 'Person has more than one concurrently active Role Assignment - ActorContext.role cannot represent this ' +
                '(see AUTH_DESIGN_NOTES.md, Open Question #1)');
            throw new common_1.ConflictException('This Person holds more than one active Role Assignment concurrently, which the current authorization ' +
                'model cannot represent as a single acting role. This requires a product decision, not a client retry.');
        }
        if (activeAssignments.length === 0) {
            // No explicit Role Assignment - fall back to a lifecycle-derived
            // baseline role, per PRD's own framing of Member as a "baseline
            // authenticated role" (PRD ~line 1169) distinct from the five
            // Role-Assignment-granted roles BR-PPL-04 names. Every stage other
            // than MEMBER maps to VISITOR (the zero-ALLOW-rows default,
            // libs/rbac/roles.ts's own comment) rather than guessing a more
            // privileged role for an in-progress lifecycle stage - fail closed.
            const role = user.person.lifecycleStage === 'MEMBER' ? 'MEMBER' : 'VISITOR';
            return {
                personId: user.person.id,
                role,
                branchId: user.person.branchId,
            };
        }
        const assignment = activeAssignments[0];
        const actor = {
            personId: user.person.id,
            role: assignment.role,
            branchId: assignment.branchId,
        };
        if (assignment.group) {
            if (assignment.group.type === 'PASTORAL_CARE') {
                actor.bacentaId = assignment.group.id;
            }
            else if (assignment.group.type === 'MINISTRY') {
                actor.basontaId = assignment.group.id;
            }
        }
        // clusterId deliberately left undefined - see this class's doc
        // comment, point 2. `assignment.scopeGroupIds` (when non-empty) is
        // the cluster-scoped Bacenta set this Role Assignment covers, but
        // there is nowhere in ActorContext to put a *set* of ids, and no
        // resource-side clusterId to compare it against even if there were.
        if (assignment.scopeGroupIds.length > 0) {
            this.logger.warn({ personId: user.person.id, role: assignment.role, scopeGroupIds: assignment.scopeGroupIds }, 'Role Assignment has a non-empty scope_group_ids (cluster scope) - CLUSTER-scope permission checks for ' +
                'this actor will always deny until the schema/libs/rbac CLUSTER model gap is resolved (see ' +
                'AUTH_DESIGN_NOTES.md, Open Question #1)');
        }
        return actor;
    }
};
exports.ActorContextResolverService = ActorContextResolverService;
exports.ActorContextResolverService = ActorContextResolverService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(1, (0, nestjs_pino_1.InjectPinoLogger)(ActorContextResolverService.name)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof nestjs_pino_1.PinoLogger !== "undefined" && nestjs_pino_1.PinoLogger) === "function" ? _b : Object])
], ActorContextResolverService);


/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthGuard = exports.ACTOR_CONTEXT_KEY = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const core_1 = __webpack_require__(3);
const audit_log_service_1 = __webpack_require__(18);
const actor_context_resolver_service_1 = __webpack_require__(20);
const cognito_verifier_service_1 = __webpack_require__(22);
const public_decorator_1 = __webpack_require__(24);
/** Property `AuthGuard` attaches the resolved actor to. */
exports.ACTOR_CONTEXT_KEY = 'actorContext';
/**
 * Verifies the incoming request's Cognito access token and resolves it to
 * an `ActorContext`, attaching it to `request.actorContext` (Sprint 1.4).
 *
 * Deliberately does **not** attach a full `libs/rbac` `EcclesiaRequestContext`
 * (`{ actor, resource, branchConfig }`) - `request-context.ts`'s own
 * comment splits that into two separate future pieces: `actor` from a
 * validated JWT (this guard, this sprint) versus `resource`/`branchConfig`
 * from "whatever record the endpoint is acting on ... each domain module
 * as it is built" (not yet built - People domain and beyond). A future
 * per-endpoint interceptor in each domain module combines
 * `request.actorContext` with the loaded resource and Branch configuration
 * into the full context `RbacGuard` reads, per Blueprint §4.3 rule 2
 * (a domain module depends downward on Platform's auth context; Platform
 * doesn't reach upward into domain-specific resource loading).
 *
 * Applied globally (see `auth.module.ts`) rather than per-controller,
 * since Blueprint §8.1 frames every endpoint as requiring a verified
 * identity by default (`PRD NFR-SEC-01`) - an explicitly public route
 * (there are none yet) would need its own opt-out decorator, not the
 * reverse.
 */
let AuthGuard = class AuthGuard {
    cognitoVerifier;
    actorContextResolver;
    auditLog;
    reflector;
    constructor(cognitoVerifier, actorContextResolver, auditLog, reflector) {
        this.cognitoVerifier = cognitoVerifier;
        this.actorContextResolver = actorContextResolver;
        this.auditLog = auditLog;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        try {
            const token = this.extractBearerToken(request);
            const payload = await this.cognitoVerifier.verifyAccessToken(token);
            const actor = await this.actorContextResolver.resolve(payload.sub);
            request[exports.ACTOR_CONTEXT_KEY] = actor;
            return true;
        }
        catch (error) {
            // Blueprint §8.5: authentication failures are exactly the signal
            // this audit trail exists for (probing/credential-stuffing
            // detection, mirroring §9.6's RBAC-denial logging). Best-effort:
            // a failed token or an unrecognized identity has no
            // `platform.users` row to attribute the write to, so
            // `actorUserId` is left unset rather than blocked on a lookup that
            // is itself what just failed.
            await this.auditLog.record({
                action: 'auth.token.verify',
                effect: 'DENY',
                reason: error instanceof Error ? error.message : 'Authentication failed',
                deviceId: this.extractDeviceId(request),
                ipAddress: request.ip,
            });
            throw error;
        }
    }
    extractDeviceId(request) {
        // Blueprint §8.5 requires logging a "device identifier" but neither
        // document names the header/claim carrying it - inferred as a custom
        // `X-Device-Id` header, matching §8.3's device-bound refresh token
        // design (the mobile client already has to generate a device
        // identifier for that; reusing it here rather than inventing a second
        // one is the more consistent design, but the header name itself is
        // this project's own convention, not a Blueprint citation).
        const header = request.headers['x-device-id'];
        return typeof header === 'string' ? header : undefined;
    }
    extractBearerToken(request) {
        const header = request.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Missing or malformed Authorization header');
        }
        return header.slice('Bearer '.length);
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof cognito_verifier_service_1.CognitoVerifierService !== "undefined" && cognito_verifier_service_1.CognitoVerifierService) === "function" ? _a : Object, typeof (_b = typeof actor_context_resolver_service_1.ActorContextResolverService !== "undefined" && actor_context_resolver_service_1.ActorContextResolverService) === "function" ? _b : Object, typeof (_c = typeof audit_log_service_1.AuditLogService !== "undefined" && audit_log_service_1.AuditLogService) === "function" ? _c : Object, typeof (_d = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _d : Object])
], AuthGuard);


/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CognitoVerifierService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(4);
const aws_jwt_verify_1 = __webpack_require__(23);
/**
 * Verifies AWS Cognito-issued access tokens (Sprint 1.4, Blueprint §8.1
 * ADR-004 / §8.3). `apps/api` is a pure OIDC resource server per §8.1's
 * own words ("integrated ... via standard OIDC/JWT validation
 * middleware") - it never issues or refreshes tokens itself; Cognito does
 * that directly with the client. This service's only job is verifying a
 * token presented on an incoming request.
 *
 * `tokenUse: 'access'` (not `'id'`) because Blueprint §8.3's token table
 * is explicit that the *access token* is "presented on every API
 * request" - the ID token (identity claims for client-side display) is
 * never sent to the API.
 *
 * Uses `aws-jwt-verify` (AWS Labs' own lightweight verification library)
 * rather than the full AWS SDK - it does exactly one thing (fetch the
 * User Pool's JWKS, cache it, verify signature/expiry/issuer/audience)
 * with no other AWS credentials or SDK surface needed, matching the
 * "standard OIDC/JWT validation middleware" framing in §8.1 precisely.
 */
let CognitoVerifierService = class CognitoVerifierService {
    verifier;
    constructor(configService) {
        const userPoolId = configService.get('COGNITO_USER_POOL_ID', { infer: true });
        const clientId = configService.get('COGNITO_CLIENT_ID', { infer: true });
        const region = configService.get('COGNITO_REGION', { infer: true });
        // Defensive cross-check, not something aws-jwt-verify itself needs:
        // CognitoJwtVerifier derives the JWKS region from the User Pool ID's
        // own `<region>_<poolId>` prefix (Cognito's ID format), so
        // COGNITO_REGION isn't consumed for verification - but a mismatch
        // between the two configured values is a real, catchable
        // misconfiguration worth failing fast on at boot rather than only
        // surfacing as confusing token-verification failures later.
        if (!userPoolId.startsWith(`${region}_`)) {
            throw new Error(`COGNITO_REGION ("${region}") does not match the region prefix of COGNITO_USER_POOL_ID ("${userPoolId}")`);
        }
        this.verifier = aws_jwt_verify_1.CognitoJwtVerifier.create({
            userPoolId,
            tokenUse: 'access',
            clientId,
        });
    }
    /**
     * Verifies signature, expiry, issuer, `token_use: 'access'`, and
     * `client_id` (Blueprint §8.3). Throws on any failure - callers (the
     * `AuthGuard`) translate that into a 401, never treat a verification
     * error as "no opinion."
     */
    async verifyAccessToken(token) {
        try {
            // Asserted, not inferred: passing `tokenUse: 'access'` at
            // construction guarantees this payload shape at runtime, but
            // exactly how TypeScript resolves aws-jwt-verify's overloaded
            // `.create()`/`.verify()` return types can vary by version - this
            // assertion reflects known runtime behavior, not a guess.
            return (await this.verifier.verify(token));
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Token verification failed';
            throw new common_1.UnauthorizedException(message);
        }
    }
};
exports.CognitoVerifierService = CognitoVerifierService;
exports.CognitoVerifierService = CognitoVerifierService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], CognitoVerifierService);


/***/ }),
/* 23 */
/***/ ((module) => {

module.exports = require("aws-jwt-verify");

/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Public = exports.IS_PUBLIC_KEY = void 0;
// SetMetadata calls Reflect.defineMetadata at decoration time - this
// import must land before that runs, matching libs/rbac's own precedent
// (require-permission.decorator.ts) for any module that might be loaded
// standalone (e.g. under Jest) rather than via apps/api/src/main.ts, which
// only imports the polyfill for the running application.
__webpack_require__(1);
const common_1 = __webpack_require__(2);
exports.IS_PUBLIC_KEY = 'isPublic';
/**
 * Opt-out of `AuthGuard` for a specific route or controller (Sprint 1.4).
 * Deliberately opt-out, not opt-in - `AuthGuard` is applied globally
 * (`APP_GUARD`, see `auth.module.ts`) because Blueprint §8.1 frames every
 * endpoint as requiring a verified identity by default. The only route
 * that legitimately needs this today is `GET /health`: ECS/ALB health
 * checks (Blueprint §11.1/§11.3) cannot present a Cognito access token,
 * and gating infrastructure health monitoring behind application auth
 * would make the health check useless for its actual purpose. Any other
 * use of this decorator should be treated as suspicious by default, not
 * routine - a growing list of `@Public()` routes is a sign the auth model
 * needs revisiting, not a normal pattern to reach for.
 */
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.envSchema = void 0;
exports.validateEnv = validateEnv;
const zod_1 = __webpack_require__(26);
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
    /**
     * PostgreSQL connection string consumed directly by `db/schema.prisma`'s
     * `datasource` block (`env("DATABASE_URL")`) - PrismaClient reads this
     * from `process.env` itself, not through `ConfigService`. Required, no
     * default: a process with no database to connect to should refuse to
     * boot, not start and fail on the first query (Sprint 1.3).
     */
    DATABASE_URL: zod_1.z
        .string()
        .min(1, 'DATABASE_URL is required')
        .refine((value) => value.startsWith('postgresql://') || value.startsWith('postgres://'), 'DATABASE_URL must be a postgresql:// or postgres:// connection string'),
    /**
     * Cognito User Pool ID (Sprint 1.4, Blueprint §8.1 ADR-004). Required,
     * no default, same "fail fast" reasoning as `DATABASE_URL`: a process
     * that cannot verify access tokens should refuse to boot, not start and
     * fail confusingly on the first authenticated request. Format is
     * `<region>_<9 alphanumeric chars>` (e.g. `us-east-1_AbC123dEf`) - Cognito's
     * own ID format, validated loosely here since Cognito itself is the
     * source of truth for whether a given ID is real.
     */
    COGNITO_USER_POOL_ID: zod_1.z
        .string()
        .min(1, 'COGNITO_USER_POOL_ID is required')
        .regex(/^[\w-]+_[0-9a-zA-Z]+$/, 'COGNITO_USER_POOL_ID must look like <region>_<poolId>'),
    /** Cognito App Client ID (Sprint 1.4) - the `aud`/`client_id` claim access tokens must carry. */
    COGNITO_CLIENT_ID: zod_1.z.string().min(1, 'COGNITO_CLIENT_ID is required'),
    /**
     * AWS region the User Pool lives in (Sprint 1.4) - used to construct the
     * issuer URL (`https://cognito-idp.<region>.amazonaws.com/<userPoolId>`,
     * Blueprint §8.1) that `aws-jwt-verify` uses to fetch the JWKS.
     */
    COGNITO_REGION: zod_1.z.string().min(1, 'COGNITO_REGION is required'),
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
/* 26 */
/***/ ((module) => {

module.exports = require("zod");

/***/ }),
/* 27 */
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
/* 28 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HealthController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const terminus_1 = __webpack_require__(12);
const database_health_indicator_1 = __webpack_require__(15);
const public_decorator_1 = __webpack_require__(24);
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
 * `GET /health`. Deliberately `VERSION_NEUTRAL` - unlike every business
 * endpoint (Blueprint §14.7's `/v1/...` convention), a load balancer or
 * container orchestrator's health check should not need to track an API
 * version bump. This is the one endpoint in the service that
 * infrastructure, not a client, calls.
 *
 * Sprint 1.2 shipped only process-level checks (heap/RSS memory) because
 * there was no database connection yet. Sprint 1.3 adds
 * `DatabaseHealthIndicator` so the check reflects real downstream health,
 * not just "the Node process is still running" - a crashed or
 * unreachable PostgreSQL instance now fails this check.
 *
 * `@Public()` (Sprint 1.4): ECS/ALB health checks cannot present a
 * Cognito access token, and `AuthGuard` is applied globally - without this
 * opt-out, infrastructure health monitoring would itself be broken by the
 * authentication rollout. See `Public()`'s own doc comment for why this
 * should stay the only such exemption.
 */
let HealthController = class HealthController {
    health;
    memory;
    database;
    constructor(health, memory, database) {
        this.health = health;
        this.memory = memory;
        this.database = database;
    }
    check() {
        return this.health.check([
            () => this.memory.checkHeap('memory_heap', HEAP_THRESHOLD_BYTES),
            () => this.memory.checkRSS('memory_rss', RSS_THRESHOLD_BYTES),
            () => this.database.isHealthy('database'),
        ]);
    }
};
exports.HealthController = HealthController;
tslib_1.__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, terminus_1.HealthCheck)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = tslib_1.__decorate([
    (0, common_1.Controller)({ path: 'health', version: common_1.VERSION_NEUTRAL }),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof terminus_1.HealthCheckService !== "undefined" && terminus_1.HealthCheckService) === "function" ? _a : Object, typeof (_b = typeof terminus_1.MemoryHealthIndicator !== "undefined" && terminus_1.MemoryHealthIndicator) === "function" ? _b : Object, typeof (_c = typeof database_health_indicator_1.DatabaseHealthIndicator !== "undefined" && database_health_indicator_1.DatabaseHealthIndicator) === "function" ? _c : Object])
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
//# sourceMappingURL=main.js.map