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
const people_module_1 = __webpack_require__(11);
const platform_module_1 = __webpack_require__(59);
/**
 * Root module. Bounded-context modules (Blueprint Ch.1 §4.2 module
 * inventory: PeopleModule, PastoralCareModule, MinistryModule,
 * GatheringsModule, StewardshipModule, InsightsModule, PlatformModule)
 * are registered in `imports` here as each is built.
 *
 * `PlatformModule` (Sprint 1.2) is the foundation: config, structured
 * logging, the `/health` endpoint, database, authentication, and the
 * workspace-wide exception filter. `PeopleModule` (People domain
 * milestone) is the first bounded-context module built on top of it -
 * see `apps/api/src/modules/people/PEOPLE_DESIGN_NOTES.md`. The
 * remaining five (Pastoral Care, Ministry, Gatherings, Stewardship,
 * Insights) are still unbuilt.
 */
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [platform_module_1.PlatformModule, people_module_1.PeopleModule],
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
exports.PeopleModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const database_module_1 = __webpack_require__(12);
const rbac_platform_module_1 = __webpack_require__(17);
const group_membership_controller_1 = __webpack_require__(19);
const person_controller_1 = __webpack_require__(47);
const role_assignment_controller_1 = __webpack_require__(56);
const group_membership_resource_context_guard_1 = __webpack_require__(36);
const person_resource_context_guard_1 = __webpack_require__(39);
const group_membership_repository_1 = __webpack_require__(46);
const person_repository_1 = __webpack_require__(38);
const role_assignment_repository_1 = __webpack_require__(58);
const group_membership_service_1 = __webpack_require__(40);
const person_service_1 = __webpack_require__(55);
const role_assignment_service_1 = __webpack_require__(57);
/**
 * PeopleModule (PRD §13.1 / Blueprint §4.2 module inventory) - the first
 * bounded-context module built on top of the Platform foundation (Sprint
 * 1.2), Database (Sprint 1.3), and Authentication (Sprint 1.4)
 * milestones. Internal layout follows Blueprint §6.4's per-bounded-context
 * structure (`controllers/`, `services/`, `repositories/`, `guards/`) -
 * with one deliberate deviation: no `dto/` folder. Blueprint §6.4's own
 * sketch shows `dto/` "import[ing] shared types from libs/contracts,
 * add[ing] Nest-specific validation decorators only where needed" - but
 * this codebase's actual contract strategy (`libs/contracts`' own README,
 * `apps/api/src/platform/pipes/zod-validation.pipe.ts`) is Zod schemas
 * consumed directly by `ZodValidationPipe`, with no class-validator
 * decorators anywhere in the codebase to add. A `dto/` folder here would
 * only re-export `libs/contracts` types under a different path, adding
 * indirection with no behavior - see `PEOPLE_DESIGN_NOTES.md`.
 */
let PeopleModule = class PeopleModule {
};
exports.PeopleModule = PeopleModule;
exports.PeopleModule = PeopleModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, rbac_platform_module_1.RbacPlatformModule],
        controllers: [person_controller_1.PersonController, group_membership_controller_1.GroupMembershipController, role_assignment_controller_1.RoleAssignmentController],
        providers: [
            person_repository_1.PersonRepository,
            group_membership_repository_1.GroupMembershipRepository,
            role_assignment_repository_1.RoleAssignmentRepository,
            person_service_1.PersonService,
            group_membership_service_1.GroupMembershipService,
            role_assignment_service_1.RoleAssignmentService,
            person_resource_context_guard_1.PersonResourceContextGuard,
            person_resource_context_guard_1.PersonCreateResourceContextGuard,
            group_membership_resource_context_guard_1.GroupMembershipResourceContextGuard,
        ],
    })
], PeopleModule);


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const database_health_indicator_1 = __webpack_require__(13);
const prisma_service_1 = __webpack_require__(15);
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
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseHealthIndicator = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const terminus_1 = __webpack_require__(14);
const prisma_service_1 = __webpack_require__(15);
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
/* 14 */
/***/ ((module) => {

module.exports = require("@nestjs/terminus");

/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const client_1 = __webpack_require__(16);
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
/* 16 */
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RbacPlatformModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const database_module_1 = __webpack_require__(12);
const branch_configuration_service_1 = __webpack_require__(18);
/**
 * Shared RBAC-supporting infrastructure (People domain milestone):
 * `BranchConfigurationService`, consumed by every domain module's own
 * `EcclesiaContextGuardBase` subclass (`ecclesia-context.guard-base.ts`).
 * Not `AuthModule` (Sprint 1.4, actor resolution) - this module is
 * downstream of authentication, upstream of every bounded-context
 * module's own authorization wiring.
 */
let RbacPlatformModule = class RbacPlatformModule {
};
exports.RbacPlatformModule = RbacPlatformModule;
exports.RbacPlatformModule = RbacPlatformModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        providers: [branch_configuration_service_1.BranchConfigurationService],
        exports: [branch_configuration_service_1.BranchConfigurationService],
    })
], RbacPlatformModule);


/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BranchConfigurationService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const nestjs_pino_1 = __webpack_require__(6);
const prisma_service_1 = __webpack_require__(15);
/**
 * Loads the `BranchConfiguration` shape `libs/rbac`'s `evaluate()` needs
 * (currently just `poimenGateEnabled`, PRD §24 OQ-02 / Blueprint §9.3)
 * from `platform.configurations` for a given Branch. This is
 * infrastructure any future bounded-context module will need identically
 * - not People-specific - which is why it lives in
 * `apps/api/src/platform/rbac/`, not `apps/api/src/modules/people/`.
 *
 * `libs/config` (Blueprint §6.2) is the library ultimately meant to own
 * "typed configuration loading," but it is still Sprint 0 scaffolding
 * with no defined contract for *how* a Prisma-backed load should be
 * shaped or where the database dependency should sit (see that library's
 * own README). Redesigning `libs/config`'s contract without evidence for
 * its exact intended shape would be scope creep beyond this milestone -
 * this service is deliberately built directly in `apps/api` for now, and
 * migrating it into `libs/config` is recommended as a follow-up, not done
 * here. See `PEOPLE_DESIGN_NOTES.md`.
 */
let BranchConfigurationService = class BranchConfigurationService {
    prisma;
    logger;
    constructor(prisma, logger) {
        this.prisma = prisma;
        this.logger = logger;
    }
    async loadForBranch(branchId) {
        const configuration = await this.prisma.configuration.findUnique({ where: { branchId } });
        if (!configuration) {
            // Not a citation - a reasonable, disclosed fail-safe default. PRD
            // §24 OQ-02's own resolution text says the Poimen gate defaults to
            // "soft-input (advisory)" (i.e. disabled) for a Branch that has not
            // explicitly configured it - a Branch with no `configurations` row
            // yet (e.g. freshly onboarded, before an Admin has visited the
            // configuration screen) is exactly that case, not an error.
            this.logger.warn({ branchId }, 'No platform.configurations row for this Branch - defaulting poimenGateEnabled to false (PRD §24 OQ-02 default)');
            return { poimenGateEnabled: false };
        }
        return { poimenGateEnabled: configuration.poimenGateEnabled };
    }
};
exports.BranchConfigurationService = BranchConfigurationService;
exports.BranchConfigurationService = BranchConfigurationService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(1, (0, nestjs_pino_1.InjectPinoLogger)(BranchConfigurationService.name)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof nestjs_pino_1.PinoLogger !== "undefined" && nestjs_pino_1.PinoLogger) === "function" ? _b : Object])
], BranchConfigurationService);


/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroupMembershipController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(20);
const contracts_1 = __webpack_require__(31);
const zod_validation_pipe_1 = __webpack_require__(35);
const group_membership_resource_context_guard_1 = __webpack_require__(36);
const group_membership_service_1 = __webpack_require__(40);
/**
 * PRD §17.3 "Bacenta/Basonta: reassign member" row. Also the entry point
 * for PRD §19.1 step 6 (opening a Bacenta membership for a Person in
 * `FOLLOW_UP` automatically advances their lifecycle stage) - see
 * `GroupMembershipService`.
 */
let GroupMembershipController = class GroupMembershipController {
    groupMembershipService;
    constructor(groupMembershipService) {
        this.groupMembershipService = groupMembershipService;
    }
    assign(personId, body) {
        return this.groupMembershipService.assign(personId, body);
    }
};
exports.GroupMembershipController = GroupMembershipController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, rbac_1.RequirePermission)('people.group_membership.update'),
    (0, common_1.UseGuards)(group_membership_resource_context_guard_1.GroupMembershipResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('personId')),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createGroupMembershipRequestSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], GroupMembershipController.prototype, "assign", null);
exports.GroupMembershipController = GroupMembershipController = tslib_1.__decorate([
    (0, common_1.Controller)('people/:personId/group-memberships'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof group_membership_service_1.GroupMembershipService !== "undefined" && group_membership_service_1.GroupMembershipService) === "function" ? _a : Object])
], GroupMembershipController);


/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(8);
// Types (PRD §17.2-17.4; Blueprint §9.1-9.3)
tslib_1.__exportStar(__webpack_require__(21), exports);
tslib_1.__exportStar(__webpack_require__(22), exports);
tslib_1.__exportStar(__webpack_require__(23), exports);
// The permission matrix as executable data (Blueprint §9.3)
tslib_1.__exportStar(__webpack_require__(24), exports);
// Record-level policy checks (Blueprint §9.1, §9.4)
tslib_1.__exportStar(__webpack_require__(25), exports);
// The authorization engine (Blueprint §9.2)
tslib_1.__exportStar(__webpack_require__(26), exports);
// NestJS integration (Blueprint §9.4)
tslib_1.__exportStar(__webpack_require__(27), exports);
tslib_1.__exportStar(__webpack_require__(28), exports);
tslib_1.__exportStar(__webpack_require__(29), exports);
tslib_1.__exportStar(__webpack_require__(30), exports);


/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ROLES = void 0;
exports.isRole = isRole;
/**
 * Role catalog (PRD §17.2). One entry per row of that table, plus
 * `ACTING_RESIDENT_PASTOR` (Blueprint §8.6): the succession runbook
 * models interim authority as an ordinary, time-bound Role Assignment
 * holding this role, not a new entity type - so it must exist here, in
 * the same catalog, rather than as special-cased logic elsewhere.
 *
 * `VISITOR` and `COUNCIL_OVERSEER` are included for completeness with
 * PRD §17.2 even though neither has any ALLOW rows in the §17.3 matrix
 * today (Visitor is typically unauthenticated; Council Overseer is a
 * Horizon 3 role) - omitting them here would make the catalog silently
 * incomplete relative to its cited source.
 */
exports.ROLES = [
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
function isRole(value) {
    return exports.ROLES.includes(value);
}


/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ACTIONS = void 0;
exports.isAction = isAction;
/**
 * Action taxonomy derived from the 18 domain/action rows of PRD §17.3.
 * Dot-namespaced as `<bounded context>.<resource>.<verb>`, matching the
 * two worked examples in Blueprint §9.3 (`stewardship.transaction.record`,
 * `people.role_assignment.grant_shepherd`) exactly, so the code these
 * examples describe and the code that actually exists agree.
 *
 * Where a single PRD row's cell contains multiple letters (e.g.
 * "R, U (Branch)"), each letter becomes its own action here - the
 * permission engine needs to express "this role may read but not update"
 * as two separate rules, not one rule with a compound effect.
 *
 * `people.role_assignment.grant_shepherd` is deliberately distinct from
 * the more general `people.role_assignment.grant`: it is the one action
 * in the whole matrix that carries a record-level policy check
 * (`POIMEN_GATE_IF_ENABLED`, PRD §24 OQ-02 resolution), so it cannot
 * share a rule with granting a Worker or Basonta Leader role, which
 * carry no such gate.
 */
exports.ACTIONS = [
    // Person (PRD §17.3 row: "Person: create/edit profile")
    'people.person.create',
    'people.person.read',
    'people.person.update',
    // Person (row: "Person: assign lifecycle stage")
    'people.person.lifecycle_stage.read',
    'people.person.lifecycle_stage.update',
    // Role Assignment (row: "Role Assignment: grant Shepherd/Worker/etc.")
    'people.role_assignment.grant_shepherd',
    'people.role_assignment.grant',
    'people.role_assignment.update',
    'people.role_assignment.read',
    // Bacenta/Basonta (row: "Bacenta/Basonta: reassign member")
    'people.group_membership.update',
    // Gathering (row: "Gathering: create/configure")
    'gatherings.gathering.create',
    'gatherings.gathering.update',
    'gatherings.gathering.read',
    // Attendance (row: "Attendance: record")
    'gatherings.attendance.create',
    'gatherings.attendance.read',
    // Financial Transaction (rows: record / verify / reconcile)
    'stewardship.transaction.record',
    'stewardship.transaction.verify',
    'stewardship.transaction.reconcile',
    'stewardship.transaction.read',
    // Expense (rows: request / approve)
    'stewardship.expense.request',
    'stewardship.expense.approve',
    // Follow-up task (row: "Follow-up task: create/assign")
    'pastoral_care.followup_task.create',
    'pastoral_care.followup_task.update',
    'pastoral_care.followup_task.read',
    // Pastoral notes (row: "Pastoral notes: view/create")
    'pastoral_care.notes.read',
    'pastoral_care.notes.create',
    // Insights (rows: Branch / cluster / own-Bacenta dashboards)
    'insights.branch_dashboard.read',
    'insights.cluster_dashboard.read',
    'insights.bacenta_dashboard.read',
    // Configuration (row: "Configuration: gathering/role/group types")
    'platform.configuration.create',
    'platform.configuration.update',
    'platform.configuration.read',
    // Audit log (row: "Audit log: view")
    'platform.audit_log.read',
];
function isAction(value) {
    return exports.ACTIONS.includes(value);
}


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PERMISSION_MATRIX = void 0;
/**
 * The PRD §17.3 permission matrix, transcribed exhaustively into
 * structured, version-controlled data (Blueprint §9.3): "the PRD table
 * and the enforced behavior share one source of truth in intent, even
 * though they physically live in two documents."
 *
 * Organized in the same row order as PRD §17.3 itself, one comment block
 * per row, so a reviewer can check this file against that table
 * cell-by-cell. Where a cell contains multiple letters (e.g. "R, U
 * (Branch)"), it becomes multiple rules here (Blueprint §9.3's own
 * `stewardship.transaction.verify`/`record` split is the precedent).
 * Cells marked "—" (not applicable) produce no rule at all - PRD §17.3's
 * legend is explicit that this is a different, weaker statement than an
 * "X" (explicit deny), and an absent rule is exactly how `evaluate()`
 * treats "not applicable": neither an ALLOW nor a DENY match.
 *
 * Where the PRD table gives a scope in parentheses, that scope is used
 * directly. Where it does not (a handful of cells, e.g. "Expense:
 * request"), the role's own defined scope of authority from PRD §17.2's
 * role catalog is used instead, and that inference is called out in the
 * rule's `reason`.
 */
const BASE_MATRIX = [
    // --- Person: create/edit profile ---------------------------------
    { role: 'RESIDENT_PASTOR', action: 'people.person.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'RESIDENT_PASTOR', action: 'people.person.update', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'people.person.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ASSISTANT_PASTOR', action: 'people.person.update', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'people.person.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BACENTA_LEADER', action: 'people.person.update', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'people.person.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    {
        role: 'TREASURER',
        action: 'people.person.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - name only, for transaction attribution',
    },
    { role: 'WORKER', action: 'people.person.read', effect: 'ALLOW', scope: 'SELF' },
    { role: 'MEMBER', action: 'people.person.read', effect: 'ALLOW', scope: 'SELF' },
    { role: 'MEMBER', action: 'people.person.update', effect: 'ALLOW', scope: 'SELF' },
    { role: 'ADMIN', action: 'people.person.create', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ADMIN', action: 'people.person.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ADMIN', action: 'people.person.update', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Person: assign lifecycle stage -------------------------------
    { role: 'RESIDENT_PASTOR', action: 'people.person.lifecycle_stage.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'people.person.lifecycle_stage.update',
        effect: 'ALLOW',
        scope: 'CLUSTER',
    },
    {
        role: 'BACENTA_LEADER',
        action: 'people.person.lifecycle_stage.update',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
    },
    { role: 'ADMIN', action: 'people.person.lifecycle_stage.update', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Role Assignment: grant Shepherd/Worker/etc. ------------------
    // The one row with a record-level policy check attached (Blueprint
    // §9.3's own worked example): granting the Shepherd (Bacenta Leader)
    // role is Poimen-gated per PRD §24 OQ-02's resolution; granting any
    // other role is not.
    {
        role: 'RESIDENT_PASTOR',
        action: 'people.role_assignment.grant_shepherd',
        effect: 'ALLOW',
        scope: 'BRANCH',
        recordLevelCheck: 'POIMEN_GATE_IF_ENABLED',
        reason: 'BR-PPL-06 / FR-PC-06 - Poimen gating is a per-Branch/Council configuration flag, not a fixed rule',
    },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'people.role_assignment.grant_shepherd',
        effect: 'ALLOW',
        scope: 'CLUSTER',
        recordLevelCheck: 'POIMEN_GATE_IF_ENABLED',
        reason: 'BR-PPL-06 / FR-PC-06 - same Poimen gate applies regardless of which senior role performs the grant',
    },
    { role: 'RESIDENT_PASTOR', action: 'people.role_assignment.grant', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'RESIDENT_PASTOR', action: 'people.role_assignment.update', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'people.role_assignment.grant', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ASSISTANT_PASTOR', action: 'people.role_assignment.update', effect: 'ALLOW', scope: 'CLUSTER' },
    {
        role: 'ADMIN',
        action: 'people.role_assignment.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - read only, no grant authority',
    },
    // --- Bacenta/Basonta: reassign member -----------------------------
    { role: 'RESIDENT_PASTOR', action: 'people.group_membership.update', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'people.group_membership.update', effect: 'ALLOW', scope: 'CLUSTER' },
    {
        role: 'BACENTA_LEADER',
        action: 'people.group_membership.update',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
        reason: 'PRD §17.3 - own Bacenta, own members only',
    },
    {
        role: 'BASONTA_LEADER',
        action: 'people.group_membership.update',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
    },
    {
        role: 'ADMIN',
        action: 'people.group_membership.update',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - admin correction only',
    },
    // --- Gathering: create/configure -----------------------------------
    { role: 'RESIDENT_PASTOR', action: 'gatherings.gathering.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'gatherings.gathering.create', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ASSISTANT_PASTOR', action: 'gatherings.gathering.update', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'gatherings.gathering.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BACENTA_LEADER', action: 'gatherings.gathering.update', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'gatherings.gathering.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'gatherings.gathering.update', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'ADMIN', action: 'gatherings.gathering.create', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ADMIN', action: 'gatherings.gathering.update', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Attendance: record ---------------------------------------------
    { role: 'RESIDENT_PASTOR', action: 'gatherings.attendance.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'gatherings.attendance.create',
        effect: 'ALLOW',
        scope: 'CLUSTER',
        reason: 'PRD §17.3 - any Gathering within their cluster',
    },
    { role: 'BACENTA_LEADER', action: 'gatherings.attendance.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'gatherings.attendance.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    {
        role: 'ADMIN',
        action: 'gatherings.attendance.create',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - support cases only',
    },
    // --- Financial Transaction: record ("Recorded") --------------------
    // BR-STW-01: pastors never handle cash, regardless of any other
    // privilege they hold - this is the canonical explicit-deny example
    // PRD §17.3's "Reading note" and Blueprint §9.1 both call out by name.
    {
        role: 'RESIDENT_PASTOR',
        action: 'stewardship.transaction.record',
        effect: 'DENY',
        reason: 'Pastors do not handle cash (PRD BR-STW-01)',
    },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'stewardship.transaction.record',
        effect: 'DENY',
        reason: 'PRD BR-STW-01',
    },
    {
        role: 'BACENTA_LEADER',
        action: 'stewardship.transaction.record',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
        reason: "PRD §17.3 - own Bacenta's offerings",
    },
    {
        role: 'TREASURER',
        action: 'stewardship.transaction.record',
        effect: 'ALLOW',
        scope: 'SELF',
        reason: 'PRD §17.3 - individual Mobile Money entries only (Horizon 2)',
    },
    {
        role: 'MEMBER',
        action: 'stewardship.transaction.record',
        effect: 'ALLOW',
        scope: 'SELF',
        reason: 'PRD §17.3 - own Mobile Money giving only (Horizon 2)',
    },
    // --- Financial Transaction: verify ("Verified") ---------------------
    { role: 'RESIDENT_PASTOR', action: 'stewardship.transaction.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'stewardship.transaction.read', effect: 'ALLOW', scope: 'CLUSTER' },
    {
        role: 'BACENTA_LEADER',
        action: 'stewardship.transaction.verify',
        effect: 'DENY',
        reason: 'PRD §17.3 / BR-STW-04 - a role that can record must never verify, even another group’s entries',
    },
    {
        role: 'TREASURER',
        action: 'stewardship.transaction.verify',
        effect: 'ALLOW',
        scope: 'BRANCH',
        recordLevelCheck: 'DIFFERENT_ACTOR_THAN_RECORDER',
        reason: 'PRD §17.4 / BR-STW-04 - not the same actor who recorded this transaction',
    },
    // --- Financial Transaction: reconcile --------------------------------
    {
        role: 'TREASURER',
        action: 'stewardship.transaction.reconcile',
        effect: 'ALLOW',
        scope: 'BRANCH',
    },
    // --- Expense: request -------------------------------------------------
    // PRD §17.3 gives no explicit scope for this row; each role's own
    // defined scope of authority (§17.2) is used.
    { role: 'RESIDENT_PASTOR', action: 'stewardship.expense.request', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'stewardship.expense.request', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'stewardship.expense.request', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'stewardship.expense.request', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'TREASURER', action: 'stewardship.expense.request', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Expense: approve --------------------------------------------------
    { role: 'RESIDENT_PASTOR', action: 'stewardship.expense.approve', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'stewardship.expense.approve',
        effect: 'ALLOW',
        scope: 'CLUSTER',
        reason: 'PRD §17.3 - only if delegated by the Resident Pastor',
    },
    // --- Follow-up task: create/assign --------------------------------------
    { role: 'RESIDENT_PASTOR', action: 'pastoral_care.followup_task.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'RESIDENT_PASTOR', action: 'pastoral_care.followup_task.update', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'pastoral_care.followup_task.create',
        effect: 'ALLOW',
        scope: 'CLUSTER',
    },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'pastoral_care.followup_task.update',
        effect: 'ALLOW',
        scope: 'CLUSTER',
    },
    {
        role: 'BACENTA_LEADER',
        action: 'pastoral_care.followup_task.create',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
    },
    {
        role: 'BACENTA_LEADER',
        action: 'pastoral_care.followup_task.update',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
    },
    { role: 'ADMIN', action: 'pastoral_care.followup_task.read', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Pastoral notes: view/create ------------------------------------------
    {
        role: 'RESIDENT_PASTOR',
        action: 'pastoral_care.notes.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - sensitive; Branch-wide',
    },
    { role: 'RESIDENT_PASTOR', action: 'pastoral_care.notes.create', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.notes.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.notes.create', effect: 'ALLOW', scope: 'CLUSTER' },
    {
        role: 'BACENTA_LEADER',
        action: 'pastoral_care.notes.read',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
        reason: 'PRD §17.3 - own Bacenta only',
    },
    { role: 'BACENTA_LEADER', action: 'pastoral_care.notes.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    {
        // Verbatim from Blueprint §9.3's own worked example.
        role: 'ADMIN',
        action: 'pastoral_care.notes.read',
        effect: 'DENY',
        reason: 'NFR-PRIV-01 - configuration authority does not imply pastoral-content access',
    },
    {
        role: 'ADMIN',
        action: 'pastoral_care.notes.create',
        effect: 'DENY',
        reason: 'NFR-PRIV-01 - configuration authority does not imply pastoral-content access',
    },
    // --- Insights: Branch-level dashboard ---------------------------------------
    { role: 'RESIDENT_PASTOR', action: 'insights.branch_dashboard.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'insights.branch_dashboard.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - summary only',
    },
    { role: 'ADMIN', action: 'insights.branch_dashboard.read', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Insights: cluster-level dashboard ---------------------------------------
    { role: 'RESIDENT_PASTOR', action: 'insights.cluster_dashboard.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'insights.cluster_dashboard.read',
        effect: 'ALLOW',
        scope: 'CLUSTER',
        reason: 'PRD §17.3 - own cluster',
    },
    // --- Insights: own-Bacenta dashboard ---------------------------------------
    {
        role: 'RESIDENT_PASTOR',
        action: 'insights.bacenta_dashboard.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - drill-down',
    },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'insights.bacenta_dashboard.read',
        effect: 'ALLOW',
        scope: 'CLUSTER',
        reason: 'PRD §17.3 - drill-down, own cluster',
    },
    { role: 'BACENTA_LEADER', action: 'insights.bacenta_dashboard.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    // --- Configuration: gathering/role/group types ---------------------------------
    { role: 'RESIDENT_PASTOR', action: 'platform.configuration.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'platform.configuration.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ADMIN', action: 'platform.configuration.create', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ADMIN', action: 'platform.configuration.update', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Audit log: view -------------------------------------------------------------
    { role: 'RESIDENT_PASTOR', action: 'platform.audit_log.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'platform.audit_log.read',
        effect: 'ALLOW',
        scope: 'CLUSTER',
        reason: 'PRD §17.3 - cluster-relevant entries',
    },
    {
        role: 'BACENTA_LEADER',
        action: 'platform.audit_log.read',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
        reason: 'PRD §17.3 - own-Bacenta-relevant entries',
    },
    {
        role: 'TREASURER',
        action: 'platform.audit_log.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - Stewardship entries only',
    },
    {
        role: 'ADMIN',
        action: 'platform.audit_log.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - full',
    },
];
/**
 * Blueprint §8.6: interim authority during a Resident Pastor succession
 * is an ordinary, time-bound Role Assignment holding a distinct
 * `ACTING_RESIDENT_PASTOR` role - deliberately reusing the Role
 * Assignment mechanism rather than inventing succession-specific data
 * structures or permission logic. Its authority is identical to
 * `RESIDENT_PASTOR`'s for the duration of the assignment, so its rules
 * are generated from that role's rules rather than hand-duplicated,
 * which would risk the two silently drifting apart.
 */
const ACTING_RESIDENT_PASTOR_RULES = BASE_MATRIX.filter((rule) => rule.role === 'RESIDENT_PASTOR').map((rule) => ({
    ...rule,
    role: 'ACTING_RESIDENT_PASTOR',
    reason: rule.reason
        ? `${rule.reason} (interim authority, Blueprint §8.6)`
        : 'Interim Resident Pastor authority (Blueprint §8.6)',
}));
exports.PERMISSION_MATRIX = [...BASE_MATRIX, ...ACTING_RESIDENT_PASTOR_RULES];


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RECORD_LEVEL_CHECKS = void 0;
/**
 * BR-STW-04 / PRD §17.4: the Person who verifies a Financial Transaction
 * must not be the same Person who recorded it - evaluated per-record,
 * because a static role check cannot see who acted on this specific
 * transaction (Blueprint §9.1's stated reason a pure-RBAC model is
 * insufficient here).
 */
const differentActorThanRecorder = (actor, resource) => {
    if (!resource.recordedByPersonId) {
        return {
            passed: false,
            reason: 'DIFFERENT_ACTOR_THAN_RECORDER: resource has no recordedByPersonId to compare against',
        };
    }
    const passed = actor.personId !== resource.recordedByPersonId;
    return {
        passed,
        reason: passed
            ? 'PRD §17.4 / BR-STW-04: verifying actor differs from the recording actor'
            : 'PRD §17.4 / BR-STW-04: the same Person recorded and is attempting to verify this transaction',
    };
};
/**
 * Resolved PRD §24 OQ-02: whether incomplete Poimen training blocks a
 * Shepherd (Bacenta Leader) Role Assignment is itself a per-Branch/
 * Council configuration flag, not a fixed rule (Blueprint §9.3). When
 * the flag is off, Poimen status is advisory-only and this check always
 * passes; when on, it additionally requires the candidate's enrollment
 * to be COMPLETE.
 */
const poimenGateIfEnabled = (_actor, resource, branchConfig) => {
    if (!branchConfig.poimenGateEnabled) {
        return {
            passed: true,
            reason: 'POIMEN_GATE_IF_ENABLED: gate disabled for this Branch - Poimen status is advisory-only',
        };
    }
    const passed = resource.candidatePoimenStatus === 'COMPLETE';
    return {
        passed,
        reason: passed
            ? "POIMEN_GATE_IF_ENABLED: gate enabled and candidate's Poimen enrollment is COMPLETE"
            : "POIMEN_GATE_IF_ENABLED: gate enabled and candidate's Poimen enrollment is not COMPLETE",
    };
};
/**
 * Registry mapping a `RecordLevelCheckId` (as referenced from
 * `permission-matrix.ts`) to its implementation. Adding a new
 * record-level rule means writing one function and one entry here, per
 * Blueprint §9.4's explicit design goal - not a new guard class.
 */
exports.RECORD_LEVEL_CHECKS = {
    DIFFERENT_ACTOR_THAN_RECORDER: differentActorThanRecorder,
    POIMEN_GATE_IF_ENABLED: poimenGateIfEnabled,
};


/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.evaluateRoleAndScope = evaluateRoleAndScope;
exports.evaluateRecordLevelCheck = evaluateRecordLevelCheck;
exports.evaluate = evaluate;
const record_level_checks_1 = __webpack_require__(25);
/**
 * Does `resource` fall within the scope granted by `scope`, for this
 * `actor`? Blueprint §9.2, step "Resource falls within that Role
 * Assignment's scope - own Bacenta/cluster/Branch?".
 *
 * OWN_GROUP matches either a led Bacenta or a led Basonta: a single
 * `Scope` value covers both because PRD §17.2 gives Bacenta Leader and
 * Basonta Leader the same *shape* of authority (their own single group),
 * just over different group types - modeling them as two scope values
 * would duplicate every OWN_GROUP rule in the matrix for no semantic gain.
 */
function resourceInScope(scope, actor, resource) {
    switch (scope) {
        case 'GLOBAL':
            return true;
        case 'SELF':
            return resource.ownerId !== undefined && resource.ownerId === actor.personId;
        case 'OWN_GROUP':
            return ((actor.bacentaId !== undefined && resource.bacentaId === actor.bacentaId) ||
                (actor.basontaId !== undefined && resource.basontaId === actor.basontaId));
        case 'CLUSTER':
            return actor.clusterId !== undefined && resource.clusterId === actor.clusterId;
        case 'BRANCH':
            return resource.branchId === actor.branchId;
    }
}
/**
 * Steps 1-3 of Blueprint §9.2's flow: explicit deny, role grant, and
 * scope. Stops *before* any record-level check, which is deliberately a
 * separate function (`evaluateRecordLevelCheck` below) so the two can be
 * run as two independent NestJS guards (`RbacGuard`,
 * `RecordLevelPolicyGuard`, Blueprint §9.4) without either needing to
 * re-derive work the other already did.
 */
function evaluateRoleAndScope(actor, action, resource, matrix) {
    const rulesForCell = matrix.filter((rule) => rule.role === actor.role && rule.action === action);
    const explicitDeny = rulesForCell.find((rule) => rule.effect === 'DENY');
    if (explicitDeny) {
        return {
            effect: 'DENY',
            matchedRule: explicitDeny,
            reason: explicitDeny.reason ?? 'Explicit deny rule matched',
        };
    }
    const allowRule = rulesForCell.find((rule) => rule.effect === 'ALLOW');
    if (!allowRule) {
        return {
            effect: 'DENY',
            reason: `No Role Assignment grants '${action}' to role '${actor.role}'`,
        };
    }
    if (allowRule.scope && !resourceInScope(allowRule.scope, actor, resource)) {
        return {
            effect: 'DENY',
            matchedRule: allowRule,
            reason: `Resource is outside the actor's ${allowRule.scope} scope for '${action}'`,
        };
    }
    return {
        effect: 'ALLOW',
        matchedRule: allowRule,
        reason: allowRule.reason ?? `Role '${actor.role}' is granted '${action}' at scope '${allowRule.scope}'`,
    };
}
/**
 * Step 4 of Blueprint §9.2's flow, given a rule that `evaluateRoleAndScope`
 * already matched as an ALLOW. If that rule names no `recordLevelCheck`,
 * there is nothing further to evaluate and this simply confirms the
 * existing decision.
 */
function evaluateRecordLevelCheck(decision, actor, resource, branchConfig) {
    if (decision.effect === 'DENY' || !decision.matchedRule?.recordLevelCheck) {
        return decision;
    }
    const check = record_level_checks_1.RECORD_LEVEL_CHECKS[decision.matchedRule.recordLevelCheck];
    const result = check(actor, resource, branchConfig);
    return {
        effect: result.passed ? 'ALLOW' : 'DENY',
        matchedRule: decision.matchedRule,
        reason: result.reason,
    };
}
/**
 * The full authorization engine (Blueprint §9.2), composing the two
 * steps above in one call: explicit deny -> role grant -> scope ->
 * record-level check -> ALLOW. This is what the executable specification
 * (`permission-matrix.spec.ts`, Blueprint §9.5) calls directly, and what
 * any service-layer code should call for an imperative check outside the
 * HTTP guard pipeline (`RbacGuard` and `RecordLevelPolicyGuard` are thin
 * adapters around these same two functions for the guard pipeline).
 */
function evaluate(actor, action, resource, branchConfig, matrix) {
    const roleAndScope = evaluateRoleAndScope(actor, action, resource, matrix);
    return evaluateRecordLevelCheck(roleAndScope, actor, resource, branchConfig);
}


/***/ }),
/* 27 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ECCLESIA_RBAC_DECISION_KEY = exports.ECCLESIA_REQUEST_CONTEXT_KEY = void 0;
/** Property name the guards read this context from on the HTTP request. */
exports.ECCLESIA_REQUEST_CONTEXT_KEY = 'ecclesiaContext';
/**
 * Property name `RbacGuard` writes its role/scope decision to, so that
 * `RecordLevelPolicyGuard` (running second in the guard chain, per
 * Blueprint §9.4's `@UseGuards(RbacGuard, RecordLevelPolicyGuard)`
 * ordering) can finish evaluating the same matched rule instead of
 * re-deriving it from scratch.
 */
exports.ECCLESIA_RBAC_DECISION_KEY = 'ecclesiaRbacDecision';


/***/ }),
/* 28 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RequirePermission = exports.REQUIRE_PERMISSION_KEY = void 0;
// NestJS decorators call Reflect.defineMetadata at decoration time (not
// just at DI-resolution time), so the reflect-metadata polyfill must be
// loaded before this module's decorators run. apps/api's main.ts already
// imports it first for the running application; this import makes the
// same true when this file is loaded standalone (e.g. under Jest).
__webpack_require__(1);
const common_1 = __webpack_require__(2);
/** Metadata key `RbacGuard` reads via `Reflector` (Blueprint §9.4). */
exports.REQUIRE_PERMISSION_KEY = 'ecclesia:requirePermission';
/**
 * Declares which `Action` (from PRD §17.3's matrix) a controller method
 * requires. Usage matches Blueprint §9.4 exactly:
 *
 * ```ts
 * @RequirePermission('stewardship.transaction.verify')
 * @UseGuards(RbacGuard, RecordLevelPolicyGuard)
 * async verifyTransaction(...) { ... }
 * ```
 */
const RequirePermission = (action) => (0, common_1.SetMetadata)(exports.REQUIRE_PERMISSION_KEY, action);
exports.RequirePermission = RequirePermission;


/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RbacGuard = void 0;
const tslib_1 = __webpack_require__(8);
__webpack_require__(1);
const common_1 = __webpack_require__(2);
const core_1 = __webpack_require__(3);
const require_permission_decorator_1 = __webpack_require__(28);
const evaluate_1 = __webpack_require__(26);
const permission_matrix_1 = __webpack_require__(24);
const request_context_1 = __webpack_require__(27);
/**
 * Generic, shared guard evaluating role + scope (Blueprint §9.2 steps
 * 1-3) against the `@RequirePermission`-declared action. One guard for
 * all seven bounded contexts, living in `libs/rbac` - not duplicated per
 * module (Blueprint §9.4's explicit design goal).
 *
 * Expects an upstream piece (authentication middleware, Sprint 1.4; a
 * resource-loading interceptor, per-module) to have already attached an
 * `EcclesiaRequestContext` to the request. That does not exist yet -
 * this guard is the consumer-side contract for it, not its
 * implementation.
 */
let RbacGuard = class RbacGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const action = this.reflector.get(require_permission_decorator_1.REQUIRE_PERMISSION_KEY, context.getHandler());
        if (!action) {
            throw new common_1.ForbiddenException('No permission requirement declared for this endpoint (missing @RequirePermission)');
        }
        const request = context.switchToHttp().getRequest();
        const ecclesiaContext = request[request_context_1.ECCLESIA_REQUEST_CONTEXT_KEY];
        if (!ecclesiaContext) {
            throw new common_1.ForbiddenException('No authenticated actor context available for authorization');
        }
        const decision = (0, evaluate_1.evaluateRoleAndScope)(ecclesiaContext.actor, action, ecclesiaContext.resource, permission_matrix_1.PERMISSION_MATRIX);
        request[request_context_1.ECCLESIA_RBAC_DECISION_KEY] = decision;
        if (decision.effect === 'DENY') {
            throw new common_1.ForbiddenException(decision.reason);
        }
        return true;
    }
};
exports.RbacGuard = RbacGuard;
exports.RbacGuard = RbacGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _a : Object])
], RbacGuard);


/***/ }),
/* 30 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RecordLevelPolicyGuard = void 0;
const tslib_1 = __webpack_require__(8);
__webpack_require__(1);
const common_1 = __webpack_require__(2);
const evaluate_1 = __webpack_require__(26);
const request_context_1 = __webpack_require__(27);
/**
 * Generic, shared guard evaluating Blueprint §9.2 step 4 (the
 * record-level policy check, if the matched rule names one). Must run
 * *after* `RbacGuard` in the same `@UseGuards(...)` list (Blueprint
 * §9.4's exact ordering) - it consumes the decision `RbacGuard` already
 * attached to the request rather than re-deriving it.
 *
 * A rule with no `recordLevelCheck` simply passes through unchanged, so
 * this guard is safe to include even on endpoints that turn out not to
 * need one - though Blueprint §9.4's example only shows it where a check
 * is actually named.
 */
let RecordLevelPolicyGuard = class RecordLevelPolicyGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const ecclesiaContext = request[request_context_1.ECCLESIA_REQUEST_CONTEXT_KEY];
        const priorDecision = request[request_context_1.ECCLESIA_RBAC_DECISION_KEY];
        if (!ecclesiaContext || !priorDecision) {
            throw new common_1.ForbiddenException('RecordLevelPolicyGuard requires RbacGuard to run first on the same route (missing prior decision)');
        }
        const finalDecision = (0, evaluate_1.evaluateRecordLevelCheck)(priorDecision, ecclesiaContext.actor, ecclesiaContext.resource, ecclesiaContext.branchConfig);
        request[request_context_1.ECCLESIA_RBAC_DECISION_KEY] = finalDecision;
        if (finalDecision.effect === 'DENY') {
            throw new common_1.ForbiddenException(finalDecision.reason);
        }
        return true;
    }
};
exports.RecordLevelPolicyGuard = RecordLevelPolicyGuard;
exports.RecordLevelPolicyGuard = RecordLevelPolicyGuard = tslib_1.__decorate([
    (0, common_1.Injectable)()
], RecordLevelPolicyGuard);


/***/ }),
/* 31 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(8);
tslib_1.__exportStar(__webpack_require__(32), exports);
tslib_1.__exportStar(__webpack_require__(33), exports);


/***/ }),
/* 32 */
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
/* 33 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.groupMembershipResponseSchema = exports.roleAssignmentResponseSchema = exports.createRoleAssignmentRequestSchema = exports.createGroupMembershipRequestSchema = exports.lifecycleTransitionRequestSchema = exports.duplicateCandidateResponseSchema = exports.personResponseSchema = exports.updatePersonSchema = exports.createPersonSchema = exports.roleSchema = exports.ROLE_VALUES = exports.lifecycleStageSchema = exports.LIFECYCLE_STAGE_VALUES = void 0;
const zod_1 = __webpack_require__(34);
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
/* 34 */
/***/ ((module) => {

module.exports = require("zod");

/***/ }),
/* 35 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ZodValidationPipe = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
// Value import, not `import type` - `schema` is a constructor parameter
// property (`private readonly schema: ZodSchema`) on an `@Injectable()`
// class. With `emitDecoratorMetadata` on (tsconfig.base.json), TypeScript
// needs a real runtime reference here, the same reasoning that keeps
// `Reflector` a value import in `libs/rbac`'s guards.
const zod_1 = __webpack_require__(34);
/**
 * Per-route validation pipe for the Zod schemas defined in
 * `libs/contracts` (Blueprint §6.3). This is the Zod equivalent of Nest's
 * built-in `ValidationPipe` - deliberately not a drop-in replacement for
 * it, because that pipe is built around class-validator decorators, and
 * this codebase's DTO strategy is Zod schemas, not decorated classes (see
 * `libs/contracts/src/lib/contracts.ts`). Running both validation
 * libraries side by side would mean two competing sources of truth for
 * "what is a valid request" - engineering-principles.md §3, Architecture
 * Before Convenience.
 *
 * Usage, once a real contract schema exists (first real usage lands with
 * the People domain):
 *
 * ```ts
 * @Post()
 * create(@Body(new ZodValidationPipe(createPersonSchema)) body: CreatePersonInput) { ... }
 * ```
 *
 * There is no workspace-wide `app.useGlobalPipes(new ZodValidationPipe(...))`
 * registration, because a single global pipe cannot know which schema
 * applies to which route - each route supplies its own schema at the
 * `@Body()`/`@Query()`/`@Param()` call site instead, same as Nest's own
 * examples show for schema-based (as opposed to class-based) validation.
 */
let ZodValidationPipe = class ZodValidationPipe {
    schema;
    constructor(schema) {
        this.schema = schema;
    }
    transform(value) {
        const result = this.schema.safeParse(value);
        if (!result.success) {
            throw new common_1.BadRequestException({
                message: 'Validation failed',
                issues: result.error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            });
        }
        return result.data;
    }
};
exports.ZodValidationPipe = ZodValidationPipe;
exports.ZodValidationPipe = ZodValidationPipe = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof zod_1.ZodSchema !== "undefined" && zod_1.ZodSchema) === "function" ? _a : Object])
], ZodValidationPipe);


/***/ }),
/* 36 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroupMembershipResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(37);
const person_repository_1 = __webpack_require__(38);
const person_resource_context_guard_1 = __webpack_require__(39);
/**
 * `POST /v1/people/:personId/group-memberships` - PRD §17.3's
 * "Bacenta/Basonta: reassign member" row (`people.group_membership.update`).
 * The resource being scoped is the *Person's current membership state*
 * (their existing Bacenta, if any) - the same resolution
 * `PersonResourceContextGuard` already does, reused via
 * `loadPersonResourceContext` rather than duplicated.
 */
let GroupMembershipResourceContextGuard = class GroupMembershipResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    personRepository;
    constructor(branchConfigurationService, personRepository) {
        super(branchConfigurationService);
        this.personRepository = personRepository;
    }
    loadResource(request, actor) {
        const personId = request.params.personId;
        return (0, person_resource_context_guard_1.loadPersonResourceContext)(this.personRepository, actor, personId);
    }
};
exports.GroupMembershipResourceContextGuard = GroupMembershipResourceContextGuard;
exports.GroupMembershipResourceContextGuard = GroupMembershipResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof person_repository_1.PersonRepository !== "undefined" && person_repository_1.PersonRepository) === "function" ? _b : Object])
], GroupMembershipResourceContextGuard);


/***/ }),
/* 37 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EcclesiaContextGuardBase = void 0;
const tslib_1 = __webpack_require__(8);
__webpack_require__(1);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(20);
const branch_configuration_service_1 = __webpack_require__(18);
/**
 * Populates the `resource`/`branchConfig` half of `EcclesiaRequestContext`
 * that `libs/rbac/src/lib/request-context.ts` explicitly names as "each
 * domain module['s]" job, once its own `actor` half exists
 * (`request.actorContext`, Sprint 1.4's global `AuthGuard`). Neither
 * Blueprint nor PRD specify a mechanism for this - `request-context.ts`
 * only states the contract, not an implementation - so this base class is
 * an inferred design decision, not a citation. It exists so every future
 * bounded-context module solves this exactly once (subclass + implement
 * `loadResource`), rather than each domain module reinventing how to
 * assemble `EcclesiaRequestContext` from scratch.
 *
 * **Ordering, and why this must be a Guard, not an Interceptor.** NestJS
 * runs all Guards before any Interceptor for a given request. `RbacGuard`
 * (`libs/rbac`) is itself a Guard and requires
 * `request[ECCLESIA_REQUEST_CONTEXT_KEY]` to already exist when it runs
 * (see its own doc comment). An Interceptor running "before" the handler
 * would still run *after* `RbacGuard`, too late. Concrete subclasses are
 * therefore used as `@UseGuards(SomeResourceContextGuard, RbacGuard,
 * RecordLevelPolicyGuard)` - always first in that list.
 *
 * Requires `AuthGuard` (the global `APP_GUARD`) to have already attached
 * `request.actorContext` - true for every route by construction, since
 * `APP_GUARD` providers run before any controller-level `@UseGuards(...)`
 * guard in Nest's guard-resolution order.
 */
let EcclesiaContextGuardBase = class EcclesiaContextGuardBase {
    branchConfigurationService;
    constructor(branchConfigurationService) {
        this.branchConfigurationService = branchConfigurationService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const actor = request.actorContext;
        if (!actor) {
            // Should be unreachable in practice (AuthGuard is a global APP_GUARD
            // and runs first) - defensive, not a documented failure mode.
            throw new common_1.ForbiddenException('No authenticated actor context available - AuthGuard must run first');
        }
        const resource = await this.loadResource(request, actor);
        const branchConfig = await this.branchConfigurationService.loadForBranch(resource.branchId);
        const ecclesiaContext = { actor, resource, branchConfig };
        request[rbac_1.ECCLESIA_REQUEST_CONTEXT_KEY] = ecclesiaContext;
        return true;
    }
};
exports.EcclesiaContextGuardBase = EcclesiaContextGuardBase;
exports.EcclesiaContextGuardBase = EcclesiaContextGuardBase = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object])
], EcclesiaContextGuardBase);


/***/ }),
/* 38 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PersonRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/**
 * Prisma-backed persistence for `people.persons`, schema-scoped per
 * Blueprint §6.4/§7.2 - this module's repository layer only ever queries
 * its own bounded context's tables directly.
 *
 * Every Branch-scoped query below filters explicitly by `branchId` in
 * application code. This is deliberate, not merely a stopgap: Blueprint
 * §7.3 states Row-Level Security is "a BACKSTOP under application-layer
 * filtering ... not a replacement for it," and the RLS session variable
 * (`app.current_branch_id`) is not wired anywhere yet (`db/DESIGN_NOTES.md`
 * Open Question #3, restated in `PEOPLE_DESIGN_NOTES.md`) - so today,
 * this explicit filtering *is* the only enforcement, not merely the
 * primary one.
 */
let PersonRepository = class PersonRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.person.create({ data: input });
    }
    findById(id) {
        return this.prisma.person.findUnique({ where: { id } });
    }
    update(id, input) {
        return this.prisma.person.update({ where: { id }, data: input });
    }
    updateLifecycleStage(id, lifecycleStage) {
        // `lifecycleStage` arrives as a plain string (already validated against
        // `libs/domain/people`'s `LifecycleStage` union by the caller) - cast
        // to Prisma's generated `LifecycleStage` enum type, which is the same
        // literal string set (PRD §12.5), rather than to `never`, so this
        // still catches a genuine Prisma/PRD enum drift at compile time.
        return this.prisma.person.update({
            where: { id },
            data: { lifecycleStage: lifecycleStage },
        });
    }
    /**
     * FR-PPL-02's candidate set: same Branch, same (case-insensitive) last
     * name - a deliberately loose pre-filter, since the actual match
     * decision (`libs/domain/people`'s `findDuplicateCandidates`) still
     * requires phone or Bacenta+age agreement on top of this.
     */
    async findDuplicateCandidateSet(branchId, lastName) {
        const persons = await this.prisma.person.findMany({
            where: { branchId, lastName: { equals: lastName, mode: 'insensitive' } },
            include: {
                groupMemberships: {
                    where: { groupType: 'PASTORAL_CARE', endedAt: null },
                    select: { groupId: true },
                    take: 1,
                },
            },
        });
        return persons.map((person) => ({
            id: person.id,
            firstName: person.firstName,
            lastName: person.lastName,
            phone: person.phone,
            dateOfBirth: person.dateOfBirth,
            activeBacentaGroupId: person.groupMemberships[0]?.groupId ?? null,
        }));
    }
    async findActiveGroupMemberships(personId) {
        const memberships = await this.prisma.groupMembership.findMany({
            where: { personId, endedAt: null },
            select: { id: true, groupId: true, groupType: true },
        });
        return memberships.map((m) => ({ id: m.id, groupId: m.groupId, groupType: m.groupType }));
    }
};
exports.PersonRepository = PersonRepository;
exports.PersonRepository = PersonRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], PersonRepository);


/***/ }),
/* 39 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PersonCreateResourceContextGuard = exports.PersonResourceContextGuard = void 0;
exports.loadPersonResourceContext = loadPersonResourceContext;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(37);
const person_repository_1 = __webpack_require__(38);
/**
 * Loads the `ResourceContext` for a route acting on an existing Person
 * (`GET/PATCH /v1/people/:id`, `POST /v1/people/:id/lifecycle-transitions`).
 * See `EcclesiaContextGuardBase`'s doc comment for why this must be a
 * Guard, not an Interceptor.
 *
 * **`basontaId` is resolved from the actor's perspective, not the
 * Person's.** PRD §17.2: "A Person may lead more than one Basonta," and a
 * Person being read/updated may likewise hold several concurrent active
 * Basonta memberships (BR-PPL-02) - but `libs/rbac`'s `ResourceContext`
 * only has room for one `basontaId` to compare against the acting
 * Basonta Leader's own `actor.basontaId`. Rather than picking an
 * arbitrary one of the Person's several Basontas (which could produce a
 * wrong ALLOW or a wrong DENY depending on which one got picked), this
 * guard checks whether the *specific* Basonta the actor leads is among
 * the Person's active memberships and only then reports that one as
 * `resource.basontaId` - the correct answer for `resourceInScope`'s
 * single-value equality check, computed using information (the actor)
 * only this guard has access to at resource-load time. This is a design
 * choice, not a citation - see `PEOPLE_DESIGN_NOTES.md`.
 */
/**
 * Shared by `PersonResourceContextGuard` and the Group Membership /
 * Role Assignment modules' own resource-context guards - every one of
 * them targets "the Person identified by a route param" and needs the
 * identical `bacentaId`/`basontaId` resolution described above, just
 * from a different param name (`:id` vs `:personId`).
 */
async function loadPersonResourceContext(personRepository, actor, personId) {
    const person = await personRepository.findById(personId);
    if (!person) {
        throw new common_1.NotFoundException(`No Person found with id '${personId}'`);
    }
    const activeMemberships = await personRepository.findActiveGroupMemberships(personId);
    const bacentaMembership = activeMemberships.find((m) => m.groupType === 'PASTORAL_CARE');
    const actorLedBasontaMembership = actor.basontaId !== undefined
        ? activeMemberships.find((m) => m.groupType === 'MINISTRY' && m.groupId === actor.basontaId)
        : undefined;
    return {
        branchId: person.branchId,
        ownerId: person.id,
        bacentaId: bacentaMembership?.groupId,
        basontaId: actorLedBasontaMembership?.groupId,
    };
}
let PersonResourceContextGuard = class PersonResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    personRepository;
    constructor(branchConfigurationService, personRepository) {
        super(branchConfigurationService);
        this.personRepository = personRepository;
    }
    loadResource(request, actor) {
        const id = request.params.id;
        return loadPersonResourceContext(this.personRepository, actor, id);
    }
};
exports.PersonResourceContextGuard = PersonResourceContextGuard;
exports.PersonResourceContextGuard = PersonResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof person_repository_1.PersonRepository !== "undefined" && person_repository_1.PersonRepository) === "function" ? _b : Object])
], PersonResourceContextGuard);
/**
 * `POST /v1/people` has no `:id` to load - PRD §17.3's `people.person.create`
 * row grants only ADMIN, at BRANCH scope, so the resource is trivially
 * "the actor's own Branch." No database read is needed.
 */
let PersonCreateResourceContextGuard = class PersonCreateResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    constructor(branchConfigurationService) {
        super(branchConfigurationService);
    }
    async loadResource(_request, actor) {
        return { branchId: actor.branchId };
    }
};
exports.PersonCreateResourceContextGuard = PersonCreateResourceContextGuard;
exports.PersonCreateResourceContextGuard = PersonCreateResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_c = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _c : Object])
], PersonCreateResourceContextGuard);


/***/ }),
/* 40 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroupMembershipService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const domain_people_1 = __webpack_require__(41);
const group_membership_repository_1 = __webpack_require__(46);
const person_repository_1 = __webpack_require__(38);
function toResponseDto(membership) {
    return {
        id: membership.id,
        personId: membership.personId,
        groupId: membership.groupId,
        groupType: membership.groupType,
        startedAt: membership.startedAt.toISOString(),
        endedAt: membership.endedAt ? membership.endedAt.toISOString() : null,
        reason: membership.reason,
    };
}
/**
 * BR-PPL-01/02, FR-PPL-04/05, and PRD §19.1 step 6's automatic
 * lifecycle-stage side effect. See `libs/domain/people/group-membership-rules.ts`
 * for the pure cardinality decision this class orchestrates against real
 * data.
 */
let GroupMembershipService = class GroupMembershipService {
    groupMembershipRepository;
    personRepository;
    constructor(groupMembershipRepository, personRepository) {
        this.groupMembershipRepository = groupMembershipRepository;
        this.personRepository = personRepository;
    }
    async assign(personId, input) {
        const person = await this.personRepository.findById(personId);
        if (!person) {
            throw new common_1.NotFoundException(`No Person found with id '${personId}'`);
        }
        const group = await this.groupMembershipRepository.findGroupById(input.groupId);
        if (!group) {
            throw new common_1.NotFoundException(`No Group found with id '${input.groupId}'`);
        }
        const activeMemberships = await this.personRepository.findActiveGroupMemberships(personId);
        const plan = (() => {
            try {
                return (0, domain_people_1.planGroupMembershipChange)(group.id, group.type, activeMemberships);
            }
            catch (error) {
                throw new common_1.ConflictException(error instanceof Error ? error.message : 'Invalid group membership change');
            }
        })();
        if (plan.reasonRequiredForClose && !input.reason) {
            throw new common_1.BadRequestException('A reason is required when this assignment closes an existing active Bacenta membership (PRD §16.1 reassignment surface)');
        }
        // PRD §19.1 step 6: opening a Bacenta membership for a Person
        // currently in FOLLOW_UP automatically advances lifecycle_stage to
        // ASSIGNED_TO_BACENTA, atomically with the membership write. Any
        // other lifecycle stage (e.g. a Member being reassigned - "moved
        // house") is left untouched, per PRD §12.5's edge-case table.
        const personLifecycleStageUpdate = group.type === 'PASTORAL_CARE' && person.lifecycleStage === 'FOLLOW_UP' ? 'ASSIGNED_TO_BACENTA' : undefined;
        const membership = await this.groupMembershipRepository.applyChange({
            branchId: person.branchId,
            personId,
            groupId: group.id,
            groupType: group.type,
            membershipIdsToClose: plan.membershipIdsToClose,
            reason: input.reason,
            personLifecycleStageUpdate,
        });
        return toResponseDto(membership);
    }
};
exports.GroupMembershipService = GroupMembershipService;
exports.GroupMembershipService = GroupMembershipService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof group_membership_repository_1.GroupMembershipRepository !== "undefined" && group_membership_repository_1.GroupMembershipRepository) === "function" ? _a : Object, typeof (_b = typeof person_repository_1.PersonRepository !== "undefined" && person_repository_1.PersonRepository) === "function" ? _b : Object])
], GroupMembershipService);


/***/ }),
/* 41 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(8);
tslib_1.__exportStar(__webpack_require__(42), exports);
tslib_1.__exportStar(__webpack_require__(43), exports);
tslib_1.__exportStar(__webpack_require__(44), exports);
tslib_1.__exportStar(__webpack_require__(45), exports);


/***/ }),
/* 42 */
/***/ ((__unused_webpack_module, exports) => {


/**
 * The Member Journey lifecycle-stage state machine (PRD §12.5, BR-PPL-03,
 * FR-PPL-03). "A transition not shown is, by default, disallowed and must
 * be explicitly rejected by the system, not silently permitted" (PRD
 * §12.1) - this module is the literal enforcement of that sentence.
 *
 * The seven states and every edge below are transcribed exactly from PRD
 * §12.5's `stateDiagram-v2` (including the two edge-case rows in that
 * section's table, which the diagram itself already encodes as ordinary
 * transitions - `Lapsed -> FollowUp` and `SixWeeksParticipation ->
 * AssignedToBacenta`). `[*] -> Visitor` (the diagram's start pseudostate)
 * is the only way a Person's lifecycle stage comes into existence, at
 * `Person` creation (FR-PPL-01) - it is not modeled as a *transition*
 * here, since there is no prior stage to transition from.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LIFECYCLE_STAGES = void 0;
exports.isLifecycleStage = isLifecycleStage;
exports.checkLifecycleTransition = checkLifecycleTransition;
exports.requiresGroupMembershipToTransition = requiresGroupMembershipToTransition;
/** Mirrors `db/schema.prisma`'s `LifecycleStage` enum exactly. Duplicated
 * rather than imported because `libs/domain/people` may depend only on
 * `libs/contracts` (Blueprint §6.2/§6.4) and Prisma's generated client is
 * an `apps/api`-layer concern - see this library's README. */
exports.LIFECYCLE_STAGES = [
    'VISITOR',
    'FIRST_TIME_GUEST',
    'FOLLOW_UP',
    'LAPSED',
    'ASSIGNED_TO_BACENTA',
    'SIX_WEEKS_PARTICIPATION',
    'MEMBER',
];
function isLifecycleStage(value) {
    return exports.LIFECYCLE_STAGES.includes(value);
}
/**
 * PRD §12.5's `stateDiagram-v2`, edge-for-edge:
 *
 * ```
 * Visitor -> FirstTimeGuest
 * FirstTimeGuest -> FollowUp
 * FollowUp -> AssignedToBacenta
 * FollowUp -> Lapsed
 * Lapsed -> FollowUp
 * AssignedToBacenta -> SixWeeksParticipation
 * SixWeeksParticipation -> Member
 * SixWeeksParticipation -> AssignedToBacenta
 * ```
 *
 * `Member` has no outbound edges ("terminates at Member", BR-PPL-03) -
 * per the Design Note in PRD §12.5, becoming a Worker/Shepherd/Assistant
 * Pastor/Resident Pastor/Treasurer is a Role Assignment layered on top of
 * the terminal `Member` stage, never a further `lifecycle_stage` value.
 */
const TRANSITIONS = {
    VISITOR: ['FIRST_TIME_GUEST'],
    FIRST_TIME_GUEST: ['FOLLOW_UP'],
    FOLLOW_UP: ['ASSIGNED_TO_BACENTA', 'LAPSED'],
    LAPSED: ['FOLLOW_UP'],
    ASSIGNED_TO_BACENTA: ['SIX_WEEKS_PARTICIPATION'],
    SIX_WEEKS_PARTICIPATION: ['MEMBER', 'ASSIGNED_TO_BACENTA'],
    MEMBER: [],
};
/**
 * FR-PPL-03's literal acceptance criterion: "An attempt to set
 * lifecycle_stage directly from Visitor to Member (skipping intermediate
 * stages) is rejected by the system with an explicit error, not silently
 * accepted." Every caller mutating `lifecycle_stage` must go through this
 * check - see `libs/domain/people/README.md`.
 */
function checkLifecycleTransition(from, to) {
    if (from === to) {
        return { allowed: false, reason: `'${from}' is already the current lifecycle stage; not a transition` };
    }
    const allowedNext = TRANSITIONS[from];
    if (!allowedNext.includes(to)) {
        return {
            allowed: false,
            reason: `PRD §12.5 / BR-PPL-03: '${from}' -> '${to}' is not a modeled transition (allowed: ${allowedNext.length > 0 ? allowedNext.join(', ') : 'none - terminal stage'})`,
        };
    }
    return { allowed: true, reason: `PRD §12.5: '${from}' -> '${to}' is a modeled transition` };
}
/**
 * `FOLLOW_UP -> ASSIGNED_TO_BACENTA` is deliberately excluded from the
 * plain lifecycle-transition endpoint (`apps/api`'s
 * `PersonLifecycleController`) - PRD §19.1 Workflow step 6 describes this
 * specific transition as inseparable from opening the `GROUP_MEMBERSHIP`
 * record ("system transitions lifecycle_stage to AssignedToBacenta and
 * opens a GROUP_MEMBERSHIP record"), not two independent actions. The
 * People module's `GroupMembershipService` performs this transition
 * itself, atomically with creating the membership, when it applies. This
 * function tells API-layer callers when that redirection applies.
 */
function requiresGroupMembershipToTransition(from, to) {
    return from === 'FOLLOW_UP' && to === 'ASSIGNED_TO_BACENTA';
}


/***/ }),
/* 43 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isGatedRole = isGatedRole;
exports.checkRoleAssignmentEligibility = checkRoleAssignmentEligibility;
/**
 * BR-PPL-04 / FR-PPL-06: certain Role Assignments may only be held by a
 * Person whose current `lifecycle_stage` is `MEMBER` (PRD §12.5's Design
 * Note: "Worker," "Shepherd," "Assistant Pastor," "Resident Pastor," and
 * "Treasurer" are responsibilities layered on top of the terminal
 * lifecycle stage of Member, not further stages).
 *
 * **Which roles are gated - a real discrepancy between the two citing
 * requirements, resolved here in favor of the fuller list.** BR-PPL-04's
 * own prose lists five roles (Worker, Shepherd, Assistant Pastor,
 * Resident Pastor, Treasurer) and omits Basonta Leader. But BR-PPL-04's
 * own "Enforcement point" column names FR-PPL-06 as where this is
 * enforced, and FR-PPL-06's requirement text explicitly includes
 * "Basonta Leader" in its parenthetical list. Since BR-PPL-04 designates
 * FR-PPL-06 as its own enforcement point, FR-PPL-06's fuller six-role
 * list is treated as authoritative here rather than BR-PPL-04's own
 * shorter prose restatement - this is documents disagreeing with
 * themselves in a way worth flagging, not a silent pick.
 */
const GATED_ROLES = [
    'WORKER',
    'BACENTA_LEADER',
    'BASONTA_LEADER',
    'ASSISTANT_PASTOR',
    'RESIDENT_PASTOR',
    'TREASURER',
    // [INFERRED, not a direct citation] Blueprint §8.6 models
    // ACTING_RESIDENT_PASTOR as reusing the Resident Pastor Role Assignment
    // mechanism with "identical authority... for the duration of the
    // assignment" - extended here by the same reasoning
    // `permission-matrix.ts` already applies (generating its rules from
    // RESIDENT_PASTOR's rules rather than hand-duplicating). Neither
    // document states this eligibility gate explicitly for the acting role.
    'ACTING_RESIDENT_PASTOR',
];
function isGatedRole(role) {
    return GATED_ROLES.includes(role);
}
/**
 * `role` and `lifecycleStage` are typed as plain strings, not imported
 * enum types - this library depends only on `libs/contracts` (Blueprint
 * §6.2/§6.4), and both the full `Role` catalog (`libs/rbac`) and
 * `LifecycleStage` (this library's own `lifecycle-stage.ts`) already
 * exist as the canonical types call sites should narrow with before
 * calling this function.
 */
function checkRoleAssignmentEligibility(role, lifecycleStage) {
    if (!isGatedRole(role)) {
        return {
            eligible: true,
            reason: `'${role}' is not one of the lifecycle-stage-gated roles (BR-PPL-04/FR-PPL-06); no precondition applies`,
        };
    }
    if (lifecycleStage !== 'MEMBER') {
        return {
            eligible: false,
            reason: `BR-PPL-04/FR-PPL-06: '${role}' requires the Person's lifecycle_stage to be MEMBER (currently '${lifecycleStage}')`,
        };
    }
    return { eligible: true, reason: `BR-PPL-04/FR-PPL-06: lifecycle_stage is MEMBER, precondition satisfied` };
}


/***/ }),
/* 44 */
/***/ ((__unused_webpack_module, exports) => {


/**
 * Bacenta (`PASTORAL_CARE`) / Basonta (`MINISTRY`) membership cardinality
 * invariants - PRD §12.6's comparison table, BR-PPL-01, BR-PPL-02,
 * FR-PPL-04, FR-PPL-05. Pure decision logic only: given the Person's
 * *currently active* memberships (as loaded by the caller) and the type
 * of Group being joined, decide which existing membership(s), if any,
 * must be closed. Persisting that decision (closing rows, inserting the
 * new one, in one transaction) is `apps/api`'s
 * `GroupMembershipService`'s job - this function has no database access,
 * per this library's framework-agnostic boundary (Blueprint §6.2/§6.4).
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.planGroupMembershipChange = planGroupMembershipChange;
/**
 * BR-PPL-01 / FR-PPL-04: "exactly one active GROUP_MEMBERSHIP of type
 * PASTORAL_CARE per Person at any time, automatically closing the prior
 * membership when a new one is opened." Already joined to the *same*
 * Bacenta is rejected outright (not a reassignment, not a no-op the
 * caller should be able to trigger silently).
 *
 * BR-PPL-02 / FR-PPL-05: "zero or more concurrent active GROUP_MEMBERSHIP
 * records of type MINISTRY per Person" - joining another Basonta never
 * closes any existing one, and joining a Basonta the Person already
 * actively belongs to is rejected as a duplicate, not silently accepted
 * or silently closed-and-reopened.
 */
function planGroupMembershipChange(targetGroupId, targetGroupType, activeMemberships) {
    const alreadyActiveInTargetGroup = activeMemberships.some((m) => m.groupId === targetGroupId);
    if (alreadyActiveInTargetGroup) {
        throw new Error(`Person already holds an active ${targetGroupType} membership in group '${targetGroupId}' - not a valid reassignment or duplicate join`);
    }
    if (targetGroupType === 'MINISTRY') {
        // BR-PPL-02: unconstrained - never closes any existing Basonta
        // membership, regardless of how many the Person already holds.
        return { membershipIdsToClose: [], reasonRequiredForClose: false };
    }
    // targetGroupType === 'PASTORAL_CARE': BR-PPL-01's single-active-Bacenta
    // invariant. There can be at most one active PASTORAL_CARE membership
    // already (the same invariant this function enforces, plus the
    // database's own `one_active_bacenta_per_person` partial unique index
    // as a backstop - Blueprint §7.5) - `.filter(...)` rather than assuming
    // exactly 0 or 1 defensively covers a data-integrity violation upstream
    // without this function crashing on it.
    const existingBacentaMemberships = activeMemberships.filter((m) => m.groupType === 'PASTORAL_CARE');
    return {
        membershipIdsToClose: existingBacentaMemberships.map((m) => m.id),
        reasonRequiredForClose: existingBacentaMemberships.length > 0,
    };
}


/***/ }),
/* 45 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.findDuplicateCandidates = findDuplicateCandidates;
/**
 * FR-PPL-02: "detect likely duplicate Person records (matching name +
 * phone number, or name + Bacenta + approximate age) and require explicit
 * merge or reject action by an authorized role before two records can
 * coexist silently." Pure matching logic only - `apps/api`'s
 * `PersonService` is responsible for fetching a plausible candidate set
 * from Postgres (this function does not query anything) and for the
 * "require explicit merge or reject action" half (Open Question below).
 *
 * **Provisional threshold, same discipline as PRD §15.8's silent-drift
 * N=3/M=3 placeholder.** FR-PPL-02's rule text says "approximate age"
 * without a number. There is no leadership-calibration session for this
 * threshold documented anywhere in either source document (unlike
 * silent-drift, which PRD FR-PC-05 explicitly says ships with a
 * provisional N=3/M=3 "pending one live calibration session"). `AGE_TOLERANCE_YEARS`
 * below is therefore an engineering placeholder, not a cited value -
 * flagged in `PEOPLE_DESIGN_NOTES.md` as needing the same kind of
 * calibration FR-PC-05 already got.
 */
const AGE_TOLERANCE_YEARS = 2;
function normalizeName(value) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
function ageInYears(dateOfBirth, asOf) {
    let age = asOf.getFullYear() - dateOfBirth.getFullYear();
    const hadBirthdayThisYear = asOf.getMonth() > dateOfBirth.getMonth() ||
        (asOf.getMonth() === dateOfBirth.getMonth() && asOf.getDate() >= dateOfBirth.getDate());
    if (!hadBirthdayThisYear)
        age -= 1;
    return age;
}
/**
 * `candidates` should already be a narrowed, plausible set (e.g. the
 * caller's repository query filters by `lastName` or Branch before
 * calling this) - this function does the FR-PPL-02 matching decision,
 * not candidate retrieval, keeping it framework/database-agnostic per
 * this library's boundary rules.
 */
function findDuplicateCandidates(newPerson, candidates, now = new Date()) {
    const newNameKey = `${normalizeName(newPerson.firstName)} ${normalizeName(newPerson.lastName)}`;
    const matches = [];
    for (const candidate of candidates) {
        const candidateNameKey = `${normalizeName(candidate.firstName)} ${normalizeName(candidate.lastName)}`;
        if (candidateNameKey !== newNameKey)
            continue;
        if (newPerson.phone && candidate.phone && newPerson.phone === candidate.phone) {
            matches.push({
                candidateId: candidate.id,
                matchedOn: 'NAME_AND_PHONE',
                reason: 'FR-PPL-02: matching name and phone number',
            });
            continue;
        }
        if (newPerson.activeBacentaGroupId &&
            candidate.activeBacentaGroupId &&
            newPerson.activeBacentaGroupId === candidate.activeBacentaGroupId &&
            newPerson.dateOfBirth &&
            candidate.dateOfBirth) {
            const ageDiff = Math.abs(ageInYears(newPerson.dateOfBirth, now) - ageInYears(candidate.dateOfBirth, now));
            if (ageDiff <= AGE_TOLERANCE_YEARS) {
                matches.push({
                    candidateId: candidate.id,
                    matchedOn: 'NAME_AND_BACENTA_AND_APPROXIMATE_AGE',
                    reason: `FR-PPL-02: matching name, same Bacenta, approximate age (within ${AGE_TOLERANCE_YEARS} years - provisional threshold, see PEOPLE_DESIGN_NOTES.md)`,
                });
            }
        }
    }
    return matches;
}


/***/ }),
/* 46 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroupMembershipRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/**
 * Prisma-backed persistence for `people.groups` / `people.group_memberships`
 * (Blueprint §6.4/§7.2). See `PersonRepository`'s doc comment for why
 * every query below filters explicitly by `branchId` rather than relying
 * on Row-Level Security alone.
 */
let GroupMembershipRepository = class GroupMembershipRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findGroupById(groupId) {
        return this.prisma.group.findUnique({ where: { id: groupId } });
    }
    /**
     * BR-PPL-01/FR-PPL-04: closing the prior active Bacenta membership and
     * opening the new one happen in one transaction, so a failure partway
     * through never leaves a Person with zero *or* two active Bacenta
     * memberships. `db/schema.prisma`'s `one_active_bacenta_per_person`
     * partial unique index (Blueprint §7.5) is the database-level backstop
     * if this invariant is ever violated by a bug elsewhere.
     */
    async applyChange(input) {
        const now = new Date();
        return this.prisma.$transaction(async (tx) => {
            if (input.membershipIdsToClose.length > 0) {
                await tx.groupMembership.updateMany({
                    where: { id: { in: input.membershipIdsToClose } },
                    data: { endedAt: now, reason: input.reason },
                });
            }
            const membership = await tx.groupMembership.create({
                data: {
                    branchId: input.branchId,
                    personId: input.personId,
                    groupId: input.groupId,
                    groupType: input.groupType,
                    startedAt: now,
                },
            });
            if (input.personLifecycleStageUpdate) {
                await tx.person.update({
                    where: { id: input.personId },
                    data: { lifecycleStage: input.personLifecycleStageUpdate },
                });
            }
            return membership;
        });
    }
};
exports.GroupMembershipRepository = GroupMembershipRepository;
exports.GroupMembershipRepository = GroupMembershipRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], GroupMembershipRepository);


/***/ }),
/* 47 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PersonController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(20);
const contracts_1 = __webpack_require__(31);
const current_actor_decorator_1 = __webpack_require__(48);
const zod_validation_pipe_1 = __webpack_require__(35);
const person_resource_context_guard_1 = __webpack_require__(39);
const person_service_1 = __webpack_require__(55);
/**
 * PRD §17.3's "Person: create/edit profile" and "Person: assign
 * lifecycle stage" rows. Every route pairs a resource-context guard
 * (loads `ResourceContext`, this module's own inferred design - see
 * `PersonResourceContextGuard`'s doc comment) with `RbacGuard`
 * (`libs/rbac`, Blueprint §9.4's declarative pipeline) - `@RequirePermission`
 * names the exact PRD §17.3 action each route enforces.
 */
let PersonController = class PersonController {
    personService;
    constructor(personService) {
        this.personService = personService;
    }
    create(actor, body) {
        return this.personService.create(actor, body);
    }
    getById(id) {
        return this.personService.getById(id);
    }
    update(id, body) {
        return this.personService.update(id, body);
    }
    /**
     * FR-PPL-03. Deliberately `people.person.lifecycle_stage.update`, not a
     * bespoke action - PRD §17.3's matrix names exactly one action for
     * "assign lifecycle stage," regardless of which specific transition is
     * requested; validity of the specific transition is a business-rule
     * concern (`PersonService`, `libs/domain/people`), not an authorization
     * one.
     */
    transitionLifecycleStage(id, body) {
        return this.personService.transitionLifecycleStage(id, body);
    }
};
exports.PersonController = PersonController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, rbac_1.RequirePermission)('people.person.create'),
    (0, common_1.UseGuards)(person_resource_context_guard_1.PersonCreateResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createPersonSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], PersonController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_1.RequirePermission)('people.person.read'),
    (0, common_1.UseGuards)(person_resource_context_guard_1.PersonResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], PersonController.prototype, "getById", null);
tslib_1.__decorate([
    (0, common_1.Patch)(':id'),
    (0, rbac_1.RequirePermission)('people.person.update'),
    (0, common_1.UseGuards)(person_resource_context_guard_1.PersonResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.updatePersonSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], PersonController.prototype, "update", null);
tslib_1.__decorate([
    (0, common_1.Post)(':id/lifecycle-transitions'),
    (0, rbac_1.RequirePermission)('people.person.lifecycle_stage.update'),
    (0, common_1.UseGuards)(person_resource_context_guard_1.PersonResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.lifecycleTransitionRequestSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], PersonController.prototype, "transitionLifecycleStage", null);
exports.PersonController = PersonController = tslib_1.__decorate([
    (0, common_1.Controller)('people'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof person_service_1.PersonService !== "undefined" && person_service_1.PersonService) === "function" ? _a : Object])
], PersonController);


/***/ }),
/* 48 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CurrentActor = void 0;
exports.extractCurrentActor = extractCurrentActor;
// See public.decorator.ts's comment on why this import must come first.
__webpack_require__(1);
const common_1 = __webpack_require__(2);
const auth_guard_1 = __webpack_require__(49);
/**
 * The factory `createParamDecorator` wraps below, exported separately so
 * it can be unit-tested directly rather than only indirectly through a
 * full controller/e2e test - `createParamDecorator`'s own return value
 * isn't itself callable in a test the way a plain function is.
 *
 * Throws rather than returning `undefined` if used on a route where
 * `AuthGuard` didn't run - a controller method reaching for
 * `@CurrentActor()` is asserting authentication already happened, and
 * silently returning `undefined` would turn a missing-guard bug into a
 * confusing downstream null-reference instead of a clear error at the
 * point of the actual mistake.
 */
function extractCurrentActor(_data, context) {
    const request = context.switchToHttp().getRequest();
    const actor = request[auth_guard_1.ACTOR_CONTEXT_KEY];
    if (!actor) {
        throw new common_1.InternalServerErrorException('@CurrentActor() used on a route with no AuthGuard-populated actor context - is AuthGuard applied?');
    }
    return actor;
}
/** Controller-facing accessor for the `ActorContext` `AuthGuard` attached to the request (Sprint 1.4). */
exports.CurrentActor = (0, common_1.createParamDecorator)(extractCurrentActor);


/***/ }),
/* 49 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthGuard = exports.ACTOR_CONTEXT_KEY = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const core_1 = __webpack_require__(3);
const audit_log_service_1 = __webpack_require__(50);
const actor_context_resolver_service_1 = __webpack_require__(51);
const cognito_verifier_service_1 = __webpack_require__(52);
const public_decorator_1 = __webpack_require__(54);
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
/* 50 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuditLogService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
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
/* 51 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ActorContextResolverService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const nestjs_pino_1 = __webpack_require__(6);
const prisma_service_1 = __webpack_require__(15);
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
/* 52 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CognitoVerifierService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(4);
const aws_jwt_verify_1 = __webpack_require__(53);
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
/* 53 */
/***/ ((module) => {

module.exports = require("aws-jwt-verify");

/***/ }),
/* 54 */
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
/* 55 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PersonService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const domain_people_1 = __webpack_require__(41);
const person_repository_1 = __webpack_require__(38);
function toResponseDto(person) {
    return {
        id: person.id,
        branchId: person.branchId,
        firstName: person.firstName,
        lastName: person.lastName,
        phone: person.phone,
        email: person.email,
        dateOfBirth: person.dateOfBirth ? person.dateOfBirth.toISOString().slice(0, 10) : null,
        address: person.address,
        lifecycleStage: person.lifecycleStage,
        guardianPersonId: person.guardianPersonId,
        createdAt: person.createdAt.toISOString(),
        updatedAt: person.updatedAt.toISOString(),
    };
}
/**
 * Orchestrates the People module's Person use cases (Blueprint §6.4:
 * "Orchestrates use cases; calls into libs/domain/[bounded context] for
 * rules"). Authorization (who may call these methods, for which
 * resource) is already decided by the time these methods run - by
 * `PersonResourceContextGuard` + `RbacGuard` at the HTTP layer (see
 * `people.module.ts`) - this class only enforces the People domain's own
 * business rules (state machine validity, duplicate detection).
 */
let PersonService = class PersonService {
    personRepository;
    constructor(personRepository) {
        this.personRepository = personRepository;
    }
    /**
     * FR-PPL-01 (create) + FR-PPL-02 (duplicate detection "on every
     * creation"). A found, unacknowledged duplicate candidate set is a 409,
     * not a silently-created second record - see `people.schemas.ts`'s
     * `overrideDuplicateCheck` doc comment for the resubmission contract.
     */
    async create(actor, input) {
        if (!input.overrideDuplicateCheck) {
            const candidates = await this.personRepository.findDuplicateCandidateSet(actor.branchId, input.lastName);
            const matches = (0, domain_people_1.findDuplicateCandidates)({
                firstName: input.firstName,
                lastName: input.lastName,
                phone: input.phone ?? null,
                // No Bacenta assignment happens at Person creation in this
                // module's API surface (assignment is a separate step, PRD
                // §19.1 step 6) - FR-PPL-02's "name + Bacenta + approximate
                // age" rule cannot fire here as a result; only name+phone can.
                // See PEOPLE_DESIGN_NOTES.md.
                activeBacentaGroupId: null,
            }, candidates);
            if (matches.length > 0) {
                throw new common_1.ConflictException({
                    message: 'FR-PPL-02: likely duplicate Person record(s) found. Resubmit with overrideDuplicateCheck=true to create anyway.',
                    candidates: matches,
                });
            }
        }
        const person = await this.personRepository.create({
            branchId: actor.branchId,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            email: input.email,
            dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
            address: input.address,
            guardianPersonId: input.guardianPersonId,
        });
        return toResponseDto(person);
    }
    async getById(id) {
        const person = await this.personRepository.findById(id);
        if (!person) {
            throw new common_1.NotFoundException(`No Person found with id '${id}'`);
        }
        return toResponseDto(person);
    }
    /**
     * Existence is already guaranteed on the real HTTP path by
     * `PersonResourceContextGuard` (which must load the Person to build
     * `ResourceContext` before `RbacGuard` runs) - the explicit check here
     * is defense in depth, so this method is also correct when called
     * directly (not just via that guard chain), rather than surfacing a raw
     * Prisma "record not found" error as an unhandled 500.
     */
    async update(id, input) {
        const existing = await this.personRepository.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`No Person found with id '${id}'`);
        }
        const person = await this.personRepository.update(id, {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            email: input.email,
            dateOfBirth: input.dateOfBirth === undefined ? undefined : input.dateOfBirth ? new Date(input.dateOfBirth) : null,
            address: input.address,
            guardianPersonId: input.guardianPersonId,
        });
        return toResponseDto(person);
    }
    /**
     * FR-PPL-03: enforces PRD §12.5's state machine before writing.
     * `FOLLOW_UP -> ASSIGNED_TO_BACENTA` is deliberately rejected here (see
     * `requiresGroupMembershipToTransition`'s doc comment) and must go
     * through `GroupMembershipService` instead, which performs both halves
     * of PRD §19.1 step 6 atomically.
     */
    async transitionLifecycleStage(id, input) {
        const existing = await this.personRepository.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`No Person found with id '${id}'`);
        }
        if ((0, domain_people_1.requiresGroupMembershipToTransition)(existing.lifecycleStage, input.toStage)) {
            throw new common_1.ConflictException(`PRD §19.1 step 6: '${existing.lifecycleStage}' -> '${input.toStage}' only happens together with opening a ` +
                "GROUP_MEMBERSHIP - use POST /v1/people/:id/group-memberships instead of this endpoint.");
        }
        const check = (0, domain_people_1.checkLifecycleTransition)(existing.lifecycleStage, input.toStage);
        if (!check.allowed) {
            throw new common_1.ConflictException(check.reason);
        }
        const updated = await this.personRepository.updateLifecycleStage(id, input.toStage);
        return toResponseDto(updated);
    }
};
exports.PersonService = PersonService;
exports.PersonService = PersonService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof person_repository_1.PersonRepository !== "undefined" && person_repository_1.PersonRepository) === "function" ? _a : Object])
], PersonService);


/***/ }),
/* 56 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RoleAssignmentController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const contracts_1 = __webpack_require__(31);
const current_actor_decorator_1 = __webpack_require__(48);
const zod_validation_pipe_1 = __webpack_require__(35);
const role_assignment_service_1 = __webpack_require__(57);
/**
 * PRD §17.3 "Role Assignment: grant Shepherd/Worker/etc." row.
 * Deliberately carries no `@RequirePermission`/`RbacGuard` - see
 * `RoleAssignmentService`'s doc comment for why the declarative pipeline
 * cannot express this endpoint's data-dependent action selection
 * (`grant` vs. `grant_shepherd`), and why `evaluate()` is called
 * imperatively inside the service instead. `AuthGuard` (Sprint 1.4's
 * global `APP_GUARD`) still runs and still populates
 * `request.actorContext` regardless - this route is unauthenticated by
 * no guard, only un-declaratively-authorized.
 */
let RoleAssignmentController = class RoleAssignmentController {
    roleAssignmentService;
    constructor(roleAssignmentService) {
        this.roleAssignmentService = roleAssignmentService;
    }
    grant(actor, personId, body) {
        return this.roleAssignmentService.grant(actor, personId, body);
    }
};
exports.RoleAssignmentController = RoleAssignmentController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Param)('personId')),
    tslib_1.__param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createRoleAssignmentRequestSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], RoleAssignmentController.prototype, "grant", null);
exports.RoleAssignmentController = RoleAssignmentController = tslib_1.__decorate([
    (0, common_1.Controller)('people/:personId/role-assignments'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof role_assignment_service_1.RoleAssignmentService !== "undefined" && role_assignment_service_1.RoleAssignmentService) === "function" ? _a : Object])
], RoleAssignmentController);


/***/ }),
/* 57 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RoleAssignmentService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const domain_people_1 = __webpack_require__(41);
const rbac_1 = __webpack_require__(20);
const branch_configuration_service_1 = __webpack_require__(18);
const person_repository_1 = __webpack_require__(38);
const role_assignment_repository_1 = __webpack_require__(58);
function toResponseDto(assignment) {
    return {
        id: assignment.id,
        personId: assignment.personId,
        role: assignment.role,
        branchId: assignment.branchId,
        groupId: assignment.groupId,
        scopeGroupIds: assignment.scopeGroupIds,
        effectiveFrom: assignment.effectiveFrom.toISOString(),
        effectiveTo: assignment.effectiveTo ? assignment.effectiveTo.toISOString() : null,
    };
}
/**
 * PRD §17.3 "Role Assignment: grant Shepherd/Worker/etc." row.
 *
 * **Why this service calls `evaluate()` directly instead of relying on
 * the declarative `@RequirePermission` + `RbacGuard` pipeline every other
 * People endpoint uses.** The matrix names *two different actions* on
 * what is, from the client's point of view, one endpoint:
 * `people.role_assignment.grant_shepherd` (Poimen-gated,
 * `POIMEN_GATE_IF_ENABLED`) when the role being granted is
 * `BACENTA_LEADER`, and the ungated `people.role_assignment.grant` for
 * every other role. `@RequirePermission` is a static, decoration-time
 * value - it cannot see `request.body.role` to pick between the two.
 * Declaring the endpoint as `people.role_assignment.grant` and stopping
 * there would silently skip the Poimen gate for every Shepherd grant, a
 * real correctness bug, not a stylistic shortcut. `evaluate.ts`'s own doc
 * comment names this exact escape hatch: "what any service-layer code
 * should call for an imperative check outside the HTTP guard pipeline" -
 * this is that sanctioned case, not an invented workaround. See
 * `PEOPLE_DESIGN_NOTES.md`.
 */
let RoleAssignmentService = class RoleAssignmentService {
    roleAssignmentRepository;
    personRepository;
    branchConfigurationService;
    constructor(roleAssignmentRepository, personRepository, branchConfigurationService) {
        this.roleAssignmentRepository = roleAssignmentRepository;
        this.personRepository = personRepository;
        this.branchConfigurationService = branchConfigurationService;
    }
    async grant(actor, personId, input) {
        const person = await this.personRepository.findById(personId);
        if (!person) {
            throw new common_1.NotFoundException(`No Person found with id '${personId}'`);
        }
        // BR-PPL-04/FR-PPL-06 - a business-rule precondition on the
        // *candidate*, independent of whether the *granting actor* is
        // authorized (checked next). Both must pass.
        const eligibility = (0, domain_people_1.checkRoleAssignmentEligibility)(input.role, person.lifecycleStage);
        if (!eligibility.eligible) {
            throw new common_1.ConflictException(eligibility.reason);
        }
        const action = input.role === 'BACENTA_LEADER' ? 'people.role_assignment.grant_shepherd' : 'people.role_assignment.grant';
        const resource = {
            branchId: person.branchId,
            candidatePersonId: person.id,
        };
        if (input.role === 'BACENTA_LEADER') {
            resource.candidatePoimenStatus = await this.roleAssignmentRepository.findPoimenStatus(person.id);
        }
        const branchConfig = await this.branchConfigurationService.loadForBranch(person.branchId);
        const decision = (0, rbac_1.evaluate)(actor, action, resource, branchConfig, rbac_1.PERMISSION_MATRIX);
        if (decision.effect === 'DENY') {
            throw new common_1.ForbiddenException(decision.reason);
        }
        const grantedByUserId = await this.roleAssignmentRepository.findUserIdByPersonId(actor.personId);
        const created = await this.roleAssignmentRepository.create({
            personId: person.id,
            role: input.role,
            branchId: person.branchId,
            groupId: input.groupId,
            scopeGroupIds: input.scopeGroupIds,
            grantedByUserId,
            effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : undefined,
        });
        return toResponseDto(created);
    }
};
exports.RoleAssignmentService = RoleAssignmentService;
exports.RoleAssignmentService = RoleAssignmentService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof role_assignment_repository_1.RoleAssignmentRepository !== "undefined" && role_assignment_repository_1.RoleAssignmentRepository) === "function" ? _a : Object, typeof (_b = typeof person_repository_1.PersonRepository !== "undefined" && person_repository_1.PersonRepository) === "function" ? _b : Object, typeof (_c = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _c : Object])
], RoleAssignmentService);


/***/ }),
/* 58 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RoleAssignmentRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/**
 * Prisma-backed persistence for `people.role_assignments`. See
 * `PersonRepository`'s doc comment for the explicit-`branchId`-filtering
 * rationale (RLS session variable not wired yet).
 */
let RoleAssignmentRepository = class RoleAssignmentRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.roleAssignment.create({
            data: {
                personId: input.personId,
                // Cast to Prisma's generated `Role` enum type (not `never`) - see
                // `PersonRepository.updateLifecycleStage`'s comment for why this
                // still catches a genuine Prisma/`libs/rbac` role-catalog drift.
                role: input.role,
                branchId: input.branchId,
                groupId: input.groupId,
                scopeGroupIds: input.scopeGroupIds,
                grantedByUserId: input.grantedByUserId,
                ...(input.effectiveFrom ? { effectiveFrom: input.effectiveFrom } : {}),
            },
        });
    }
    /**
     * `people.role_assignments.granted_by_user_id` references
     * `platform.users`, but `ActorContext` (Sprint 1.4) only carries
     * `personId` - this reverse lookup is the narrow, single-write-path
     * version of the same Person->User join Sprint 1.4's
     * `AUTH_DESIGN_NOTES.md` flags as a *systemic* follow-up for
     * denial-audit-logging generically; scoped to just this one field, it
     * is an ordinary implementation detail, not a design gap.
     */
    async findUserIdByPersonId(personId) {
        const user = await this.prisma.user.findUnique({ where: { personId }, select: { id: true } });
        return user?.id;
    }
    async findPoimenStatus(personId) {
        const enrollment = await this.prisma.poimenEnrollment.findUnique({ where: { personId }, select: { status: true } });
        return enrollment?.status;
    }
};
exports.RoleAssignmentRepository = RoleAssignmentRepository;
exports.RoleAssignmentRepository = RoleAssignmentRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], RoleAssignmentRepository);


/***/ }),
/* 59 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlatformModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(4);
const core_1 = __webpack_require__(3);
const terminus_1 = __webpack_require__(14);
const nestjs_pino_1 = __webpack_require__(6);
const audit_module_1 = __webpack_require__(60);
const auth_module_1 = __webpack_require__(61);
const env_schema_1 = __webpack_require__(62);
const database_module_1 = __webpack_require__(12);
const all_exceptions_filter_1 = __webpack_require__(63);
const health_controller_1 = __webpack_require__(64);
const rbac_platform_module_1 = __webpack_require__(17);
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
            rbac_platform_module_1.RbacPlatformModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [
            {
                provide: core_1.APP_FILTER,
                useClass: all_exceptions_filter_1.AllExceptionsFilter,
            },
        ],
        exports: [config_1.ConfigModule, database_module_1.DatabaseModule, audit_module_1.AuditModule, auth_module_1.AuthModule, rbac_platform_module_1.RbacPlatformModule],
    })
], PlatformModule);


/***/ }),
/* 60 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuditModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const database_module_1 = __webpack_require__(12);
const audit_log_service_1 = __webpack_require__(50);
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
/* 61 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const core_1 = __webpack_require__(3);
const audit_module_1 = __webpack_require__(60);
const database_module_1 = __webpack_require__(12);
const actor_context_resolver_service_1 = __webpack_require__(51);
const auth_guard_1 = __webpack_require__(49);
const cognito_verifier_service_1 = __webpack_require__(52);
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
/* 62 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.envSchema = void 0;
exports.validateEnv = validateEnv;
const zod_1 = __webpack_require__(34);
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
/* 63 */
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
/* 64 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HealthController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const terminus_1 = __webpack_require__(14);
const database_health_indicator_1 = __webpack_require__(13);
const public_decorator_1 = __webpack_require__(54);
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