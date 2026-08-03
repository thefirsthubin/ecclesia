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
const gatherings_module_1 = __webpack_require__(11);
const insights_module_1 = __webpack_require__(115);
const ministry_module_1 = __webpack_require__(130);
const pastoral_care_module_1 = __webpack_require__(19);
const people_module_1 = __webpack_require__(20);
const stewardship_module_1 = __webpack_require__(145);
const platform_module_1 = __webpack_require__(164);
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
 * see `apps/api/src/modules/people/PEOPLE_DESIGN_NOTES.md`.
 * `PastoralCareModule` (Pastoral Care domain milestone) is the second -
 * see `apps/api/src/modules/pastoral-care/PASTORAL_CARE_DESIGN_NOTES.md`.
 * `GatheringsModule` (Gatherings domain milestone) is the third - see
 * `apps/api/src/modules/gatherings/GATHERINGS_DESIGN_NOTES.md`.
 * `StewardshipModule` (Stewardship domain milestone) is the fourth - see
 * `apps/api/src/modules/stewardship/STEWARDSHIP_DESIGN_NOTES.md`.
 * `InsightsModule` (Insights domain milestone) is the fifth - see
 * `apps/api/src/modules/insights/INSIGHTS_DESIGN_NOTES.md`.
 * `MinistryModule` (Ministry domain milestone) is the sixth and last - see
 * `apps/api/src/modules/ministry/MINISTRY_DESIGN_NOTES.md`.
 * `PeopleModule` and `PastoralCareModule` import each other
 * (`forwardRef`) for their bidirectional public-service dependency - see
 * both modules' own doc comments. `GatheringsModule`, `StewardshipModule`,
 * `InsightsModule`, and `MinistryModule` each import `PeopleModule`
 * normally (no cycle); `MinistryModule` additionally imports
 * `GatheringsModule` normally. All six bounded-context modules named in
 * the Blueprint's module inventory are now registered.
 */
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            platform_module_1.PlatformModule,
            people_module_1.PeopleModule,
            pastoral_care_module_1.PastoralCareModule,
            gatherings_module_1.GatheringsModule,
            stewardship_module_1.StewardshipModule,
            insights_module_1.InsightsModule,
            ministry_module_1.MinistryModule,
        ],
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
exports.GatheringsModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const database_module_1 = __webpack_require__(12);
const rbac_platform_module_1 = __webpack_require__(17);
const pastoral_care_module_1 = __webpack_require__(19);
const people_module_1 = __webpack_require__(20);
const attendance_record_controller_1 = __webpack_require__(95);
const gathering_controller_1 = __webpack_require__(103);
const gathering_series_controller_1 = __webpack_require__(106);
const visitor_intake_controller_1 = __webpack_require__(110);
const attendance_resource_context_guard_1 = __webpack_require__(96);
const gathering_resource_context_guard_1 = __webpack_require__(104);
const gathering_series_resource_context_guard_1 = __webpack_require__(107);
const visitor_intake_resource_context_guard_1 = __webpack_require__(111);
const attendance_record_repository_1 = __webpack_require__(102);
const gathering_repository_1 = __webpack_require__(97);
const gathering_series_repository_1 = __webpack_require__(108);
const visitor_intake_repository_1 = __webpack_require__(113);
const attendance_record_service_1 = __webpack_require__(98);
const gathering_service_1 = __webpack_require__(105);
const gathering_series_service_1 = __webpack_require__(109);
const gathering_scope_service_1 = __webpack_require__(114);
const visitor_intake_service_1 = __webpack_require__(112);
/**
 * GatheringsModule (PRD §13.4 / Blueprint §4.2 module inventory) - the
 * third bounded-context module. Internal layout mirrors
 * `PeopleModule`/`PastoralCareModule`'s own doc comments.
 *
 * Imports both `PeopleModule` (for `PersonService`, `PersonScopeService`,
 * `GroupScopeService`, `GroupLeadershipService`) and `PastoralCareModule`
 * (for `FollowUpTaskService`, consumed by `VisitorIntakeService`) as
 * ordinary imports, not `forwardRef` - unlike People and Pastoral Care,
 * which need each other's services and therefore import each other,
 * neither People nor Pastoral Care needs anything from Gatherings, so
 * there is no cycle here to break.
 *
 * **Exports `GatheringScopeService`** (Ministry milestone) - the first
 * time this module exports anything. `StaffingTargetService`
 * (`apps/api/src/modules/ministry`, FR-MIN-02) needs to validate that a
 * client-supplied `gatheringId` exists and belongs to the same Branch as
 * the target Basonta before writing a `StaffingTarget` row. See
 * `MinistryModule`'s own doc comment and
 * `apps/api/src/modules/ministry/MINISTRY_DESIGN_NOTES.md`.
 */
let GatheringsModule = class GatheringsModule {
};
exports.GatheringsModule = GatheringsModule;
exports.GatheringsModule = GatheringsModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, rbac_platform_module_1.RbacPlatformModule, people_module_1.PeopleModule, pastoral_care_module_1.PastoralCareModule],
        controllers: [gathering_series_controller_1.GatheringSeriesController, gathering_controller_1.GatheringController, attendance_record_controller_1.AttendanceRecordController, visitor_intake_controller_1.VisitorIntakeController],
        providers: [
            gathering_series_repository_1.GatheringSeriesRepository,
            gathering_repository_1.GatheringRepository,
            attendance_record_repository_1.AttendanceRecordRepository,
            visitor_intake_repository_1.VisitorIntakeRepository,
            gathering_series_service_1.GatheringSeriesService,
            gathering_service_1.GatheringService,
            gathering_scope_service_1.GatheringScopeService,
            attendance_record_service_1.AttendanceRecordService,
            visitor_intake_service_1.VisitorIntakeService,
            gathering_series_resource_context_guard_1.GatheringSeriesCreateResourceContextGuard,
            gathering_series_resource_context_guard_1.GatheringSeriesResourceContextGuard,
            gathering_resource_context_guard_1.GatheringCreateResourceContextGuard,
            gathering_resource_context_guard_1.GatheringResourceContextGuard,
            gathering_resource_context_guard_1.GatheringListResourceContextGuard,
            attendance_resource_context_guard_1.AttendanceResourceContextGuard,
            visitor_intake_resource_context_guard_1.VisitorIntakeResourceContextGuard,
        ],
        exports: [gathering_scope_service_1.GatheringScopeService],
    })
], GatheringsModule);


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


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PastoralCareModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const database_module_1 = __webpack_require__(12);
const rbac_platform_module_1 = __webpack_require__(17);
const people_module_1 = __webpack_require__(20);
const follow_up_task_controller_1 = __webpack_require__(81);
const pastoral_note_controller_1 = __webpack_require__(85);
const poimen_enrollment_controller_1 = __webpack_require__(89);
const silent_drift_flag_controller_1 = __webpack_require__(91);
const follow_up_task_resource_context_guard_1 = __webpack_require__(82);
const pastoral_note_resource_context_guard_1 = __webpack_require__(86);
const poimen_enrollment_resource_context_guard_1 = __webpack_require__(90);
const silent_drift_flag_resource_context_guard_1 = __webpack_require__(92);
const follow_up_task_repository_1 = __webpack_require__(83);
const pastoral_note_repository_1 = __webpack_require__(88);
const poimen_enrollment_repository_1 = __webpack_require__(77);
const silent_drift_flag_repository_1 = __webpack_require__(94);
const follow_up_task_service_1 = __webpack_require__(84);
const pastoral_note_service_1 = __webpack_require__(87);
const poimen_enrollment_service_1 = __webpack_require__(72);
const silent_drift_flag_service_1 = __webpack_require__(93);
/**
 * PastoralCareModule (PRD §13.2 / Blueprint §4.2 module inventory).
 * Internal layout mirrors `PeopleModule`'s own doc comment
 * (`controllers/`, `services/`, `repositories/`, `guards/`, no `dto/`).
 *
 * **Why `forwardRef(() => PeopleModule)`.** This module's own
 * resource-context guards (`PoimenEnrollmentResourceContextGuard`, and
 * the FollowUpTask/PastoralNote guards to follow) need People's exported
 * `PersonScopeService` to resolve "which Bacenta/Basonta is this resource
 * about," rather than duplicating that lookup or reaching into People's
 * `PersonRepository` directly (Blueprint §7.2). Symmetrically,
 * `PeopleModule` imports *this* module (also via `forwardRef`) so its own
 * `RoleAssignmentService` can inject `PoimenEnrollmentService` instead of
 * querying `pastoral_care.poimen_enrollments` directly, which is exactly
 * the module-boundary violation this milestone fixes - see
 * `PASTORAL_CARE_DESIGN_NOTES.md`. Two modules needing each other's public
 * service is a genuine bidirectional dependency between these bounded
 * contexts, not an accident of file organization - `forwardRef` is Nest's
 * documented mechanism for exactly this case (both `@Module()` decorators
 * reference each other, but no individual provider's constructor forms an
 * unresolvable cycle: `PoimenEnrollmentService` itself injects nothing
 * from People).
 */
let PastoralCareModule = class PastoralCareModule {
};
exports.PastoralCareModule = PastoralCareModule;
exports.PastoralCareModule = PastoralCareModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, rbac_platform_module_1.RbacPlatformModule, (0, common_1.forwardRef)(() => people_module_1.PeopleModule)],
        controllers: [poimen_enrollment_controller_1.PoimenEnrollmentController, follow_up_task_controller_1.FollowUpTaskController, pastoral_note_controller_1.PastoralNoteController, silent_drift_flag_controller_1.SilentDriftFlagController],
        providers: [
            poimen_enrollment_repository_1.PoimenEnrollmentRepository,
            poimen_enrollment_service_1.PoimenEnrollmentService,
            poimen_enrollment_resource_context_guard_1.PoimenEnrollmentResourceContextGuard,
            follow_up_task_repository_1.FollowUpTaskRepository,
            follow_up_task_service_1.FollowUpTaskService,
            follow_up_task_resource_context_guard_1.FollowUpTaskCreateResourceContextGuard,
            follow_up_task_resource_context_guard_1.FollowUpTaskResourceContextGuard,
            follow_up_task_resource_context_guard_1.FollowUpTaskListResourceContextGuard,
            pastoral_note_repository_1.PastoralNoteRepository,
            pastoral_note_service_1.PastoralNoteService,
            pastoral_note_resource_context_guard_1.PastoralNoteResourceContextGuard,
            silent_drift_flag_repository_1.SilentDriftFlagRepository,
            silent_drift_flag_service_1.SilentDriftFlagService,
            silent_drift_flag_resource_context_guard_1.SilentDriftFlagListResourceContextGuard,
        ],
        // `FollowUpTaskService` is additionally exported (Gatherings milestone)
        // so `VisitorIntakeService` (FR-GTH-04) can auto-create a Follow-up task
        // for US-A2's Bacenta-preference path without reaching into
        // `FollowUpTaskRepository` directly.
        exports: [poimen_enrollment_service_1.PoimenEnrollmentService, follow_up_task_service_1.FollowUpTaskService],
    })
], PastoralCareModule);


/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PeopleModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const database_module_1 = __webpack_require__(12);
const rbac_platform_module_1 = __webpack_require__(17);
const pastoral_care_module_1 = __webpack_require__(19);
const group_controller_1 = __webpack_require__(21);
const group_membership_controller_1 = __webpack_require__(56);
const person_controller_1 = __webpack_require__(67);
const role_assignment_controller_1 = __webpack_require__(70);
const group_resource_context_guard_1 = __webpack_require__(51);
const group_membership_resource_context_guard_1 = __webpack_require__(57);
const person_resource_context_guard_1 = __webpack_require__(68);
const group_repository_1 = __webpack_require__(54);
const group_membership_repository_1 = __webpack_require__(66);
const person_repository_1 = __webpack_require__(59);
const role_assignment_repository_1 = __webpack_require__(78);
const group_service_1 = __webpack_require__(55);
const group_leadership_service_1 = __webpack_require__(79);
const group_membership_service_1 = __webpack_require__(60);
const group_roster_service_1 = __webpack_require__(80);
const group_scope_service_1 = __webpack_require__(53);
const person_scope_service_1 = __webpack_require__(58);
const person_service_1 = __webpack_require__(69);
const role_assignment_service_1 = __webpack_require__(71);
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
 *
 * **Why `forwardRef(() => PastoralCareModule)`.** `RoleAssignmentService`
 * (below) injects Pastoral Care's exported `PoimenEnrollmentService` for
 * the `POIMEN_GATE_IF_ENABLED` check, instead of querying
 * `pastoral_care.poimen_enrollments` directly (the module-boundary
 * violation this milestone fixes). `PastoralCareModule` in turn imports
 * *this* module for `PersonScopeService`. See `PastoralCareModule`'s own
 * doc comment for the full `forwardRef` rationale - it applies
 * symmetrically here.
 */
let PeopleModule = class PeopleModule {
};
exports.PeopleModule = PeopleModule;
exports.PeopleModule = PeopleModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, rbac_platform_module_1.RbacPlatformModule, (0, common_1.forwardRef)(() => pastoral_care_module_1.PastoralCareModule)],
        controllers: [person_controller_1.PersonController, group_controller_1.GroupController, group_membership_controller_1.GroupMembershipController, role_assignment_controller_1.RoleAssignmentController],
        providers: [
            person_repository_1.PersonRepository,
            group_repository_1.GroupRepository,
            group_membership_repository_1.GroupMembershipRepository,
            role_assignment_repository_1.RoleAssignmentRepository,
            person_service_1.PersonService,
            person_scope_service_1.PersonScopeService,
            group_service_1.GroupService,
            group_scope_service_1.GroupScopeService,
            group_leadership_service_1.GroupLeadershipService,
            group_membership_service_1.GroupMembershipService,
            group_roster_service_1.GroupRosterService,
            role_assignment_service_1.RoleAssignmentService,
            person_resource_context_guard_1.PersonResourceContextGuard,
            person_resource_context_guard_1.PersonCreateResourceContextGuard,
            group_resource_context_guard_1.GroupResourceContextGuard,
            group_resource_context_guard_1.GroupCreateResourceContextGuard,
            group_membership_resource_context_guard_1.GroupMembershipResourceContextGuard,
        ],
        // `PersonScopeService` is People's public service interface (Blueprint
        // §7.2) for other bounded-context modules whose resources reference a
        // Person - Pastoral Care's FollowUpTask/PastoralNote/PoimenEnrollment
        // resource-context guards, and now Gatherings' own resource-context
        // guards, all need the same Person-scope resolution this module already
        // implements. `PersonService` is additionally exported (Gatherings
        // milestone) so `VisitorIntakeService` (FR-GTH-04) can create/transition
        // a Person - reusing FR-PPL-01's duplicate detection and FR-PPL-03's
        // lifecycle-stage validation rather than reimplementing either in
        // Gatherings - instead of Gatherings reaching into `PersonRepository`
        // directly. Repositories otherwise stay private, per the
        // schema-ownership rule (Blueprint §7.2, `PEOPLE_DESIGN_NOTES.md`).
        // `GroupLeadershipService` is likewise exported so
        // Gatherings' `VisitorIntakeService` can resolve "the active Bacenta
        // Leader for this Bacenta preference" (US-A2) without reaching into
        // `RoleAssignmentRepository` directly. `GroupScopeService` is Group's
        // analogue of `PersonScopeService`, consumed by Gatherings' own
        // resource-context guards when a Gathering/GatheringSeries names an
        // `ownerGroupId`/`groupId`. `GroupRosterService` is exported for the
        // Ministry milestone (FR-MIN-03/04) - Ministry's own
        // `StaffingTargetService`/`RosterService` need "how many/which Persons
        // are actively rostered in this Group" without reaching into
        // `GroupMembershipRepository` directly, the same schema-ownership rule
        // every prior export already follows. See
        // `apps/api/src/modules/ministry/MINISTRY_DESIGN_NOTES.md`.
        exports: [person_scope_service_1.PersonScopeService, person_service_1.PersonService, group_scope_service_1.GroupScopeService, group_leadership_service_1.GroupLeadershipService, group_roster_service_1.GroupRosterService],
    })
], PeopleModule);


/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroupController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const group_resource_context_guard_1 = __webpack_require__(51);
const group_service_1 = __webpack_require__(55);
/**
 * [INFERRED - no PRD §17.3 row covers this] Group (Bacenta/Basonta)
 * creation/configuration - FR-PC-01, FR-MIN-01. See
 * `libs/rbac/src/lib/actions.ts`'s `people.group.*` doc comment for why
 * these permission actions/rules had to be inferred rather than cited.
 */
let GroupController = class GroupController {
    groupService;
    constructor(groupService) {
        this.groupService = groupService;
    }
    create(actor, body) {
        return this.groupService.create(actor, body);
    }
    getById(id) {
        return this.groupService.getById(id);
    }
    update(id, body) {
        return this.groupService.update(id, body);
    }
};
exports.GroupController = GroupController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, rbac_1.RequirePermission)('people.group.create'),
    (0, common_1.UseGuards)(group_resource_context_guard_1.GroupCreateResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createGroupSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], GroupController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_1.RequirePermission)('people.group.read'),
    (0, common_1.UseGuards)(group_resource_context_guard_1.GroupResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], GroupController.prototype, "getById", null);
tslib_1.__decorate([
    (0, common_1.Patch)(':id'),
    (0, rbac_1.RequirePermission)('people.group.update'),
    (0, common_1.UseGuards)(group_resource_context_guard_1.GroupResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.updateGroupSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], GroupController.prototype, "update", null);
exports.GroupController = GroupController = tslib_1.__decorate([
    (0, common_1.Controller)('groups'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof group_service_1.GroupService !== "undefined" && group_service_1.GroupService) === "function" ? _a : Object])
], GroupController);


/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(8);
// Types (PRD §17.2-17.4; Blueprint §9.1-9.3)
tslib_1.__exportStar(__webpack_require__(23), exports);
tslib_1.__exportStar(__webpack_require__(24), exports);
tslib_1.__exportStar(__webpack_require__(25), exports);
// The permission matrix as executable data (Blueprint §9.3)
tslib_1.__exportStar(__webpack_require__(26), exports);
// Record-level policy checks (Blueprint §9.1, §9.4)
tslib_1.__exportStar(__webpack_require__(27), exports);
// The authorization engine (Blueprint §9.2)
tslib_1.__exportStar(__webpack_require__(28), exports);
// NestJS integration (Blueprint §9.4)
tslib_1.__exportStar(__webpack_require__(29), exports);
tslib_1.__exportStar(__webpack_require__(30), exports);
tslib_1.__exportStar(__webpack_require__(31), exports);
tslib_1.__exportStar(__webpack_require__(32), exports);


/***/ }),
/* 23 */
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
/* 24 */
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
    // [INFERRED - no PRD §17.3 row covers this] Group (Bacenta/Basonta)
    // creation/configuration itself (FR-PC-01, FR-MIN-01). §17.3's table
    // has a "reassign member" row but none for creating the Group entity
    // in the first place - a real gap in the source document, not a
    // transcription omission. See PASTORAL_CARE_DESIGN_NOTES.md.
    'people.group.create',
    'people.group.update',
    'people.group.read',
    // Gathering (row: "Gathering: create/configure")
    'gatherings.gathering.create',
    'gatherings.gathering.update',
    'gatherings.gathering.read',
    // Attendance (row: "Attendance: record")
    'gatherings.attendance.create',
    'gatherings.attendance.read',
    // [INFERRED - no PRD §17.3 row covers this] Digital visitor capture
    // (FR-GTH-04, BR-GTH-03). §16.4 names "Ushers, self-service (future)"
    // as the primary actors, but "Usher" is not a modeled `Role`
    // (`libs/rbac/src/lib/roles.ts` - the PRD §17.2 role catalog Sprint 1.1
    // transcribed has no Usher entry, and §17.3's own column headers omit
    // it too) - a genuine gap between the narrative personas and the
    // formal RBAC model, not something this milestone invents a fix for.
    // Modeled with the same role/scope shape as `gatherings.attendance.create`
    // immediately above (the roles who can already record attendance are
    // the same roles present at a Gathering to also capture a visitor).
    // See GATHERINGS_DESIGN_NOTES.md.
    'gatherings.visitor_intake.create',
    'gatherings.visitor_intake.read',
    // Financial Transaction (rows: record / verify / reconcile)
    'stewardship.transaction.record',
    'stewardship.transaction.verify',
    'stewardship.transaction.reconcile',
    'stewardship.transaction.read',
    // Expense (rows: request / approve)
    'stewardship.expense.request',
    'stewardship.expense.approve',
    // [INFERRED - no PRD §17.3 row covers this] Expense: pay / attach
    // receipt (FR-STW-09/BR-STW-08). §17.3's matrix stops at "approve" -
    // who executes payment and who attaches the retained receipt afterward
    // is named in PRD narrative ("payment executed," "receipt attached and
    // archived," §12.7) but has no permission-matrix row. `pay` is modeled
    // as a Treasurer action (money movement is Finance Team's designated
    // function, BR-STW-03); `receipt` is modeled as available to the same
    // roles who may request an expense (§17.3's "Expense: request" row) -
    // the original requester is the one holding the physical receipt after
    // their own purchase - restricted at the service layer to the specific
    // transaction's own `requestedByPersonId`, not a new record-level check.
    // See STEWARDSHIP_DESIGN_NOTES.md.
    'stewardship.expense.pay',
    'stewardship.expense.receipt',
    'stewardship.expense.read',
    // [INFERRED - no PRD §17.3 row covers this] Project / Pledge (FR-STW-08,
    // H2). §17.3's matrix predates this H2 feature entirely - no row names
    // it at all. Modeled with the same role/scope shape as "Gathering:
    // create/configure" for Project (a Branch/cluster-level leadership
    // action creating a structural entity), and "Financial Transaction:
    // record" for Pledge (a Member's own commitment, SELF-scoped, verified/
    // read by the same Treasurer/Pastor roles who already see Financial
    // Transactions). See STEWARDSHIP_DESIGN_NOTES.md.
    'stewardship.project.create',
    'stewardship.project.read',
    'stewardship.pledge.create',
    'stewardship.pledge.read',
    'stewardship.pledge.fulfill',
    // Follow-up task (row: "Follow-up task: create/assign")
    'pastoral_care.followup_task.create',
    'pastoral_care.followup_task.update',
    'pastoral_care.followup_task.read',
    // Pastoral notes (row: "Pastoral notes: view/create")
    'pastoral_care.notes.read',
    'pastoral_care.notes.create',
    // [INFERRED - no PRD §17.3 row covers this] Poimen enrollment tracking
    // (FR-PC-06). §19.4's workflow narrative names actors ("Resident Pastor
    // or Assistant Pastor... Admin (record-keeping support)") but §17.3's
    // matrix has no corresponding row. See PASTORAL_CARE_DESIGN_NOTES.md.
    'pastoral_care.poimen_enrollment.create',
    'pastoral_care.poimen_enrollment.update',
    'pastoral_care.poimen_enrollment.read',
    // [INFERRED - no PRD §17.3 row covers this] Silent-drift flag reads
    // (FR-PC-05, §15.8's decision tree). §17.3's matrix predates the
    // Shepherd Dashboard sprint that first reads `SilentDriftFlag` rows
    // through an HTTP endpoint - the worker's nightly sweep
    // (`apps/worker/src/jobs/silent-drift-sweep`) has written them since
    // the Insights milestone, but no controller in this codebase exposed
    // them until now. Modeled with the identical role/scope shape as
    // `insights.alert.read` (the same "leadership roles, scoped to their
    // organizational responsibility" RACI, FR-INS-04/BR-INS-02, applied to
    // a Pastoral Care - not Insights - owned resource) since a silent-drift
    // flag is exactly the kind of scoped, actionable alert that surface
    // already models. See SHEPHERD_DASHBOARD_DESIGN_NOTES.md.
    'pastoral_care.silent_drift_flag.read',
    // Insights (rows: Branch / cluster / own-Bacenta dashboards)
    'insights.branch_dashboard.read',
    'insights.cluster_dashboard.read',
    'insights.bacenta_dashboard.read',
    // [INFERRED - no PRD §17.3 row covers this] Alert inbox (FR-INS-03/05).
    // §17.3's matrix predates the Alert-inbox surface named in §16.6's
    // capabilities table entirely - no row names it at all, the same gap
    // Project/Pledge had in Stewardship. Modeled with the identical
    // role/scope shape as the three dashboard-read rows immediately above
    // (the same "leadership roles, scoped to their organizational
    // responsibility" RACI, FR-INS-04/BR-INS-02) since an alert inbox is
    // itself just another Insights-scoped read/act surface. See
    // INSIGHTS_DESIGN_NOTES.md.
    'insights.alert.read',
    'insights.alert.resolve',
    // [INFERRED - no PRD §17.3 row covers this] Ministry: staffing targets,
    // roster, worker availability (FR-MIN-01 through 04). §17.3's matrix
    // predates the Ministry domain's own capabilities entirely - the only
    // §17.3 rows that mention Basonta Leader at all belong to *other*
    // domains' actions (Person/Group/Gathering/Attendance/Expense), the
    // same gap category as Stewardship's Project/Pledge and Insights' Alert
    // inbox. See MINISTRY_DESIGN_NOTES.md. No separate `.update` action -
    // `staffing_target.create` is an upsert keyed on the (gatheringId,
    // groupId) unique pair, the same "re-recording is a correction, not a
    // duplicate" precedent `gatherings.attendance.create` already
    // established for `AttendanceRecordRepository.upsert()`.
    'ministry.staffing_target.create',
    'ministry.staffing_target.read',
    'ministry.worker_availability.create',
    'ministry.worker_availability.read',
    'ministry.roster.read',
    'ministry.roster.overcommitment.read',
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
/* 25 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),
/* 26 */
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
    // --- [INFERRED, no PRD §17.3 row] Group (Bacenta/Basonta): create/read/update ---
    // FR-PC-01/FR-MIN-01 require this capability to exist; §17.3's matrix
    // has no row for it. Modeled by extension from the adjacent "reassign
    // member" row's actor set, with one deliberate narrowing: ASSISTANT_PASTOR
    // is NOT granted create authority, because deciding which cluster a
    // brand-new Bacenta belongs to is itself an unresolved configuration
    // question (see db/DESIGN_NOTES.md Open Question #1) this matrix cannot
    // presume an answer to. See PASTORAL_CARE_DESIGN_NOTES.md.
    {
        role: 'RESIDENT_PASTOR',
        action: 'people.group.create',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: '[INFERRED] FR-PC-01/FR-MIN-01 - no PRD §17.3 citation',
    },
    { role: 'RESIDENT_PASTOR', action: 'people.group.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'RESIDENT_PASTOR', action: 'people.group.update', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'people.group.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ASSISTANT_PASTOR', action: 'people.group.update', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'people.group.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BACENTA_LEADER', action: 'people.group.update', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'people.group.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'people.group.update', effect: 'ALLOW', scope: 'OWN_GROUP' },
    {
        role: 'ADMIN',
        action: 'people.group.create',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: '[INFERRED] FR-PC-01/FR-MIN-01 - no PRD §17.3 citation',
    },
    { role: 'ADMIN', action: 'people.group.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ADMIN', action: 'people.group.update', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Gathering: create/configure -----------------------------------
    { role: 'RESIDENT_PASTOR', action: 'gatherings.gathering.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'gatherings.gathering.create', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ASSISTANT_PASTOR', action: 'gatherings.gathering.update', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'gatherings.gathering.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BACENTA_LEADER', action: 'gatherings.gathering.update', effect: 'ALLOW', scope: 'OWN_GROUP' },
    {
        role: 'BACENTA_LEADER',
        action: 'gatherings.gathering.read',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
        reason: '[Bug fix, Shepherd Dashboard sprint] a Shepherd could create/update their own Bacenta Meetings but had no matching read grant, so GET /gatherings/:id and the new GET /gatherings list endpoint were unreachable for this role until now',
    },
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
    {
        role: 'BACENTA_LEADER',
        action: 'gatherings.attendance.read',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
        reason: '[Bug fix, Shepherd Dashboard sprint] same gap as gatherings.gathering.read above - a Shepherd could record attendance but not read it back, blocking the dashboard\'s Attendance Summary card',
    },
    { role: 'BASONTA_LEADER', action: 'gatherings.attendance.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    {
        role: 'ADMIN',
        action: 'gatherings.attendance.create',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - support cases only',
    },
    // --- [INFERRED - no PRD §17.3 row covers this] Digital visitor capture
    // (FR-GTH-04). Same role/scope shape as gatherings.attendance.create
    // immediately above - see GATHERINGS_DESIGN_NOTES.md.
    { role: 'RESIDENT_PASTOR', action: 'gatherings.visitor_intake.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'gatherings.visitor_intake.create', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'gatherings.visitor_intake.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'gatherings.visitor_intake.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    {
        role: 'ADMIN',
        action: 'gatherings.visitor_intake.create',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 pattern - support cases only, mirroring gatherings.attendance.create',
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
    // [INFERRED - no PRD §17.3 row explicitly grants these] Treasurer and
    // Bacenta Leader read access to Financial Transactions. FR-STW-03's own
    // acceptance criterion ("Given a Recorded transaction matches my
    // count... I tap Verify") presupposes a Treasurer can already see the
    // verification queue, and a Bacenta Leader recording an offering
    // (`stewardship.transaction.record`, OWN_GROUP, above) has an obvious
    // need to see what they themselves already recorded - neither
    // capability is buildable without a `.read` grant, even though §17.3's
    // table only lists these two roles against `.record`/`.verify`, not
    // `.read` explicitly. See STEWARDSHIP_DESIGN_NOTES.md.
    { role: 'TREASURER', action: 'stewardship.transaction.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'BACENTA_LEADER', action: 'stewardship.transaction.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
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
    // FR-STW-09: "cannot reach Approved without action from a Person other
    // than the requester" - the same separation-of-duties shape as
    // BR-STW-04's transaction verification, so this reuses
    // `DIFFERENT_ACTOR_THAN_RECORDER` rather than inventing a parallel
    // record-level check: `ExpenseResourceContextGuard` populates
    // `resource.recordedByPersonId` with the Expense's own
    // `requestedByPersonId` (see STEWARDSHIP_DESIGN_NOTES.md), and the check
    // itself is already generically named/implemented as "actor differs
    // from whoever performed the prior step," not literally
    // transaction-specific.
    {
        role: 'RESIDENT_PASTOR',
        action: 'stewardship.expense.approve',
        effect: 'ALLOW',
        scope: 'BRANCH',
        recordLevelCheck: 'DIFFERENT_ACTOR_THAN_RECORDER',
        reason: 'FR-STW-09 - approver must not be the requester',
    },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'stewardship.expense.approve',
        effect: 'ALLOW',
        scope: 'CLUSTER',
        recordLevelCheck: 'DIFFERENT_ACTOR_THAN_RECORDER',
        reason: 'PRD §17.3 - only if delegated by the Resident Pastor; FR-STW-09 - approver must not be the requester',
    },
    // --- Expense: pay / receipt (both [INFERRED], see actions.ts) ----------
    { role: 'TREASURER', action: 'stewardship.expense.pay', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'RESIDENT_PASTOR', action: 'stewardship.expense.receipt', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'stewardship.expense.receipt', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'stewardship.expense.receipt', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'stewardship.expense.receipt', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'TREASURER', action: 'stewardship.expense.receipt', effect: 'ALLOW', scope: 'BRANCH', reason: 'Treasurer may also submit and self-fulfil an expense request' },
    // [INFERRED - no PRD §17.3 row covers this] Expense: read. Mirrors
    // `.request`'s own role/scope shape - whoever may request an expense
    // has an obvious need to see their own submission's status, and the
    // approver roles need to see the request queue before approving.
    { role: 'RESIDENT_PASTOR', action: 'stewardship.expense.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'stewardship.expense.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'stewardship.expense.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'stewardship.expense.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'TREASURER', action: 'stewardship.expense.read', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Project / Pledge (both [INFERRED], H2, see actions.ts) -------------
    { role: 'RESIDENT_PASTOR', action: 'stewardship.project.create', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'RESIDENT_PASTOR', action: 'stewardship.project.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'stewardship.project.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'TREASURER', action: 'stewardship.project.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'MEMBER', action: 'stewardship.project.read', effect: 'ALLOW', scope: 'BRANCH', reason: 'A Project is a Branch-visible fundraising goal, not a private record' },
    { role: 'MEMBER', action: 'stewardship.pledge.create', effect: 'ALLOW', scope: 'SELF' },
    { role: 'MEMBER', action: 'stewardship.pledge.read', effect: 'ALLOW', scope: 'SELF' },
    { role: 'RESIDENT_PASTOR', action: 'stewardship.pledge.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'TREASURER', action: 'stewardship.pledge.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'TREASURER',
        action: 'stewardship.pledge.fulfill',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'Linking a Pledge to its fulfilling transaction is a Finance Team record-keeping action, mirroring stewardship.transaction.reconcile',
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
    {
        role: 'BACENTA_LEADER',
        action: 'pastoral_care.followup_task.read',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
        reason: '[Bug fix, Shepherd Dashboard sprint] create/update existed for this role but read did not, so a Shepherd could never GET a Follow-up task (single or list) they themselves created or were assigned - the exact gap the dashboard\'s Priority card surfaced',
    },
    { role: 'ADMIN', action: 'pastoral_care.followup_task.read', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Silent-drift flag: read (FR-PC-05, §15.8) - [INFERRED], see actions.ts ---
    { role: 'RESIDENT_PASTOR', action: 'pastoral_care.silent_drift_flag.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.silent_drift_flag.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'pastoral_care.silent_drift_flag.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'ADMIN', action: 'pastoral_care.silent_drift_flag.read', effect: 'ALLOW', scope: 'BRANCH' },
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
    // --- [INFERRED - no PRD §17.3 row covers this] Poimen enrollment ------------
    // tracking (FR-PC-06). §19.4's workflow narrative names "Resident Pastor
    // or Assistant Pastor" as the actors who enroll/graduate a Poimen, plus
    // "Admin (record-keeping support)" - modeled here the same way as every
    // other §17.3 row that names these same three actors for a comparable
    // capability: RESIDENT_PASTOR at BRANCH, ASSISTANT_PASTOR at CLUSTER
    // (matching pastoral_care.notes.* immediately above), ADMIN limited to
    // read/update (record-keeping support, not initiating enrollment) per
    // §19.4's own phrasing and the NFR-PRIV-01 pattern already established
    // for ADMIN in this matrix. See PASTORAL_CARE_DESIGN_NOTES.md.
    { role: 'RESIDENT_PASTOR', action: 'pastoral_care.poimen_enrollment.create', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'RESIDENT_PASTOR', action: 'pastoral_care.poimen_enrollment.update', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'RESIDENT_PASTOR', action: 'pastoral_care.poimen_enrollment.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.poimen_enrollment.create', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.poimen_enrollment.update', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.poimen_enrollment.read', effect: 'ALLOW', scope: 'CLUSTER' },
    {
        role: 'ADMIN',
        action: 'pastoral_care.poimen_enrollment.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: '§19.4 - "Admin (record-keeping support)"',
    },
    { role: 'ADMIN', action: 'pastoral_care.poimen_enrollment.update', effect: 'ALLOW', scope: 'BRANCH' },
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
    // --- Insights: Alert inbox (FR-INS-03/05) - same scoped-leadership shape
    // as the three dashboard-read rows above; see actions.ts's doc comment
    // on `insights.alert.read`/`insights.alert.resolve`. ---------------------
    { role: 'RESIDENT_PASTOR', action: 'insights.alert.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'insights.alert.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'insights.alert.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'ADMIN', action: 'insights.alert.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'RESIDENT_PASTOR',
        action: 'insights.alert.resolve',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'FR-INS-05 - the responding user is recorded regardless of who resolves it',
    },
    { role: 'ASSISTANT_PASTOR', action: 'insights.alert.resolve', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'insights.alert.resolve', effect: 'ALLOW', scope: 'OWN_GROUP' },
    // --- Ministry: staffing targets (FR-MIN-02/03, [INFERRED]) -------------------
    // No ASSISTANT_PASTOR CLUSTER row here, deliberately - `evaluate.ts`'s
    // CLUSTER case tests `resource.bacentaId` membership only;
    // `GroupScopeService` populates `basontaId` (not `bacentaId`) for a
    // MINISTRY-type Group, so a CLUSTER row on any Basonta-scoped action
    // could never actually match. See MINISTRY_DESIGN_NOTES.md.
    {
        role: 'BASONTA_LEADER',
        action: 'ministry.staffing_target.create',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
        reason: 'FR-MIN-02 - also covers re-setting an existing target (upsert)',
    },
    { role: 'BASONTA_LEADER', action: 'ministry.staffing_target.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'RESIDENT_PASTOR', action: 'ministry.staffing_target.read', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Ministry: worker availability self-service (§16.3 H2, [INFERRED]) -------
    // §16.3's own key-surfaces table names "Worker/Member" as this
    // surface's persona - a Basonta Leader can also personally serve, so
    // they hold the same SELF grant as any other server.
    { role: 'WORKER', action: 'ministry.worker_availability.create', effect: 'ALLOW', scope: 'SELF' },
    { role: 'WORKER', action: 'ministry.worker_availability.read', effect: 'ALLOW', scope: 'SELF' },
    { role: 'MEMBER', action: 'ministry.worker_availability.create', effect: 'ALLOW', scope: 'SELF' },
    { role: 'MEMBER', action: 'ministry.worker_availability.read', effect: 'ALLOW', scope: 'SELF' },
    { role: 'BASONTA_LEADER', action: 'ministry.worker_availability.create', effect: 'ALLOW', scope: 'SELF' },
    { role: 'BASONTA_LEADER', action: 'ministry.worker_availability.read', effect: 'ALLOW', scope: 'SELF' },
    // --- Ministry: roster view + overcommitment flag (FR-MIN-01/04, [INFERRED]) --
    { role: 'BASONTA_LEADER', action: 'ministry.roster.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'RESIDENT_PASTOR', action: 'ministry.roster.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'BASONTA_LEADER', action: 'ministry.roster.overcommitment.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'RESIDENT_PASTOR', action: 'ministry.roster.overcommitment.read', effect: 'ALLOW', scope: 'BRANCH' },
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
/* 27 */
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
/* 28 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.evaluateRoleAndScope = evaluateRoleAndScope;
exports.evaluateRecordLevelCheck = evaluateRecordLevelCheck;
exports.evaluate = evaluate;
const record_level_checks_1 = __webpack_require__(27);
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
            // Set membership, not equality - see ActorContext.clusterBacentaIds's
            // doc comment (types.ts). A resource with no bacentaId (no single
            // owning Bacenta) can never match CLUSTER scope.
            return (actor.clusterBacentaIds !== undefined &&
                resource.bacentaId !== undefined &&
                actor.clusterBacentaIds.includes(resource.bacentaId));
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
/* 29 */
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
/* 30 */
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
/* 31 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RbacGuard = void 0;
const tslib_1 = __webpack_require__(8);
__webpack_require__(1);
const common_1 = __webpack_require__(2);
const core_1 = __webpack_require__(3);
const require_permission_decorator_1 = __webpack_require__(30);
const evaluate_1 = __webpack_require__(28);
const permission_matrix_1 = __webpack_require__(26);
const request_context_1 = __webpack_require__(29);
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
/* 32 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RecordLevelPolicyGuard = void 0;
const tslib_1 = __webpack_require__(8);
__webpack_require__(1);
const common_1 = __webpack_require__(2);
const evaluate_1 = __webpack_require__(28);
const request_context_1 = __webpack_require__(29);
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
/* 33 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(8);
tslib_1.__exportStar(__webpack_require__(34), exports);
tslib_1.__exportStar(__webpack_require__(35), exports);
tslib_1.__exportStar(__webpack_require__(37), exports);
tslib_1.__exportStar(__webpack_require__(38), exports);
tslib_1.__exportStar(__webpack_require__(39), exports);
tslib_1.__exportStar(__webpack_require__(40), exports);
tslib_1.__exportStar(__webpack_require__(41), exports);
tslib_1.__exportStar(__webpack_require__(42), exports);


/***/ }),
/* 34 */
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
/* 35 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.engagementSignalEnvelopeSchema = void 0;
const zod_1 = __webpack_require__(36);
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
/* 36 */
/***/ ((module) => {

module.exports = require("zod");

/***/ }),
/* 37 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.visitorIntakeResponseSchema = exports.submitVisitorIntakeSchema = exports.attendanceRecordResponseSchema = exports.recordAttendanceSchema = exports.listGatheringsQuerySchema = exports.gatheringResponseSchema = exports.updateGatheringSchema = exports.createGatheringSchema = exports.gatheringSeriesResponseSchema = exports.createGatheringSeriesSchema = exports.attendanceStatusSchema = exports.ATTENDANCE_STATUS_VALUES = exports.gatheringStatusSchema = exports.GATHERING_STATUS_VALUES = void 0;
const zod_1 = __webpack_require__(36);
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
/* 38 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.alertListResponseSchema = exports.groupDashboardResponseSchema = exports.branchDashboardResponseSchema = exports.resolveAlertSchema = exports.alertResponseSchema = exports.pulseScoreResponseSchema = exports.recordEngagementSignalSchema = exports.alertStatusSchema = exports.ALERT_STATUS_VALUES = exports.pulseScoreScopeTypeSchema = exports.PULSE_SCORE_SCOPE_TYPE_VALUES = void 0;
const zod_1 = __webpack_require__(36);
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
/* 39 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.overcommitmentFlagListResponseSchema = exports.overcommitmentFlagResponseSchema = exports.rosterResponseSchema = exports.rosterMemberResponseSchema = exports.workerAvailabilityResponseSchema = exports.recordWorkerAvailabilitySchema = exports.staffingTargetResponseSchema = exports.createStaffingTargetSchema = void 0;
const zod_1 = __webpack_require__(36);
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
/* 40 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.pastoralNoteResponseSchema = exports.createPastoralNoteSchema = exports.listSilentDriftFlagsQuerySchema = exports.silentDriftFlagResponseSchema = exports.silentDriftStatusSchema = exports.SILENT_DRIFT_STATUS_VALUES = exports.listFollowUpTasksQuerySchema = exports.followUpTaskResponseSchema = exports.escalateFollowUpTaskSchema = exports.createFollowUpTaskSchema = exports.followUpTaskTriggerSchema = exports.FOLLOW_UP_TASK_TRIGGER_VALUES = exports.followUpTaskStatusSchema = exports.FOLLOW_UP_TASK_STATUS_VALUES = exports.poimenEnrollmentResponseSchema = exports.updatePoimenStatusSchema = exports.enrollPoimenCandidateSchema = exports.poimenStatusSchema = exports.POIMEN_STATUS_VALUES = void 0;
const zod_1 = __webpack_require__(36);
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
/* 41 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.groupMembershipResponseSchema = exports.groupResponseSchema = exports.updateGroupSchema = exports.createGroupSchema = exports.groupLifecycleStatusSchema = exports.GROUP_LIFECYCLE_STATUS_VALUES = exports.groupTypeSchema = exports.GROUP_TYPE_VALUES = exports.roleAssignmentResponseSchema = exports.createRoleAssignmentRequestSchema = exports.createGroupMembershipRequestSchema = exports.lifecycleTransitionRequestSchema = exports.duplicateCandidateResponseSchema = exports.personResponseSchema = exports.updatePersonSchema = exports.createPersonSchema = exports.roleSchema = exports.ROLE_VALUES = exports.lifecycleStageSchema = exports.LIFECYCLE_STAGE_VALUES = void 0;
const zod_1 = __webpack_require__(36);
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
/* 42 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.pledgeResponseSchema = exports.fulfillPledgeSchema = exports.createPledgeSchema = exports.projectResponseSchema = exports.createProjectSchema = exports.expenseResponseSchema = exports.attachExpenseReceiptSchema = exports.rejectExpenseSchema = exports.requestExpenseSchema = exports.financialTransactionResponseSchema = exports.flagFinancialTransactionSchema = exports.recordFinancialTransactionSchema = exports.projectStatusSchema = exports.PROJECT_STATUS_VALUES = exports.outboundTransactionStateSchema = exports.OUTBOUND_TRANSACTION_STATE_VALUES = exports.inboundTransactionStateSchema = exports.INBOUND_TRANSACTION_STATE_VALUES = exports.financialTransactionChannelSchema = exports.FINANCIAL_TRANSACTION_CHANNEL_VALUES = exports.financialTransactionTypeSchema = exports.FINANCIAL_TRANSACTION_TYPE_VALUES = void 0;
const zod_1 = __webpack_require__(36);
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
/* 43 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CurrentActor = void 0;
exports.extractCurrentActor = extractCurrentActor;
// See public.decorator.ts's comment on why this import must come first.
__webpack_require__(1);
const common_1 = __webpack_require__(2);
const auth_guard_1 = __webpack_require__(44);
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
/* 44 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthGuard = exports.ACTOR_CONTEXT_KEY = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const core_1 = __webpack_require__(3);
const audit_log_service_1 = __webpack_require__(45);
const actor_context_resolver_service_1 = __webpack_require__(46);
const cognito_verifier_service_1 = __webpack_require__(47);
const public_decorator_1 = __webpack_require__(49);
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
/* 45 */
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
/* 46 */
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
 * One genuine gap remains open, deliberately NOT papered over with a
 * guessed default - see AUTH_DESIGN_NOTES.md:
 *
 * 1. **Multiple concurrent active Role Assignments.** `ActorContext.role`
 *    is a single `Role` (a Sprint 1.1 / libs/rbac design decision, out of
 *    this sprint's scope to change). Neither the Blueprint nor the PRD
 *    say what happens when a Person holds two roles at once (e.g.
 *    Treasurer and Shepherd) - this throws `ConflictException` rather
 *    than silently picking one, since a wrong silent choice is a
 *    security-relevant bug, not a cosmetic one.
 *
 * A second gap, previously open here, is now resolved (People domain
 * milestone): **CLUSTER scope.** `ActorContext.clusterBacentaIds` is now
 * populated directly from `assignment.scopeGroupIds` - `libs/rbac`'s
 * `evaluate.ts` tests set membership (is this resource's Bacenta among
 * the actor's `clusterBacentaIds`?) rather than equality against a
 * `clusterId` that nothing could ever populate. See `libs/rbac/src/lib/types.ts`'s
 * `ActorContext.clusterBacentaIds` doc comment for the full reasoning.
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
        // `assignment.scopeGroupIds` (Blueprint-adjacent/PRD-derived,
        // db/schema.prisma) is exactly the cluster-scoped Bacenta set a
        // CLUSTER-scoped Role Assignment covers - populate it directly.
        // Left undefined (not an empty array) when there is nothing to
        // populate, matching evaluate.ts's `actor.clusterBacentaIds !==
        // undefined` guard for a Role Assignment that isn't CLUSTER-scoped at
        // all (e.g. an Assistant Pastor configured Branch-wide, PRD §17.2:
        // "or Branch-wide by configuration").
        if (assignment.scopeGroupIds.length > 0) {
            actor.clusterBacentaIds = assignment.scopeGroupIds;
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
/* 47 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CognitoVerifierService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(4);
const aws_jwt_verify_1 = __webpack_require__(48);
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
/* 48 */
/***/ ((module) => {

module.exports = require("aws-jwt-verify");

/***/ }),
/* 49 */
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
/* 50 */
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
const zod_1 = __webpack_require__(36);
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
/* 51 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroupCreateResourceContextGuard = exports.GroupResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const group_scope_service_1 = __webpack_require__(53);
/**
 * Loads the `ResourceContext` for a route acting on an existing Group
 * (`GET/PATCH /v1/groups/:id`). See `GroupScopeService`'s doc comment for
 * the resolution logic (extracted there so Gatherings can reuse it too).
 */
let GroupResourceContextGuard = class GroupResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    groupScopeService;
    constructor(branchConfigurationService, groupScopeService) {
        super(branchConfigurationService);
        this.groupScopeService = groupScopeService;
    }
    loadResource(request, _actor) {
        const id = request.params.id;
        return this.groupScopeService.loadResourceContext(id);
    }
};
exports.GroupResourceContextGuard = GroupResourceContextGuard;
exports.GroupResourceContextGuard = GroupResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _b : Object])
], GroupResourceContextGuard);
/**
 * `POST /v1/groups` has no `:id` to load - PRD §17.3 has no row for Group
 * creation at all (see `people.group.*`'s doc comment in
 * `libs/rbac/src/lib/actions.ts`), and the matrix rows this module
 * inferred grant `people.group.create` only at BRANCH scope
 * (RESIDENT_PASTOR, ADMIN) - deliberately no CLUSTER/OWN_GROUP create
 * grant, since deciding which cluster or leader a brand-new Group belongs
 * to is itself unresolved (`db/DESIGN_NOTES.md` Open Question #1). The
 * resource is therefore trivially "the actor's own Branch," same pattern
 * as `PersonCreateResourceContextGuard`.
 */
let GroupCreateResourceContextGuard = class GroupCreateResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    constructor(branchConfigurationService) {
        super(branchConfigurationService);
    }
    async loadResource(_request, actor) {
        return { branchId: actor.branchId };
    }
};
exports.GroupCreateResourceContextGuard = GroupCreateResourceContextGuard;
exports.GroupCreateResourceContextGuard = GroupCreateResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_c = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _c : Object])
], GroupCreateResourceContextGuard);


/***/ }),
/* 52 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EcclesiaContextGuardBase = void 0;
const tslib_1 = __webpack_require__(8);
__webpack_require__(1);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
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
/* 53 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroupScopeService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const group_repository_1 = __webpack_require__(54);
/**
 * People's public service interface (Blueprint §7.2) for "what RBAC
 * scope does this Group belong to" - extracted from
 * `GroupResourceContextGuard`'s own inline logic (same consolidation
 * `PersonScopeService` already did for the analogous Person-side lookup),
 * so other bounded-context modules whose resources reference a Group
 * directly (Gatherings' `GatheringService`/`GatheringSeriesService`, when
 * an `ownerGroupId`/`groupId` is supplied) can resolve it via DI instead
 * of reaching into `GroupRepository`/Prisma directly.
 */
let GroupScopeService = class GroupScopeService {
    groupRepository;
    constructor(groupRepository) {
        this.groupRepository = groupRepository;
    }
    async loadResourceContext(groupId) {
        const group = await this.groupRepository.findById(groupId);
        if (!group) {
            throw new common_1.NotFoundException(`No Group found with id '${groupId}'`);
        }
        return {
            branchId: group.branchId,
            bacentaId: group.type === 'PASTORAL_CARE' ? group.id : undefined,
            basontaId: group.type === 'MINISTRY' ? group.id : undefined,
        };
    }
};
exports.GroupScopeService = GroupScopeService;
exports.GroupScopeService = GroupScopeService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof group_repository_1.GroupRepository !== "undefined" && group_repository_1.GroupRepository) === "function" ? _a : Object])
], GroupScopeService);


/***/ }),
/* 54 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroupRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/**
 * Prisma-backed persistence for `people.groups` (Bacenta/Basonta, PRD
 * §12.6). Schema-scoped per Blueprint §6.4/§7.2, same as `PersonRepository`
 * - see that file's doc comment for the explicit-`branchId`-filtering
 * rationale (RLS not yet wired, `db/DESIGN_NOTES.md` Open Question #3).
 */
let GroupRepository = class GroupRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.group.create({ data: input });
    }
    findById(id) {
        return this.prisma.group.findUnique({ where: { id } });
    }
    update(id, input) {
        return this.prisma.group.update({ where: { id }, data: input });
    }
};
exports.GroupRepository = GroupRepository;
exports.GroupRepository = GroupRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], GroupRepository);


/***/ }),
/* 55 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroupService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const group_repository_1 = __webpack_require__(54);
function toResponseDto(group) {
    return {
        id: group.id,
        branchId: group.branchId,
        type: group.type,
        name: group.name,
        meetingSchedule: group.meetingSchedule,
        meetingLocation: group.meetingLocation,
        category: group.category,
        lifecycleStatus: group.lifecycleStatus,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
    };
}
/**
 * Orchestrates Group (Bacenta/Basonta) create/read/update use cases -
 * [INFERRED - no PRD §17.3 row covers Group creation, see
 * `libs/rbac/src/lib/actions.ts`'s `people.group.*` doc comment].
 * FR-PC-01/FR-MIN-01 name the fields captured; leadership itself is a
 * separate Role Assignment (`RoleAssignmentService`), not set here.
 */
let GroupService = class GroupService {
    groupRepository;
    constructor(groupRepository) {
        this.groupRepository = groupRepository;
    }
    async create(actor, input) {
        const group = await this.groupRepository.create({
            branchId: actor.branchId,
            type: input.type,
            name: input.name,
            meetingSchedule: input.meetingSchedule,
            meetingLocation: input.meetingLocation,
            category: input.category,
        });
        return toResponseDto(group);
    }
    async getById(id) {
        const group = await this.groupRepository.findById(id);
        if (!group) {
            throw new common_1.NotFoundException(`No Group found with id '${id}'`);
        }
        return toResponseDto(group);
    }
    /**
     * Existence is already guaranteed on the real HTTP path by
     * `GroupResourceContextGuard` (must load the Group to build
     * `ResourceContext` before `RbacGuard` runs) - the explicit check here
     * is defense in depth, matching `PersonService.update`'s same pattern.
     */
    async update(id, input) {
        const existing = await this.groupRepository.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`No Group found with id '${id}'`);
        }
        const group = await this.groupRepository.update(id, {
            name: input.name,
            meetingSchedule: input.meetingSchedule,
            meetingLocation: input.meetingLocation,
            category: input.category,
            lifecycleStatus: input.lifecycleStatus,
        });
        return toResponseDto(group);
    }
};
exports.GroupService = GroupService;
exports.GroupService = GroupService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof group_repository_1.GroupRepository !== "undefined" && group_repository_1.GroupRepository) === "function" ? _a : Object])
], GroupService);


/***/ }),
/* 56 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroupMembershipController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const zod_validation_pipe_1 = __webpack_require__(50);
const group_membership_resource_context_guard_1 = __webpack_require__(57);
const group_membership_service_1 = __webpack_require__(60);
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
/* 57 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroupMembershipResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const person_scope_service_1 = __webpack_require__(58);
/**
 * `POST /v1/people/:personId/group-memberships` - PRD §17.3's
 * "Bacenta/Basonta: reassign member" row (`people.group_membership.update`).
 * The resource being scoped is the *Person's current membership state*
 * (their existing Bacenta, if any) - the same resolution
 * `PersonResourceContextGuard` already does, reused via the shared
 * `PersonScopeService` rather than duplicated.
 */
let GroupMembershipResourceContextGuard = class GroupMembershipResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    personScopeService;
    constructor(branchConfigurationService, personScopeService) {
        super(branchConfigurationService);
        this.personScopeService = personScopeService;
    }
    loadResource(request, actor) {
        const personId = request.params.personId;
        return this.personScopeService.loadResourceContext(personId, actor);
    }
};
exports.GroupMembershipResourceContextGuard = GroupMembershipResourceContextGuard;
exports.GroupMembershipResourceContextGuard = GroupMembershipResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof person_scope_service_1.PersonScopeService !== "undefined" && person_scope_service_1.PersonScopeService) === "function" ? _b : Object])
], GroupMembershipResourceContextGuard);


/***/ }),
/* 58 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PersonScopeService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const person_repository_1 = __webpack_require__(59);
/**
 * People module's public service interface (Blueprint §4.3 rule 1 /
 * §7.2: "if it needs data owned by another module, it calls that
 * module's public service interface... not by the caller reaching across
 * schema boundaries itself") for the one thing every other bounded
 * -context module that references a Person needs: that Person's RBAC
 * scope identifiers (`branchId`, `bacentaId`, `basontaId`), for building
 * an `EcclesiaRequestContext`'s `resource` half.
 *
 * Exported by `PeopleModule` specifically so Pastoral Care (and future
 * domain modules whose resources - FollowUpTask, PastoralNote,
 * PoimenEnrollment - are all "about a Person") can build their own
 * resource-context guards without reaching into People's
 * `PersonRepository`/Prisma layer directly, which would violate the
 * schema-ownership rule even though `people.persons` and the caller's
 * own tables both ultimately get queried by the same Postgres instance.
 *
 * **`basontaId` is resolved from the actor's perspective, not the
 * Person's** - see the original `PersonResourceContextGuard` doc
 * comment history (`PEOPLE_DESIGN_NOTES.md`) for the full reasoning: a
 * Person may hold several concurrent active Basonta memberships
 * (BR-PPL-02), but `ResourceContext.basontaId` only holds one value, so
 * this method reports the specific Basonta the *acting* Basonta Leader
 * leads, if the target Person is actually in it.
 */
let PersonScopeService = class PersonScopeService {
    personRepository;
    constructor(personRepository) {
        this.personRepository = personRepository;
    }
    async loadResourceContext(personId, actor) {
        const person = await this.personRepository.findById(personId);
        if (!person) {
            throw new common_1.NotFoundException(`No Person found with id '${personId}'`);
        }
        const activeMemberships = await this.personRepository.findActiveGroupMemberships(personId);
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
};
exports.PersonScopeService = PersonScopeService;
exports.PersonScopeService = PersonScopeService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof person_repository_1.PersonRepository !== "undefined" && person_repository_1.PersonRepository) === "function" ? _a : Object])
], PersonScopeService);


/***/ }),
/* 59 */
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
/* 60 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroupMembershipService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const domain_people_1 = __webpack_require__(61);
const group_membership_repository_1 = __webpack_require__(66);
const person_repository_1 = __webpack_require__(59);
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
/* 61 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(8);
tslib_1.__exportStar(__webpack_require__(62), exports);
tslib_1.__exportStar(__webpack_require__(63), exports);
tslib_1.__exportStar(__webpack_require__(64), exports);
tslib_1.__exportStar(__webpack_require__(65), exports);


/***/ }),
/* 62 */
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
/* 63 */
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
/* 64 */
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
/* 65 */
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
/* 66 */
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
    /** Ministry milestone (FR-MIN-03): "rostered workers" for a Basonta -
     * see `GroupRosterService`'s own doc comment for why this lives here
     * rather than as a new Ministry-owned query. */
    countActiveByGroup(groupId) {
        return this.prisma.groupMembership.count({ where: { groupId, endedAt: null } });
    }
    async listActiveByGroup(groupId) {
        return this.prisma.groupMembership.findMany({
            where: { groupId, endedAt: null },
            select: { personId: true, startedAt: true },
            orderBy: { startedAt: 'asc' },
        });
    }
    /** Ministry milestone (FR-MIN-04): a Person's concurrent active
     * MINISTRY-type memberships, the computable proxy for "overcommitment"
     * - see `libs/domain/ministry`'s `overcommitment.ts` doc comment. */
    countActiveMinistryMembershipsForPerson(personId) {
        return this.prisma.groupMembership.count({ where: { personId, groupType: 'MINISTRY', endedAt: null } });
    }
};
exports.GroupMembershipRepository = GroupMembershipRepository;
exports.GroupMembershipRepository = GroupMembershipRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], GroupMembershipRepository);


/***/ }),
/* 67 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PersonController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const person_resource_context_guard_1 = __webpack_require__(68);
const person_service_1 = __webpack_require__(69);
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
/* 68 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PersonCreateResourceContextGuard = exports.PersonResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const person_scope_service_1 = __webpack_require__(58);
/**
 * Loads the `ResourceContext` for a route acting on an existing Person
 * (`GET/PATCH /v1/people/:id`, `POST /v1/people/:id/lifecycle-transitions`).
 * See `EcclesiaContextGuardBase`'s doc comment for why this must be a
 * Guard, not an Interceptor.
 *
 * The actual `bacentaId`/`basontaId` resolution (including the "resolve
 * `basontaId` from the actor's perspective, not the Person's" reasoning -
 * see `PersonScopeService`'s doc comment for the full explanation) now
 * lives in `PersonScopeService`, People module's exported public service
 * interface (Blueprint §7.2), so it can be reused both here and by the
 * Group Membership module's own resource-context guard, as well as by
 * Pastoral Care's upcoming FollowUpTask/PastoralNote/PoimenEnrollment
 * resource-context guards, without any of them reaching into People's
 * `PersonRepository`/Prisma layer directly.
 */
let PersonResourceContextGuard = class PersonResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    personScopeService;
    constructor(branchConfigurationService, personScopeService) {
        super(branchConfigurationService);
        this.personScopeService = personScopeService;
    }
    loadResource(request, actor) {
        const id = request.params.id;
        return this.personScopeService.loadResourceContext(id, actor);
    }
};
exports.PersonResourceContextGuard = PersonResourceContextGuard;
exports.PersonResourceContextGuard = PersonResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof person_scope_service_1.PersonScopeService !== "undefined" && person_scope_service_1.PersonScopeService) === "function" ? _b : Object])
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
/* 69 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PersonService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const domain_people_1 = __webpack_require__(61);
const person_repository_1 = __webpack_require__(59);
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
/* 70 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RoleAssignmentController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const role_assignment_service_1 = __webpack_require__(71);
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
/* 71 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RoleAssignmentService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const domain_people_1 = __webpack_require__(61);
const rbac_1 = __webpack_require__(22);
const branch_configuration_service_1 = __webpack_require__(18);
const poimen_enrollment_service_1 = __webpack_require__(72);
const person_repository_1 = __webpack_require__(59);
const role_assignment_repository_1 = __webpack_require__(78);
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
 *
 * **Why this service injects `PoimenEnrollmentService` rather than
 * querying `pastoral_care.poimen_enrollments` itself.** It used to do the
 * latter (`RoleAssignmentRepository.findPoimenStatus`), a module-boundary
 * violation - a People-schema repository reaching into a table
 * Blueprint §7.2 assigns to the `pastoral_care` schema/module. Fixed in
 * the Pastoral Care milestone by consuming Pastoral Care's own exported
 * public service interface instead (`PastoralCareModule`'s `forwardRef`
 * import of `PeopleModule`, and vice versa, is what makes this injection
 * possible - see both modules' doc comments). See
 * `PASTORAL_CARE_DESIGN_NOTES.md`.
 */
let RoleAssignmentService = class RoleAssignmentService {
    roleAssignmentRepository;
    personRepository;
    branchConfigurationService;
    poimenEnrollmentService;
    constructor(roleAssignmentRepository, personRepository, branchConfigurationService, poimenEnrollmentService) {
        this.roleAssignmentRepository = roleAssignmentRepository;
        this.personRepository = personRepository;
        this.branchConfigurationService = branchConfigurationService;
        this.poimenEnrollmentService = poimenEnrollmentService;
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
            resource.candidatePoimenStatus = await this.poimenEnrollmentService.getStatus(person.id);
        }
        const branchConfig = await this.branchConfigurationService.loadForBranch(person.branchId);
        const decision = (0, rbac_1.evaluate)(actor, action, resource, branchConfig, rbac_1.PERMISSION_MATRIX);
        if (decision.effect === 'DENY') {
            throw new common_1.ForbiddenException(decision.reason);
        }
        const grantedByUserId = await this.roleAssignmentRepository.findUserIdByPersonId(actor.personId);
        const record = {
            personId: person.id,
            role: input.role,
            branchId: person.branchId,
            groupId: input.groupId,
            scopeGroupIds: input.scopeGroupIds,
            grantedByUserId,
            effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : undefined,
        };
        // PRD §17.2: "Exactly one active Bacenta Leader per Bacenta at a
        // time." A plain create() would let a second concurrently-active
        // BACENTA_LEADER assignment for the same Bacenta coexist, silently
        // violating that invariant (PRD §19.4 step 6 describes this exact
        // succession scenario - a new Shepherd replacing a departing one).
        // `input.groupId` is optional on the contract in general, but this
        // branch only ever runs for BACENTA_LEADER grants, which are
        // meaningless without a target Bacenta - if it's missing here, that's
        // a caller error the eligibility/authorization checks above should
        // already have every reason to have required, not a case to silently
        // skip succession for.
        if (input.role === 'BACENTA_LEADER' && input.groupId) {
            const now = record.effectiveFrom ?? new Date();
            const priorLeader = await this.roleAssignmentRepository.findActiveBacentaLeader(input.groupId, now);
            const created = await this.roleAssignmentRepository.createWithSuccession(record, priorLeader?.id, now);
            return toResponseDto(created);
        }
        const created = await this.roleAssignmentRepository.create(record);
        return toResponseDto(created);
    }
};
exports.RoleAssignmentService = RoleAssignmentService;
exports.RoleAssignmentService = RoleAssignmentService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof role_assignment_repository_1.RoleAssignmentRepository !== "undefined" && role_assignment_repository_1.RoleAssignmentRepository) === "function" ? _a : Object, typeof (_b = typeof person_repository_1.PersonRepository !== "undefined" && person_repository_1.PersonRepository) === "function" ? _b : Object, typeof (_c = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _c : Object, typeof (_d = typeof poimen_enrollment_service_1.PoimenEnrollmentService !== "undefined" && poimen_enrollment_service_1.PoimenEnrollmentService) === "function" ? _d : Object])
], RoleAssignmentService);


/***/ }),
/* 72 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PoimenEnrollmentService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const domain_pastoral_care_1 = __webpack_require__(73);
const poimen_enrollment_repository_1 = __webpack_require__(77);
function toResponseDto(enrollment) {
    return {
        id: enrollment.id,
        branchId: enrollment.branchId,
        personId: enrollment.personId,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt ? enrollment.enrolledAt.toISOString() : null,
        completedAt: enrollment.completedAt ? enrollment.completedAt.toISOString() : null,
        createdAt: enrollment.createdAt.toISOString(),
        updatedAt: enrollment.updatedAt.toISOString(),
    };
}
/**
 * FR-PC-06's orchestration layer, and Pastoral Care's public service
 * interface (Blueprint §7.2) for the one thing another bounded-context
 * module needs from this table: a candidate's current Poimen status
 * (`getStatus`), consumed by People's `RoleAssignmentService` for the
 * `POIMEN_GATE_IF_ENABLED` record-level check (`libs/rbac`) instead of
 * that module reaching into `pastoral_care.poimen_enrollments` directly -
 * see `PASTORAL_CARE_DESIGN_NOTES.md`.
 */
let PoimenEnrollmentService = class PoimenEnrollmentService {
    poimenEnrollmentRepository;
    constructor(poimenEnrollmentRepository) {
        this.poimenEnrollmentRepository = poimenEnrollmentRepository;
    }
    /**
     * Public service interface method. Returns `undefined` (not a
     * thrown/absent-record error) when the candidate has no enrollment row
     * yet - `libs/rbac`'s `poimenGateIfEnabled` check already treats an
     * absent/undefined `candidatePoimenStatus` as "not COMPLETE," the
     * correct behavior for a candidate who was never enrolled.
     */
    async getStatus(personId) {
        const enrollment = await this.poimenEnrollmentRepository.findByPersonId(personId);
        return enrollment?.status;
    }
    async enroll(actor, personId) {
        const existing = await this.poimenEnrollmentRepository.findByPersonId(personId);
        if (existing) {
            throw new common_1.ConflictException(`FR-PC-06: Person '${personId}' is already enrolled in Poimen training`);
        }
        const enrollment = await this.poimenEnrollmentRepository.create(actor.branchId, personId);
        return toResponseDto(enrollment);
    }
    async getByPersonId(personId) {
        const enrollment = await this.poimenEnrollmentRepository.findByPersonId(personId);
        if (!enrollment) {
            throw new common_1.NotFoundException(`No Poimen enrollment found for Person '${personId}'`);
        }
        return toResponseDto(enrollment);
    }
    /**
     * FR-PC-06's status progression, validated against
     * `libs/domain/pastoral-care`'s `checkPoimenStatusTransition` before
     * writing - same "validate the pure state machine, then persist"
     * pattern `PersonService.transitionLifecycleStage` already uses.
     */
    async updateStatus(personId, status) {
        const existing = await this.poimenEnrollmentRepository.findByPersonId(personId);
        if (!existing) {
            throw new common_1.NotFoundException(`No Poimen enrollment found for Person '${personId}'`);
        }
        if (!(0, domain_pastoral_care_1.isPoimenStatus)(status)) {
            throw new common_1.ConflictException(`'${status}' is not a recognized Poimen status`);
        }
        const check = (0, domain_pastoral_care_1.checkPoimenStatusTransition)(existing.status, status);
        if (!check.allowed) {
            throw new common_1.ConflictException(check.reason);
        }
        const now = new Date();
        const enrollment = await this.poimenEnrollmentRepository.update(personId, {
            status,
            enrolledAt: status === 'IN_PROGRESS' && !existing.enrolledAt ? now : undefined,
            completedAt: status === 'COMPLETE' ? now : undefined,
        });
        return toResponseDto(enrollment);
    }
};
exports.PoimenEnrollmentService = PoimenEnrollmentService;
exports.PoimenEnrollmentService = PoimenEnrollmentService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof poimen_enrollment_repository_1.PoimenEnrollmentRepository !== "undefined" && poimen_enrollment_repository_1.PoimenEnrollmentRepository) === "function" ? _a : Object])
], PoimenEnrollmentService);


/***/ }),
/* 73 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(8);
tslib_1.__exportStar(__webpack_require__(74), exports);
tslib_1.__exportStar(__webpack_require__(75), exports);
tslib_1.__exportStar(__webpack_require__(76), exports);


/***/ }),
/* 74 */
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
/* 75 */
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
/* 76 */
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
/* 77 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PoimenEnrollmentRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/**
 * Prisma-backed persistence for `pastoral_care.poimen_enrollments`
 * (FR-PC-06). Schema-scoped per Blueprint §6.4/§7.2 - this repository
 * only ever queries its own bounded context's tables, mirroring
 * `PersonRepository`'s own rule for `people.persons`. See
 * `PASTORAL_CARE_DESIGN_NOTES.md` for the module-boundary violation this
 * module's existence fixes (People's `RoleAssignmentRepository` used to
 * query this table directly).
 */
let PoimenEnrollmentRepository = class PoimenEnrollmentRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findByPersonId(personId) {
        return this.prisma.poimenEnrollment.findUnique({ where: { personId } });
    }
    /** `personId` is `@unique` (`db/schema.prisma`) - enrollment is
     * create-once, tracked forward via status transitions from there. */
    create(branchId, personId) {
        return this.prisma.poimenEnrollment.create({
            data: { branchId, personId, status: 'NOT_STARTED' },
        });
    }
    update(personId, input) {
        return this.prisma.poimenEnrollment.update({
            where: { personId },
            data: input,
        });
    }
};
exports.PoimenEnrollmentRepository = PoimenEnrollmentRepository;
exports.PoimenEnrollmentRepository = PoimenEnrollmentRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], PoimenEnrollmentRepository);


/***/ }),
/* 78 */
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
     * PRD §17.2's Bacenta Leader row: "Exactly one active Bacenta Leader per
     * Bacenta at a time." **Resolved OQ-05 (§24):** co-leadership is
     * deliberately deferred in v1.0 - single-leader is the only supported
     * model. `now` is passed in (not computed here) so the caller and this
     * lookup agree on the instant "active" is evaluated at, matching
     * `ActorContextResolverService`'s own "active" definition (`effectiveFrom
     * <= now`, `effectiveTo` null or in the future).
     */
    findActiveBacentaLeader(groupId, now) {
        return this.prisma.roleAssignment.findFirst({
            where: {
                groupId,
                role: 'BACENTA_LEADER',
                effectiveFrom: { lte: now },
                OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
            },
        });
    }
    /**
     * PRD §17.2 + §19.4 step 6: granting a new Bacenta Leader for a Bacenta
     * that already has one active must close the prior holder's assignment
     * (`effectiveTo = now`) in the same transaction as creating the new one
     * - the same "close-then-open, atomically" pattern
     * `GroupMembershipRepository.applyChange` already uses for FR-PPL-04's
     * "automatically closing the prior membership" requirement, applied here
     * to Role Assignment succession instead of Group Membership succession.
     * `assignmentIdToClose` is undefined when there is no prior holder to
     * close (a brand-new Bacenta, or one whose leader stepped down without a
     * same-transaction successor).
     */
    async createWithSuccession(input, assignmentIdToClose, now) {
        return this.prisma.$transaction(async (tx) => {
            if (assignmentIdToClose) {
                await tx.roleAssignment.update({
                    where: { id: assignmentIdToClose },
                    data: { effectiveTo: now },
                });
            }
            return tx.roleAssignment.create({
                data: {
                    personId: input.personId,
                    role: input.role,
                    branchId: input.branchId,
                    groupId: input.groupId,
                    scopeGroupIds: input.scopeGroupIds,
                    grantedByUserId: input.grantedByUserId,
                    ...(input.effectiveFrom ? { effectiveFrom: input.effectiveFrom } : {}),
                },
            });
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
};
exports.RoleAssignmentRepository = RoleAssignmentRepository;
exports.RoleAssignmentRepository = RoleAssignmentRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], RoleAssignmentRepository);


/***/ }),
/* 79 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroupLeadershipService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const role_assignment_repository_1 = __webpack_require__(78);
/**
 * People's public service interface (Blueprint §7.2) for "who currently
 * leads this Bacenta?" - the one Role Assignment lookup another bounded
 * -context module needs without reaching into
 * `people.role_assignments`/`RoleAssignmentRepository` directly. First
 * consumer: Gatherings' `VisitorIntakeService`, resolving US-A2's "Bacenta
 * preference... Follow-up task defaults to the matching Shepherd."
 * Deliberately narrow (one method, wrapping
 * `RoleAssignmentRepository.findActiveBacentaLeader` - the same lookup
 * `RoleAssignmentService.grant()`'s own succession logic already uses)
 * rather than exporting `RoleAssignmentRepository` itself, per the
 * schema-ownership rule.
 */
let GroupLeadershipService = class GroupLeadershipService {
    roleAssignmentRepository;
    constructor(roleAssignmentRepository) {
        this.roleAssignmentRepository = roleAssignmentRepository;
    }
    async getActiveBacentaLeaderPersonId(groupId, now = new Date()) {
        const assignment = await this.roleAssignmentRepository.findActiveBacentaLeader(groupId, now);
        return assignment?.personId;
    }
};
exports.GroupLeadershipService = GroupLeadershipService;
exports.GroupLeadershipService = GroupLeadershipService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof role_assignment_repository_1.RoleAssignmentRepository !== "undefined" && role_assignment_repository_1.RoleAssignmentRepository) === "function" ? _a : Object])
], GroupLeadershipService);


/***/ }),
/* 80 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroupRosterService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const group_membership_repository_1 = __webpack_require__(66);
/**
 * People's public service interface (Blueprint §7.2) for "who is
 * currently rostered" - extracted for the Ministry milestone, the first
 * cross-module consumer of `GroupMembership` data. Ministry's own
 * `StaffingTargetService` (FR-MIN-03's adequacy ratio) and `RosterService`
 * (FR-MIN-01's roster view, FR-MIN-04's overcommitment flag) need this
 * without reaching into `GroupMembershipRepository`/Prisma directly - the
 * same schema-ownership rule every prior cross-module consumption
 * (`PersonScopeService`, `GroupScopeService`, `GroupLeadershipService`)
 * already follows. "Active"/"rostered" means an open `GroupMembership`
 * (`endedAt IS NULL`), the same definition `GroupMembershipService`
 * itself already uses for BR-PPL-01/02.
 */
let GroupRosterService = class GroupRosterService {
    groupMembershipRepository;
    constructor(groupMembershipRepository) {
        this.groupMembershipRepository = groupMembershipRepository;
    }
    countActiveMembers(groupId) {
        return this.groupMembershipRepository.countActiveByGroup(groupId);
    }
    listActiveMembers(groupId) {
        return this.groupMembershipRepository.listActiveByGroup(groupId);
    }
    /** FR-MIN-04: how many concurrent active Basonta (MINISTRY-type)
     * memberships this Person currently holds - see
     * `libs/domain/ministry`'s `overcommitment.ts` for what this feeds. */
    countActiveMinistryMembershipsForPerson(personId) {
        return this.groupMembershipRepository.countActiveMinistryMembershipsForPerson(personId);
    }
};
exports.GroupRosterService = GroupRosterService;
exports.GroupRosterService = GroupRosterService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof group_membership_repository_1.GroupMembershipRepository !== "undefined" && group_membership_repository_1.GroupMembershipRepository) === "function" ? _a : Object])
], GroupRosterService);


/***/ }),
/* 81 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FollowUpTaskController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const follow_up_task_resource_context_guard_1 = __webpack_require__(82);
const follow_up_task_service_1 = __webpack_require__(84);
/** FR-PC-03/FR-PC-04. */
let FollowUpTaskController = class FollowUpTaskController {
    followUpTaskService;
    constructor(followUpTaskService) {
        this.followUpTaskService = followUpTaskService;
    }
    create(actor, personId, body) {
        return this.followUpTaskService.create(actor, personId, body);
    }
    /** §16.2's "Follow-up task queue... sorted by SLA urgency" - Shepherd
     * Dashboard sprint's Priority card. See
     * `SHEPHERD_DASHBOARD_DESIGN_NOTES.md` STEP 6 for why this endpoint did
     * not exist before this sprint. */
    listForGroup(groupId, query) {
        return this.followUpTaskService.listForGroup(groupId, query.status);
    }
    getById(id) {
        return this.followUpTaskService.getById(id);
    }
    complete(id) {
        return this.followUpTaskService.complete(id);
    }
    escalate(id, body) {
        return this.followUpTaskService.escalate(id, body.escalatedToPersonId);
    }
};
exports.FollowUpTaskController = FollowUpTaskController;
tslib_1.__decorate([
    (0, common_1.Post)('people/:personId/follow-up-tasks'),
    (0, rbac_1.RequirePermission)('pastoral_care.followup_task.create'),
    (0, common_1.UseGuards)(follow_up_task_resource_context_guard_1.FollowUpTaskCreateResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Param)('personId')),
    tslib_1.__param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createFollowUpTaskSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], FollowUpTaskController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Get)('pastoral-care/groups/:groupId/follow-up-tasks'),
    (0, rbac_1.RequirePermission)('pastoral_care.followup_task.read'),
    (0, common_1.UseGuards)(follow_up_task_resource_context_guard_1.FollowUpTaskListResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('groupId')),
    tslib_1.__param(1, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.listFollowUpTasksQuerySchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], FollowUpTaskController.prototype, "listForGroup", null);
tslib_1.__decorate([
    (0, common_1.Get)('follow-up-tasks/:id'),
    (0, rbac_1.RequirePermission)('pastoral_care.followup_task.read'),
    (0, common_1.UseGuards)(follow_up_task_resource_context_guard_1.FollowUpTaskResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], FollowUpTaskController.prototype, "getById", null);
tslib_1.__decorate([
    (0, common_1.Patch)('follow-up-tasks/:id/complete'),
    (0, rbac_1.RequirePermission)('pastoral_care.followup_task.update'),
    (0, common_1.UseGuards)(follow_up_task_resource_context_guard_1.FollowUpTaskResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], FollowUpTaskController.prototype, "complete", null);
tslib_1.__decorate([
    (0, common_1.Patch)('follow-up-tasks/:id/escalate'),
    (0, rbac_1.RequirePermission)('pastoral_care.followup_task.update'),
    (0, common_1.UseGuards)(follow_up_task_resource_context_guard_1.FollowUpTaskResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.escalateFollowUpTaskSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], FollowUpTaskController.prototype, "escalate", null);
exports.FollowUpTaskController = FollowUpTaskController = tslib_1.__decorate([
    (0, common_1.Controller)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof follow_up_task_service_1.FollowUpTaskService !== "undefined" && follow_up_task_service_1.FollowUpTaskService) === "function" ? _a : Object])
], FollowUpTaskController);


/***/ }),
/* 82 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FollowUpTaskListResourceContextGuard = exports.FollowUpTaskResourceContextGuard = exports.FollowUpTaskCreateResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const group_scope_service_1 = __webpack_require__(53);
const person_scope_service_1 = __webpack_require__(58);
const follow_up_task_repository_1 = __webpack_require__(83);
/**
 * `POST /v1/people/:personId/follow-up-tasks` - the resource is "the
 * subject Person," resolved via People's exported `PersonScopeService`
 * (same pattern as `PoimenEnrollmentResourceContextGuard`).
 */
let FollowUpTaskCreateResourceContextGuard = class FollowUpTaskCreateResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    personScopeService;
    constructor(branchConfigurationService, personScopeService) {
        super(branchConfigurationService);
        this.personScopeService = personScopeService;
    }
    loadResource(request, actor) {
        const personId = request.params.personId;
        return this.personScopeService.loadResourceContext(personId, actor);
    }
};
exports.FollowUpTaskCreateResourceContextGuard = FollowUpTaskCreateResourceContextGuard;
exports.FollowUpTaskCreateResourceContextGuard = FollowUpTaskCreateResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof person_scope_service_1.PersonScopeService !== "undefined" && person_scope_service_1.PersonScopeService) === "function" ? _b : Object])
], FollowUpTaskCreateResourceContextGuard);
/**
 * `GET/PATCH /v1/follow-up-tasks/:id` (read, complete, escalate) - loads
 * the existing task first (to find its subject `personId`), then resolves
 * scope from that Person's perspective via `PersonScopeService`, the same
 * "subject Person defines the scope" resolution `create` uses.
 */
let FollowUpTaskResourceContextGuard = class FollowUpTaskResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    followUpTaskRepository;
    personScopeService;
    constructor(branchConfigurationService, followUpTaskRepository, personScopeService) {
        super(branchConfigurationService);
        this.followUpTaskRepository = followUpTaskRepository;
        this.personScopeService = personScopeService;
    }
    async loadResource(request, actor) {
        const id = request.params.id;
        const task = await this.followUpTaskRepository.findById(id);
        if (!task) {
            throw new common_1.NotFoundException(`No Follow-up task found with id '${id}'`);
        }
        return this.personScopeService.loadResourceContext(task.personId, actor);
    }
};
exports.FollowUpTaskResourceContextGuard = FollowUpTaskResourceContextGuard;
exports.FollowUpTaskResourceContextGuard = FollowUpTaskResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_c = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _c : Object, typeof (_d = typeof follow_up_task_repository_1.FollowUpTaskRepository !== "undefined" && follow_up_task_repository_1.FollowUpTaskRepository) === "function" ? _d : Object, typeof (_e = typeof person_scope_service_1.PersonScopeService !== "undefined" && person_scope_service_1.PersonScopeService) === "function" ? _e : Object])
], FollowUpTaskResourceContextGuard);
/**
 * `GET /pastoral-care/groups/:groupId/follow-up-tasks` (Shepherd
 * Dashboard sprint's Priority-card queue, §16.2's "Follow-up task queue"
 * surface). Group-scoped, not per-task - resolves `ResourceContext`
 * straight from the `:groupId` route param via People's exported
 * `GroupScopeService`, the identical pattern
 * `GroupDashboardResourceContextGuard` (`apps/api/src/modules/insights`)
 * already established for `GET /insights/bacenta-dashboard/:groupId`.
 */
let FollowUpTaskListResourceContextGuard = class FollowUpTaskListResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    groupScopeService;
    constructor(branchConfigurationService, groupScopeService) {
        super(branchConfigurationService);
        this.groupScopeService = groupScopeService;
    }
    loadResource(request, _actor) {
        const groupId = request.params.groupId;
        return this.groupScopeService.loadResourceContext(groupId);
    }
};
exports.FollowUpTaskListResourceContextGuard = FollowUpTaskListResourceContextGuard;
exports.FollowUpTaskListResourceContextGuard = FollowUpTaskListResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_f = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _f : Object, typeof (_g = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _g : Object])
], FollowUpTaskListResourceContextGuard);


/***/ }),
/* 83 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FollowUpTaskRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/** §16.2's "sorted by SLA urgency" - open tasks with the soonest `dueAt`
 * first; tasks with no `dueAt` (should not occur in practice given
 * `FollowUpTaskService.create`'s always-computed default, but the column
 * is nullable) sort last rather than first. */
const DEFAULT_STATUSES = ['OPEN', 'ESCALATED'];
/**
 * Prisma-backed persistence for `pastoral_care.follow_up_tasks`
 * (FR-PC-03/04). Schema-scoped per Blueprint §6.4/§7.2, same rule as
 * `PoimenEnrollmentRepository`.
 */
let FollowUpTaskRepository = class FollowUpTaskRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.followUpTask.create({
            data: {
                branchId: input.branchId,
                personId: input.personId,
                assignedToPersonId: input.assignedToPersonId,
                groupId: input.groupId,
                dueAt: input.dueAt,
                createdByPersonId: input.createdByPersonId,
            },
        });
    }
    findById(id) {
        return this.prisma.followUpTask.findUnique({ where: { id } });
    }
    /** `GET /pastoral-care/groups/:groupId/follow-up-tasks` (Shepherd
     * Dashboard sprint - see this file's own repository doc comment; no
     * caller before this sprint needed a list, only single-task CRUD). */
    listByGroup(groupId, statuses = DEFAULT_STATUSES) {
        return this.prisma.followUpTask.findMany({
            where: { groupId, status: { in: statuses } },
            orderBy: [{ dueAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
        });
    }
    update(id, input) {
        return this.prisma.followUpTask.update({ where: { id }, data: input });
    }
};
exports.FollowUpTaskRepository = FollowUpTaskRepository;
exports.FollowUpTaskRepository = FollowUpTaskRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], FollowUpTaskRepository);


/***/ }),
/* 84 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FollowUpTaskService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const domain_pastoral_care_1 = __webpack_require__(73);
const person_scope_service_1 = __webpack_require__(58);
const follow_up_task_repository_1 = __webpack_require__(83);
function toResponseDto(task) {
    return {
        id: task.id,
        branchId: task.branchId,
        groupId: task.groupId,
        personId: task.personId,
        assignedToPersonId: task.assignedToPersonId,
        status: task.status,
        dueAt: task.dueAt ? task.dueAt.toISOString() : null,
        escalatedAt: task.escalatedAt ? task.escalatedAt.toISOString() : null,
        escalatedToPersonId: task.escalatedToPersonId,
        createdByPersonId: task.createdByPersonId,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
    };
}
/**
 * FR-PC-03 (creation)/FR-PC-04 (assignment, SLA, escalation)/BR-PC-04
 * orchestration. Injects People's exported `PersonScopeService` (Blueprint
 * §7.2) to resolve the target Person's `branchId` rather than querying
 * `people.persons` directly - the same cross-module consumption pattern
 * `PoimenEnrollmentResourceContextGuard` already uses.
 *
 * **What this service deliberately does not do.** FR-PC-03's *automatic*
 * creation trigger (a Person entering `FirstTimeGuest`, or the specific
 * `Lapsed -> FollowUp` transition) and its default-assignee resolution
 * (§19.1 step 3: "geographic/Bacenta preference, or a rotation among
 * Shepherds if no preference given") are not wired into
 * `PersonService.transitionLifecycleStage` - there is no concrete,
 * buildable algorithm for that default-assignee rule anywhere in the PRD,
 * and no rotation-state field in `db/schema.prisma` to support one. Every
 * `create()` call here requires an explicit `assignedToPersonId`, same as
 * BR-PC-04's escalation requiring an explicit `escalatedToPersonId`
 * (organizational-hierarchy resolution is an equally unmodeled lookup).
 * `libs/domain/pastoral-care`'s `determineFollowUpTaskTrigger` and
 * `computeFollowUpTaskDueAt` are ready to consume once that resolution
 * logic exists - see `PASTORAL_CARE_DESIGN_NOTES.md`.
 */
let FollowUpTaskService = class FollowUpTaskService {
    followUpTaskRepository;
    personScopeService;
    constructor(followUpTaskRepository, personScopeService) {
        this.followUpTaskRepository = followUpTaskRepository;
        this.personScopeService = personScopeService;
    }
    async create(actor, personId, input) {
        const resource = await this.personScopeService.loadResourceContext(personId, actor);
        // [INFERRED] `libs/domain/pastoral-care`'s SLA defaults only cover the
        // two PRD-named triggers (OQ-06). A `MANUAL` (ad-hoc, not
        // lifecycle-triggered) task has no PRD-specified default SLA at all -
        // falling back to the FIRST_TIME_GUEST default (3 days, the shorter
        // of the two) is a disclosed, conservative choice, not a citation;
        // `dueAtOverride` lets the creating actor supply an exact date
        // instead whenever this default doesn't fit.
        const trigger = input.trigger === 'MANUAL' ? 'FIRST_TIME_GUEST' : input.trigger;
        const dueAt = input.dueAtOverride
            ? new Date(input.dueAtOverride)
            : (0, domain_pastoral_care_1.computeFollowUpTaskDueAt)(trigger, new Date());
        const task = await this.followUpTaskRepository.create({
            branchId: resource.branchId,
            personId,
            assignedToPersonId: input.assignedToPersonId,
            groupId: input.groupId,
            dueAt,
            createdByPersonId: actor.personId,
        });
        return toResponseDto(task);
    }
    /** `GET /pastoral-care/groups/:groupId/follow-up-tasks` (§16.2's
     * "Follow-up task queue... sorted by SLA urgency" - Shepherd Dashboard
     * sprint, see this class's own doc comment on what this milestone
     * previously deliberately did not build). Defaults to the two
     * still-open statuses when the caller supplies none. */
    async listForGroup(groupId, statuses) {
        const tasks = await this.followUpTaskRepository.listByGroup(groupId, statuses);
        return tasks.map(toResponseDto);
    }
    async getById(id) {
        const task = await this.followUpTaskRepository.findById(id);
        if (!task) {
            throw new common_1.NotFoundException(`No Follow-up task found with id '${id}'`);
        }
        return toResponseDto(task);
    }
    /** FR-PC-04 acceptance: Shepherd logs an outcome, moving the task to its
     * terminal `COMPLETED` state. */
    async complete(id) {
        const existing = await this.requireOpenOrEscalated(id);
        const task = await this.followUpTaskRepository.update(existing.id, { status: 'COMPLETED' });
        return toResponseDto(task);
    }
    /** BR-PC-04: "escalates to the assigned Person's organizational
     * superior." `escalatedToPersonId` is caller-supplied - see this
     * class's doc comment for why automatic hierarchy resolution is out of
     * scope here. */
    async escalate(id, escalatedToPersonId) {
        const existing = await this.requireOpenOrEscalated(id);
        if (existing.status === 'ESCALATED') {
            throw new common_1.ConflictException(`Follow-up task '${id}' is already escalated`);
        }
        const task = await this.followUpTaskRepository.update(existing.id, {
            status: 'ESCALATED',
            escalatedAt: new Date(),
            escalatedToPersonId,
        });
        return toResponseDto(task);
    }
    async requireOpenOrEscalated(id) {
        const existing = await this.followUpTaskRepository.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`No Follow-up task found with id '${id}'`);
        }
        if (existing.status === 'COMPLETED') {
            throw new common_1.ConflictException(`Follow-up task '${id}' is already COMPLETED`);
        }
        return existing;
    }
};
exports.FollowUpTaskService = FollowUpTaskService;
exports.FollowUpTaskService = FollowUpTaskService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof follow_up_task_repository_1.FollowUpTaskRepository !== "undefined" && follow_up_task_repository_1.FollowUpTaskRepository) === "function" ? _a : Object, typeof (_b = typeof person_scope_service_1.PersonScopeService !== "undefined" && person_scope_service_1.PersonScopeService) === "function" ? _b : Object])
], FollowUpTaskService);


/***/ }),
/* 85 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PastoralNoteController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const pastoral_note_resource_context_guard_1 = __webpack_require__(86);
const pastoral_note_service_1 = __webpack_require__(87);
/** §16.2, NFR-PRIV-01 (permission-sensitive - see the explicit ADMIN DENY
 * rules on `pastoral_care.notes.*` in `libs/rbac/src/lib/permission-matrix.ts`). */
let PastoralNoteController = class PastoralNoteController {
    pastoralNoteService;
    constructor(pastoralNoteService) {
        this.pastoralNoteService = pastoralNoteService;
    }
    create(actor, personId, body) {
        return this.pastoralNoteService.create(actor, personId, body);
    }
    listByPerson(personId) {
        return this.pastoralNoteService.listByPerson(personId);
    }
};
exports.PastoralNoteController = PastoralNoteController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, rbac_1.RequirePermission)('pastoral_care.notes.create'),
    (0, common_1.UseGuards)(pastoral_note_resource_context_guard_1.PastoralNoteResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Param)('personId')),
    tslib_1.__param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createPastoralNoteSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], PastoralNoteController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Get)(),
    (0, rbac_1.RequirePermission)('pastoral_care.notes.read'),
    (0, common_1.UseGuards)(pastoral_note_resource_context_guard_1.PastoralNoteResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('personId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], PastoralNoteController.prototype, "listByPerson", null);
exports.PastoralNoteController = PastoralNoteController = tslib_1.__decorate([
    (0, common_1.Controller)('people/:personId/pastoral-notes'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof pastoral_note_service_1.PastoralNoteService !== "undefined" && pastoral_note_service_1.PastoralNoteService) === "function" ? _a : Object])
], PastoralNoteController);


/***/ }),
/* 86 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PastoralNoteResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const person_scope_service_1 = __webpack_require__(58);
/**
 * `POST/GET /v1/people/:personId/pastoral-notes` (§16.2). Same
 * "subject Person defines the scope" resolution as
 * `PoimenEnrollmentResourceContextGuard`, via `PersonScopeService`.
 */
let PastoralNoteResourceContextGuard = class PastoralNoteResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    personScopeService;
    constructor(branchConfigurationService, personScopeService) {
        super(branchConfigurationService);
        this.personScopeService = personScopeService;
    }
    loadResource(request, actor) {
        const personId = request.params.personId;
        return this.personScopeService.loadResourceContext(personId, actor);
    }
};
exports.PastoralNoteResourceContextGuard = PastoralNoteResourceContextGuard;
exports.PastoralNoteResourceContextGuard = PastoralNoteResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof person_scope_service_1.PersonScopeService !== "undefined" && person_scope_service_1.PersonScopeService) === "function" ? _b : Object])
], PastoralNoteResourceContextGuard);


/***/ }),
/* 87 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PastoralNoteService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const person_scope_service_1 = __webpack_require__(58);
const pastoral_note_repository_1 = __webpack_require__(88);
function toResponseDto(note) {
    return {
        id: note.id,
        branchId: note.branchId,
        personId: note.personId,
        authorPersonId: note.authorPersonId,
        content: note.content,
        createdAt: note.createdAt.toISOString(),
    };
}
/**
 * §16.2's pastoral notes capability. Injects `PersonScopeService` for the
 * subject Person's `branchId`, same cross-module consumption pattern as
 * `FollowUpTaskService`/`PoimenEnrollmentResourceContextGuard`.
 */
let PastoralNoteService = class PastoralNoteService {
    pastoralNoteRepository;
    personScopeService;
    constructor(pastoralNoteRepository, personScopeService) {
        this.pastoralNoteRepository = pastoralNoteRepository;
        this.personScopeService = personScopeService;
    }
    async create(actor, personId, input) {
        const resource = await this.personScopeService.loadResourceContext(personId, actor);
        const note = await this.pastoralNoteRepository.create({
            branchId: resource.branchId,
            personId,
            authorPersonId: actor.personId,
            content: input.content,
        });
        return toResponseDto(note);
    }
    async listByPerson(personId) {
        const notes = await this.pastoralNoteRepository.findByPersonId(personId);
        return notes.map(toResponseDto);
    }
};
exports.PastoralNoteService = PastoralNoteService;
exports.PastoralNoteService = PastoralNoteService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof pastoral_note_repository_1.PastoralNoteRepository !== "undefined" && pastoral_note_repository_1.PastoralNoteRepository) === "function" ? _a : Object, typeof (_b = typeof person_scope_service_1.PersonScopeService !== "undefined" && person_scope_service_1.PersonScopeService) === "function" ? _b : Object])
], PastoralNoteService);


/***/ }),
/* 88 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PastoralNoteRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/**
 * Prisma-backed persistence for `pastoral_care.pastoral_notes` (§16.2).
 * Schema-scoped per Blueprint §6.4/§7.2, same rule as
 * `PoimenEnrollmentRepository`/`FollowUpTaskRepository`. Notes are
 * immutable once created (`db/schema.prisma`'s `PastoralNote` has no
 * `updatedAt`) - there is no `update` method here.
 */
let PastoralNoteRepository = class PastoralNoteRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.pastoralNote.create({ data: input });
    }
    findByPersonId(personId) {
        return this.prisma.pastoralNote.findMany({ where: { personId }, orderBy: { createdAt: 'desc' } });
    }
};
exports.PastoralNoteRepository = PastoralNoteRepository;
exports.PastoralNoteRepository = PastoralNoteRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], PastoralNoteRepository);


/***/ }),
/* 89 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PoimenEnrollmentController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const poimen_enrollment_resource_context_guard_1 = __webpack_require__(90);
const poimen_enrollment_service_1 = __webpack_require__(72);
/**
 * FR-PC-06 - [INFERRED - no PRD §17.3 row covers this, see
 * `libs/rbac/src/lib/actions.ts`'s `pastoral_care.poimen_enrollment.*`
 * doc comment].
 */
let PoimenEnrollmentController = class PoimenEnrollmentController {
    poimenEnrollmentService;
    constructor(poimenEnrollmentService) {
        this.poimenEnrollmentService = poimenEnrollmentService;
    }
    enroll(actor, personId) {
        return this.poimenEnrollmentService.enroll(actor, personId);
    }
    getByPersonId(personId) {
        return this.poimenEnrollmentService.getByPersonId(personId);
    }
    updateStatus(personId, body) {
        return this.poimenEnrollmentService.updateStatus(personId, body.status);
    }
};
exports.PoimenEnrollmentController = PoimenEnrollmentController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, rbac_1.RequirePermission)('pastoral_care.poimen_enrollment.create'),
    (0, common_1.UseGuards)(poimen_enrollment_resource_context_guard_1.PoimenEnrollmentResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Param)('personId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", void 0)
], PoimenEnrollmentController.prototype, "enroll", null);
tslib_1.__decorate([
    (0, common_1.Get)(),
    (0, rbac_1.RequirePermission)('pastoral_care.poimen_enrollment.read'),
    (0, common_1.UseGuards)(poimen_enrollment_resource_context_guard_1.PoimenEnrollmentResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('personId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], PoimenEnrollmentController.prototype, "getByPersonId", null);
tslib_1.__decorate([
    (0, common_1.Patch)(),
    (0, rbac_1.RequirePermission)('pastoral_care.poimen_enrollment.update'),
    (0, common_1.UseGuards)(poimen_enrollment_resource_context_guard_1.PoimenEnrollmentResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('personId')),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.updatePoimenStatusSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], PoimenEnrollmentController.prototype, "updateStatus", null);
exports.PoimenEnrollmentController = PoimenEnrollmentController = tslib_1.__decorate([
    (0, common_1.Controller)('people/:personId/poimen-enrollment'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof poimen_enrollment_service_1.PoimenEnrollmentService !== "undefined" && poimen_enrollment_service_1.PoimenEnrollmentService) === "function" ? _a : Object])
], PoimenEnrollmentController);


/***/ }),
/* 90 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PoimenEnrollmentResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const person_scope_service_1 = __webpack_require__(58);
/**
 * `POST/GET/PATCH /v1/people/:personId/poimen-enrollment` -
 * [INFERRED - no PRD §17.3 row, see `libs/rbac/src/lib/actions.ts`'s
 * `pastoral_care.poimen_enrollment.*` doc comment]. The resource being
 * scoped is "the candidate Person," the exact same resolution
 * `PersonResourceContextGuard`/`GroupMembershipResourceContextGuard`
 * already need - reused here via `PersonScopeService`, People module's
 * exported public service interface (Blueprint §7.2), rather than
 * Pastoral Care reaching into People's `PersonRepository`/Prisma layer
 * directly. This is the cross-module consumption
 * `PASTORAL_CARE_DESIGN_NOTES.md` describes: `PastoralCareModule` imports
 * `PeopleModule` (with `forwardRef`, since `PeopleModule` in turn imports
 * `PastoralCareModule` for `PoimenEnrollmentService` - see both modules'
 * doc comments) specifically to inject this service.
 */
let PoimenEnrollmentResourceContextGuard = class PoimenEnrollmentResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    personScopeService;
    constructor(branchConfigurationService, personScopeService) {
        super(branchConfigurationService);
        this.personScopeService = personScopeService;
    }
    loadResource(request, actor) {
        const personId = request.params.personId;
        return this.personScopeService.loadResourceContext(personId, actor);
    }
};
exports.PoimenEnrollmentResourceContextGuard = PoimenEnrollmentResourceContextGuard;
exports.PoimenEnrollmentResourceContextGuard = PoimenEnrollmentResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof person_scope_service_1.PersonScopeService !== "undefined" && person_scope_service_1.PersonScopeService) === "function" ? _b : Object])
], PoimenEnrollmentResourceContextGuard);


/***/ }),
/* 91 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SilentDriftFlagController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const zod_validation_pipe_1 = __webpack_require__(50);
const silent_drift_flag_resource_context_guard_1 = __webpack_require__(92);
const silent_drift_flag_service_1 = __webpack_require__(93);
/**
 * FR-PC-05/§15.8, §16.2's "silent-drift flags" Key Surface content on the
 * Shepherd's Bacenta dashboard. See
 * `apps/mobile/.../ShepherdDashboard/SHEPHERD_DASHBOARD_DESIGN_NOTES.md`
 * STEP 6 for why this controller did not exist before this sprint -
 * `apps/worker`'s nightly sweep has written `SilentDriftFlag` rows since
 * the Insights milestone, but nothing read them back over HTTP.
 */
let SilentDriftFlagController = class SilentDriftFlagController {
    silentDriftFlagService;
    constructor(silentDriftFlagService) {
        this.silentDriftFlagService = silentDriftFlagService;
    }
    listForGroup(groupId, query) {
        return this.silentDriftFlagService.listForGroup(groupId, query.status);
    }
};
exports.SilentDriftFlagController = SilentDriftFlagController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    (0, rbac_1.RequirePermission)('pastoral_care.silent_drift_flag.read'),
    (0, common_1.UseGuards)(silent_drift_flag_resource_context_guard_1.SilentDriftFlagListResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('groupId')),
    tslib_1.__param(1, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.listSilentDriftFlagsQuerySchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], SilentDriftFlagController.prototype, "listForGroup", null);
exports.SilentDriftFlagController = SilentDriftFlagController = tslib_1.__decorate([
    (0, common_1.Controller)('pastoral-care/groups/:groupId/silent-drift-flags'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof silent_drift_flag_service_1.SilentDriftFlagService !== "undefined" && silent_drift_flag_service_1.SilentDriftFlagService) === "function" ? _a : Object])
], SilentDriftFlagController);


/***/ }),
/* 92 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SilentDriftFlagListResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const group_scope_service_1 = __webpack_require__(53);
/**
 * `GET /pastoral-care/groups/:groupId/silent-drift-flags` (Shepherd
 * Dashboard sprint's Priority-card drift flags, FR-PC-05/§15.8).
 * Group-scoped, identical shape to
 * `FollowUpTaskListResourceContextGuard`/`GroupDashboardResourceContextGuard`
 * - resolves `ResourceContext` straight from the `:groupId` route param
 * via People's exported `GroupScopeService`.
 */
let SilentDriftFlagListResourceContextGuard = class SilentDriftFlagListResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    groupScopeService;
    constructor(branchConfigurationService, groupScopeService) {
        super(branchConfigurationService);
        this.groupScopeService = groupScopeService;
    }
    loadResource(request, _actor) {
        const groupId = request.params.groupId;
        return this.groupScopeService.loadResourceContext(groupId);
    }
};
exports.SilentDriftFlagListResourceContextGuard = SilentDriftFlagListResourceContextGuard;
exports.SilentDriftFlagListResourceContextGuard = SilentDriftFlagListResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _b : Object])
], SilentDriftFlagListResourceContextGuard);


/***/ }),
/* 93 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SilentDriftFlagService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const silent_drift_flag_repository_1 = __webpack_require__(94);
function toResponseDto(flag) {
    return {
        id: flag.id,
        branchId: flag.branchId,
        groupId: flag.groupId,
        personId: flag.personId,
        attendanceMissedCount: flag.attendanceMissedCount,
        attendanceThreshold: flag.attendanceThreshold,
        bacentaMissedCount: flag.bacentaMissedCount,
        bacentaThreshold: flag.bacentaThreshold,
        status: flag.status,
        assignedShepherdPersonId: flag.assignedShepherdPersonId,
        resolvedAt: flag.resolvedAt ? flag.resolvedAt.toISOString() : null,
        escalatedAt: flag.escalatedAt ? flag.escalatedAt.toISOString() : null,
        createdAt: flag.createdAt.toISOString(),
    };
}
/**
 * FR-PC-05/§15.8: read-only access to the Silent Drift flags
 * `apps/worker`'s nightly sweep writes. US-G3's own acceptance criterion
 * ("the specific attendance pattern behind the flag is shown, not a
 * generic risk label") is satisfied structurally here - `toResponseDto`
 * passes through `attendanceMissedCount`/`attendanceThreshold`/
 * `bacentaMissedCount`/`bacentaThreshold` unchanged rather than
 * collapsing them into a boolean "at risk" flag.
 */
let SilentDriftFlagService = class SilentDriftFlagService {
    silentDriftFlagRepository;
    constructor(silentDriftFlagRepository) {
        this.silentDriftFlagRepository = silentDriftFlagRepository;
    }
    async listForGroup(groupId, statuses) {
        const flags = await this.silentDriftFlagRepository.listByGroup(groupId, statuses);
        return flags.map(toResponseDto);
    }
};
exports.SilentDriftFlagService = SilentDriftFlagService;
exports.SilentDriftFlagService = SilentDriftFlagService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof silent_drift_flag_repository_1.SilentDriftFlagRepository !== "undefined" && silent_drift_flag_repository_1.SilentDriftFlagRepository) === "function" ? _a : Object])
], SilentDriftFlagService);


/***/ }),
/* 94 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SilentDriftFlagRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/** The two still-open statuses (§15.8's decision tree: `FLAGGED` is the
 * initial state, `ESCALATED` is BR-PC-04's unactioned-past-SLA outcome).
 * `RESOLVED` flags are excluded by default - a Shepherd's dashboard
 * queue is for what still needs attention, not a full history. */
const DEFAULT_STATUSES = ['FLAGGED', 'ESCALATED'];
/**
 * Prisma-backed persistence for `pastoral_care.silent_drift_flags`
 * (FR-PC-05, §15.8). Rows are written exclusively by
 * `apps/worker`'s `SilentDriftSweepJob` today - this repository is this
 * codebase's first *read* path against that table (Shepherd Dashboard
 * sprint; see `SHEPHERD_DASHBOARD_DESIGN_NOTES.md` STEP 6).
 */
let SilentDriftFlagRepository = class SilentDriftFlagRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /** `GET /pastoral-care/groups/:groupId/silent-drift-flags`. Sorted
     * most-recently-flagged first, matching the Priority card's "what's
     * new since I last looked" framing. */
    listByGroup(groupId, statuses = DEFAULT_STATUSES) {
        return this.prisma.silentDriftFlag.findMany({
            where: { groupId, status: { in: statuses } },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.SilentDriftFlagRepository = SilentDriftFlagRepository;
exports.SilentDriftFlagRepository = SilentDriftFlagRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], SilentDriftFlagRepository);


/***/ }),
/* 95 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AttendanceRecordController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const attendance_resource_context_guard_1 = __webpack_require__(96);
const attendance_record_service_1 = __webpack_require__(98);
/** PRD §17.3's "Attendance: record" row, FR-GTH-03/FR-GTH-05. */
let AttendanceRecordController = class AttendanceRecordController {
    attendanceRecordService;
    constructor(attendanceRecordService) {
        this.attendanceRecordService = attendanceRecordService;
    }
    record(actor, gatheringId, body) {
        return this.attendanceRecordService.record(actor, gatheringId, body);
    }
    listByGathering(gatheringId) {
        return this.attendanceRecordService.listByGathering(gatheringId);
    }
    /** FR-GTH-05, per-Gathering. See `AttendanceRecordService`'s doc
     * comment for why the Branch-wide sweep/report isn't built here. */
    checkCompleteness(gatheringId) {
        return this.attendanceRecordService.checkCompleteness(gatheringId);
    }
};
exports.AttendanceRecordController = AttendanceRecordController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, rbac_1.RequirePermission)('gatherings.attendance.create'),
    (0, common_1.UseGuards)(attendance_resource_context_guard_1.AttendanceResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Param)('gatheringId')),
    tslib_1.__param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.recordAttendanceSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], AttendanceRecordController.prototype, "record", null);
tslib_1.__decorate([
    (0, common_1.Get)(),
    (0, rbac_1.RequirePermission)('gatherings.attendance.read'),
    (0, common_1.UseGuards)(attendance_resource_context_guard_1.AttendanceResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('gatheringId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], AttendanceRecordController.prototype, "listByGathering", null);
tslib_1.__decorate([
    (0, common_1.Get)('completeness'),
    (0, rbac_1.RequirePermission)('gatherings.attendance.read'),
    (0, common_1.UseGuards)(attendance_resource_context_guard_1.AttendanceResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('gatheringId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], AttendanceRecordController.prototype, "checkCompleteness", null);
exports.AttendanceRecordController = AttendanceRecordController = tslib_1.__decorate([
    (0, common_1.Controller)('gatherings/:gatheringId/attendance-records'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof attendance_record_service_1.AttendanceRecordService !== "undefined" && attendance_record_service_1.AttendanceRecordService) === "function" ? _a : Object])
], AttendanceRecordController);


/***/ }),
/* 96 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AttendanceResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const group_scope_service_1 = __webpack_require__(53);
const gathering_repository_1 = __webpack_require__(97);
/**
 * `POST/GET /v1/gatherings/:gatheringId/attendance-records` (FR-GTH-03).
 * Attendance is scoped by the Gathering it belongs to - same resolution
 * as `GatheringResourceContextGuard`, keyed off the `:gatheringId` route
 * param instead of `:id`.
 */
let AttendanceResourceContextGuard = class AttendanceResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    gatheringRepository;
    groupScopeService;
    constructor(branchConfigurationService, gatheringRepository, groupScopeService) {
        super(branchConfigurationService);
        this.gatheringRepository = gatheringRepository;
        this.groupScopeService = groupScopeService;
    }
    async loadResource(request, _actor) {
        const gatheringId = request.params.gatheringId;
        const gathering = await this.gatheringRepository.findById(gatheringId);
        if (!gathering) {
            throw new common_1.NotFoundException(`No Gathering found with id '${gatheringId}'`);
        }
        if (gathering.ownerGroupId) {
            return this.groupScopeService.loadResourceContext(gathering.ownerGroupId);
        }
        return { branchId: gathering.branchId };
    }
};
exports.AttendanceResourceContextGuard = AttendanceResourceContextGuard;
exports.AttendanceResourceContextGuard = AttendanceResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof gathering_repository_1.GatheringRepository !== "undefined" && gathering_repository_1.GatheringRepository) === "function" ? _b : Object, typeof (_c = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _c : Object])
], AttendanceResourceContextGuard);


/***/ }),
/* 97 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GatheringRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/**
 * Prisma-backed persistence for `gatherings.gatherings` (§12.4/FR-GTH-01).
 * Schema-scoped per Blueprint §6.4/§7.2.
 */
let GatheringRepository = class GatheringRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.gathering.create({ data: input });
    }
    findById(id) {
        return this.prisma.gathering.findUnique({ where: { id } });
    }
    /** `GET /gatherings?ownerGroupId=...` (Shepherd Dashboard sprint's
     * Today's-Meeting/Attendance-Summary cards - see this repository's own
     * doc comment on the gap this closes). Sorted earliest-first so the
     * caller can pick "the first instance ≥ now" for an upcoming meeting,
     * or "the last instance < now" for a just-happened one, from the same
     * result set. */
    listByGroupAndRange(groupId, from, to) {
        return this.prisma.gathering.findMany({
            where: { ownerGroupId: groupId, scheduledStart: { gte: from, lte: to } },
            orderBy: { scheduledStart: 'asc' },
        });
    }
    update(id, input) {
        return this.prisma.gathering.update({ where: { id }, data: input });
    }
};
exports.GatheringRepository = GatheringRepository;
exports.GatheringRepository = GatheringRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], GatheringRepository);


/***/ }),
/* 98 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AttendanceRecordService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const domain_gatherings_1 = __webpack_require__(99);
const attendance_record_repository_1 = __webpack_require__(102);
const gathering_repository_1 = __webpack_require__(97);
function toResponseDto(record) {
    return {
        id: record.id,
        gatheringId: record.gatheringId,
        personId: record.personId,
        branchId: record.branchId,
        status: record.status,
        recordedByPersonId: record.recordedByPersonId,
        recordedAt: record.recordedAt.toISOString(),
    };
}
/**
 * FR-GTH-03/BR-GTH-01 (Branch and per-Bacenta scoping via
 * `Gathering.ownerGroupId`, a query filter rather than a separate
 * reporting subsystem - §12.4's own implementation note). FR-GTH-05's
 * completeness check (`checkCompleteness`) is exposed per-Gathering here;
 * the Branch-wide sweep/report across many Gatherings and the "Attendance
 * not yet recorded" reminder notification (§16.4) are not built this
 * milestone - see `GATHERINGS_DESIGN_NOTES.md`.
 */
let AttendanceRecordService = class AttendanceRecordService {
    attendanceRecordRepository;
    gatheringRepository;
    constructor(attendanceRecordRepository, gatheringRepository) {
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.gatheringRepository = gatheringRepository;
    }
    async record(actor, gatheringId, input) {
        const gathering = await this.gatheringRepository.findById(gatheringId);
        if (!gathering) {
            throw new common_1.NotFoundException(`No Gathering found with id '${gatheringId}'`);
        }
        const record = await this.attendanceRecordRepository.upsert({
            gatheringId,
            personId: input.personId,
            branchId: gathering.branchId,
            status: input.status,
            recordedByPersonId: actor.personId,
        });
        return toResponseDto(record);
    }
    async listByGathering(gatheringId) {
        const records = await this.attendanceRecordRepository.findByGathering(gatheringId);
        return records.map(toResponseDto);
    }
    async checkCompleteness(gatheringId, windowHours) {
        const gathering = await this.gatheringRepository.findById(gatheringId);
        if (!gathering) {
            throw new common_1.NotFoundException(`No Gathering found with id '${gatheringId}'`);
        }
        const attendanceCount = await this.attendanceRecordRepository.countByGathering(gatheringId);
        return (0, domain_gatherings_1.evaluateAttendanceCompleteness)({
            scheduledEnd: gathering.scheduledEnd,
            hasAttendanceRecorded: attendanceCount > 0,
            now: new Date(),
            windowHours,
        });
    }
};
exports.AttendanceRecordService = AttendanceRecordService;
exports.AttendanceRecordService = AttendanceRecordService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof attendance_record_repository_1.AttendanceRecordRepository !== "undefined" && attendance_record_repository_1.AttendanceRecordRepository) === "function" ? _a : Object, typeof (_b = typeof gathering_repository_1.GatheringRepository !== "undefined" && gathering_repository_1.GatheringRepository) === "function" ? _b : Object])
], AttendanceRecordService);


/***/ }),
/* 99 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(8);
tslib_1.__exportStar(__webpack_require__(100), exports);
tslib_1.__exportStar(__webpack_require__(101), exports);


/***/ }),
/* 100 */
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
/* 101 */
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
/* 102 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AttendanceRecordRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/**
 * Prisma-backed persistence for `gatherings.attendance_records`
 * (FR-GTH-03). `db/schema.prisma`'s `@@unique([gatheringId, personId])`
 * makes this an upsert - re-recording the same Person's attendance for
 * the same Gathering is a correction, not a duplicate.
 */
let AttendanceRecordRepository = class AttendanceRecordRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    upsert(input) {
        return this.prisma.attendanceRecord.upsert({
            where: { gatheringId_personId: { gatheringId: input.gatheringId, personId: input.personId } },
            create: input,
            update: {
                status: input.status,
                recordedByPersonId: input.recordedByPersonId,
                recordedAt: new Date(),
            },
        });
    }
    findByGathering(gatheringId) {
        return this.prisma.attendanceRecord.findMany({ where: { gatheringId } });
    }
    countByGathering(gatheringId) {
        return this.prisma.attendanceRecord.count({ where: { gatheringId } });
    }
};
exports.AttendanceRecordRepository = AttendanceRecordRepository;
exports.AttendanceRecordRepository = AttendanceRecordRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], AttendanceRecordRepository);


/***/ }),
/* 103 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GatheringController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const gathering_resource_context_guard_1 = __webpack_require__(104);
const gathering_service_1 = __webpack_require__(105);
/** PRD §17.3's "Gathering: create/configure" row, §12.4. */
let GatheringController = class GatheringController {
    gatheringService;
    constructor(gatheringService) {
        this.gatheringService = gatheringService;
    }
    create(actor, body) {
        return this.gatheringService.create(actor, body);
    }
    /** `GET /gatherings?ownerGroupId=...` (Shepherd Dashboard sprint - see
     * `SHEPHERD_DASHBOARD_DESIGN_NOTES.md` STEP 6). Declared before `:id`
     * so Nest's router does not attempt to match the literal query-only
     * path against the `:id` param route - not actually a conflict here
     * since Nest matches `GET /gatherings` (no path segment) against this
     * route and `GET /gatherings/:id` against the one below regardless of
     * declaration order, but kept in this order for readability (list
     * before single-record read, the same order every other module's list
     * + getById pair already follows, e.g. `FinancialTransactionController`).
     */
    listForGroup(query) {
        return this.gatheringService.listForGroup(query);
    }
    getById(id) {
        return this.gatheringService.getById(id);
    }
    update(id, body) {
        return this.gatheringService.update(id, body);
    }
};
exports.GatheringController = GatheringController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, rbac_1.RequirePermission)('gatherings.gathering.create'),
    (0, common_1.UseGuards)(gathering_resource_context_guard_1.GatheringCreateResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createGatheringSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], GatheringController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Get)(),
    (0, rbac_1.RequirePermission)('gatherings.gathering.read'),
    (0, common_1.UseGuards)(gathering_resource_context_guard_1.GatheringListResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.listGatheringsQuerySchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], GatheringController.prototype, "listForGroup", null);
tslib_1.__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_1.RequirePermission)('gatherings.gathering.read'),
    (0, common_1.UseGuards)(gathering_resource_context_guard_1.GatheringResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], GatheringController.prototype, "getById", null);
tslib_1.__decorate([
    (0, common_1.Patch)(':id'),
    (0, rbac_1.RequirePermission)('gatherings.gathering.update'),
    (0, common_1.UseGuards)(gathering_resource_context_guard_1.GatheringResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.updateGatheringSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], GatheringController.prototype, "update", null);
exports.GatheringController = GatheringController = tslib_1.__decorate([
    (0, common_1.Controller)('gatherings'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof gathering_service_1.GatheringService !== "undefined" && gathering_service_1.GatheringService) === "function" ? _a : Object])
], GatheringController);


/***/ }),
/* 104 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GatheringListResourceContextGuard = exports.GatheringResourceContextGuard = exports.GatheringCreateResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const group_scope_service_1 = __webpack_require__(53);
const gathering_repository_1 = __webpack_require__(97);
/**
 * `POST /v1/gatherings` - §12.4's implementation note: `ownerGroupId` is
 * mandatory for a Bacenta/Basonta Meeting and null for a Branch-wide
 * Gathering (Sunday Service etc). When the request body names an
 * `ownerGroupId`, this delegates to People's exported `GroupScopeService`
 * to resolve whether it's a Bacenta or Basonta (Blueprint §7.2 - the same
 * cross-module consumption pattern Pastoral Care already established for
 * `PersonScopeService`); otherwise the resource is trivially the actor's
 * own Branch.
 */
let GatheringCreateResourceContextGuard = class GatheringCreateResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    groupScopeService;
    constructor(branchConfigurationService, groupScopeService) {
        super(branchConfigurationService);
        this.groupScopeService = groupScopeService;
    }
    async loadResource(request, actor) {
        const ownerGroupId = request.body?.ownerGroupId;
        if (ownerGroupId) {
            return this.groupScopeService.loadResourceContext(ownerGroupId);
        }
        return { branchId: actor.branchId };
    }
};
exports.GatheringCreateResourceContextGuard = GatheringCreateResourceContextGuard;
exports.GatheringCreateResourceContextGuard = GatheringCreateResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _b : Object])
], GatheringCreateResourceContextGuard);
/**
 * `GET/PATCH /v1/gatherings/:id` - loads the existing Gathering, then
 * resolves scope the same way `GatheringCreateResourceContextGuard` does
 * when `ownerGroupId` is set; a Branch-wide Gathering (`ownerGroupId`
 * null) resolves to just its own `branchId`.
 */
let GatheringResourceContextGuard = class GatheringResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    gatheringRepository;
    groupScopeService;
    constructor(branchConfigurationService, gatheringRepository, groupScopeService) {
        super(branchConfigurationService);
        this.gatheringRepository = gatheringRepository;
        this.groupScopeService = groupScopeService;
    }
    async loadResource(request, _actor) {
        const id = request.params.id;
        const gathering = await this.gatheringRepository.findById(id);
        if (!gathering) {
            throw new common_1.NotFoundException(`No Gathering found with id '${id}'`);
        }
        if (gathering.ownerGroupId) {
            return this.groupScopeService.loadResourceContext(gathering.ownerGroupId);
        }
        return { branchId: gathering.branchId };
    }
};
exports.GatheringResourceContextGuard = GatheringResourceContextGuard;
exports.GatheringResourceContextGuard = GatheringResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_c = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _c : Object, typeof (_d = typeof gathering_repository_1.GatheringRepository !== "undefined" && gathering_repository_1.GatheringRepository) === "function" ? _d : Object, typeof (_e = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _e : Object])
], GatheringResourceContextGuard);
/**
 * `GET /gatherings?ownerGroupId=...` (Shepherd Dashboard sprint's
 * Today's-Meeting/Attendance-Summary cards - [Gap], see
 * `SHEPHERD_DASHBOARD_DESIGN_NOTES.md` STEP 6). Group-scoped straight
 * from the required `ownerGroupId` query param, the identical pattern
 * `GatheringCreateResourceContextGuard` already uses for the request
 * body's `ownerGroupId` - a Branch-wide (no `ownerGroupId`) listing is
 * out of scope this sprint, so unlike the create guard there is no
 * Branch-only fallback branch here.
 */
let GatheringListResourceContextGuard = class GatheringListResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    groupScopeService;
    constructor(branchConfigurationService, groupScopeService) {
        super(branchConfigurationService);
        this.groupScopeService = groupScopeService;
    }
    loadResource(request, _actor) {
        const ownerGroupId = request.query.ownerGroupId;
        return this.groupScopeService.loadResourceContext(ownerGroupId);
    }
};
exports.GatheringListResourceContextGuard = GatheringListResourceContextGuard;
exports.GatheringListResourceContextGuard = GatheringListResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_f = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _f : Object, typeof (_g = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _g : Object])
], GatheringListResourceContextGuard);


/***/ }),
/* 105 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GatheringService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const domain_gatherings_1 = __webpack_require__(99);
const client_1 = __webpack_require__(16);
const gathering_repository_1 = __webpack_require__(97);
/** `listForGroup`'s default window when the caller supplies no explicit
 * `from`/`to` - "now through 30 days out," wide enough to always contain
 * the next scheduled Bacenta Meeting for any reasonable recurrence
 * cadence (weekly at minimum, per §12.4's named gathering types) without
 * returning unbounded history. */
const DEFAULT_LIST_WINDOW_DAYS = 30;
function toResponseDto(gathering) {
    return {
        id: gathering.id,
        branchId: gathering.branchId,
        ownerGroupId: gathering.ownerGroupId,
        seriesId: gathering.seriesId,
        type: gathering.type,
        scheduledStart: gathering.scheduledStart.toISOString(),
        scheduledEnd: gathering.scheduledEnd ? gathering.scheduledEnd.toISOString() : null,
        venue: gathering.venue,
        status: gathering.status,
        config: gathering.config ?? null,
        createdByPersonId: gathering.createdByPersonId,
        createdAt: gathering.createdAt.toISOString(),
        updatedAt: gathering.updatedAt.toISOString(),
    };
}
/**
 * FR-GTH-01/§12.4: create/read/update a single Gathering instance
 * (standalone, or as part of a series via `seriesId`). See
 * `libs/domain/gatherings/gathering-status.ts` for the `[INFERRED]`
 * forward-only status model this validates transitions against.
 */
let GatheringService = class GatheringService {
    gatheringRepository;
    constructor(gatheringRepository) {
        this.gatheringRepository = gatheringRepository;
    }
    async create(actor, input) {
        const gathering = await this.gatheringRepository.create({
            branchId: actor.branchId,
            type: input.type,
            ownerGroupId: input.ownerGroupId,
            seriesId: input.seriesId,
            scheduledStart: new Date(input.scheduledStart),
            scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : undefined,
            venue: input.venue,
            config: input.config,
            createdByPersonId: actor.personId,
        });
        return toResponseDto(gathering);
    }
    /** `GET /gatherings?ownerGroupId=...` (Shepherd Dashboard sprint - see
     * `GatheringRepository.listByGroupAndRange`'s own doc comment). Caller
     * supplies an explicit `from`/`to` to look backward (e.g. "last past
     * Bacenta Meeting," the Attendance Summary card) or forward (e.g.
     * "next upcoming meeting," the Today's Meeting card) - this service
     * only fills in the default forward-looking window when neither is
     * supplied. */
    async listForGroup(query) {
        const now = new Date();
        const from = query.from ? new Date(query.from) : now;
        const to = query.to ? new Date(query.to) : new Date(now.getTime() + DEFAULT_LIST_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        const gatherings = await this.gatheringRepository.listByGroupAndRange(query.ownerGroupId, from, to);
        return gatherings.map(toResponseDto);
    }
    async getById(id) {
        const gathering = await this.gatheringRepository.findById(id);
        if (!gathering) {
            throw new common_1.NotFoundException(`No Gathering found with id '${id}'`);
        }
        return toResponseDto(gathering);
    }
    /** §12.4's edge case: cancelling/completing one instance never alters
     * its series definition - this only ever touches the single
     * `Gathering` row identified by `id`. */
    async update(id, input) {
        const existing = await this.gatheringRepository.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`No Gathering found with id '${id}'`);
        }
        if (input.status) {
            const check = (0, domain_gatherings_1.checkGatheringStatusTransition)(existing.status, input.status);
            if (!check.allowed) {
                throw new common_1.ConflictException(check.reason);
            }
        }
        const gathering = await this.gatheringRepository.update(id, {
            scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : undefined,
            scheduledEnd: input.scheduledEnd === undefined ? undefined : input.scheduledEnd ? new Date(input.scheduledEnd) : null,
            venue: input.venue,
            status: input.status,
            // Prisma's own quirk for nullable Json columns: a literal `null`
            // does not mean "clear this field" the way it does for every other
            // column - it has to be the `Prisma.JsonNull` sentinel instead, or
            // Prisma writes a JSON `null` *value* rather than a SQL `NULL`. See
            // `GatheringRepository`'s `UpdateGatheringRecord.config` type,
            // which is typed against exactly this sentinel.
            config: input.config === undefined
                ? undefined
                : input.config === null
                    ? client_1.Prisma.JsonNull
                    : input.config,
        });
        return toResponseDto(gathering);
    }
};
exports.GatheringService = GatheringService;
exports.GatheringService = GatheringService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof gathering_repository_1.GatheringRepository !== "undefined" && gathering_repository_1.GatheringRepository) === "function" ? _a : Object])
], GatheringService);


/***/ }),
/* 106 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GatheringSeriesController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const gathering_series_resource_context_guard_1 = __webpack_require__(107);
const gathering_series_service_1 = __webpack_require__(109);
/** FR-GTH-02, PRD §17.3's "Gathering: create/configure" row (a series is
 * the recurring definition a Gathering instance may reference). */
let GatheringSeriesController = class GatheringSeriesController {
    gatheringSeriesService;
    constructor(gatheringSeriesService) {
        this.gatheringSeriesService = gatheringSeriesService;
    }
    create(actor, body) {
        return this.gatheringSeriesService.create(actor, body);
    }
    getById(id) {
        return this.gatheringSeriesService.getById(id);
    }
};
exports.GatheringSeriesController = GatheringSeriesController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, rbac_1.RequirePermission)('gatherings.gathering.create'),
    (0, common_1.UseGuards)(gathering_series_resource_context_guard_1.GatheringSeriesCreateResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createGatheringSeriesSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], GatheringSeriesController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_1.RequirePermission)('gatherings.gathering.read'),
    (0, common_1.UseGuards)(gathering_series_resource_context_guard_1.GatheringSeriesResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], GatheringSeriesController.prototype, "getById", null);
exports.GatheringSeriesController = GatheringSeriesController = tslib_1.__decorate([
    (0, common_1.Controller)('gathering-series'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof gathering_series_service_1.GatheringSeriesService !== "undefined" && gathering_series_service_1.GatheringSeriesService) === "function" ? _a : Object])
], GatheringSeriesController);


/***/ }),
/* 107 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GatheringSeriesResourceContextGuard = exports.GatheringSeriesCreateResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const group_scope_service_1 = __webpack_require__(53);
const gathering_series_repository_1 = __webpack_require__(108);
/** `POST /v1/gathering-series` - same resolution as
 * `GatheringCreateResourceContextGuard`, keyed off `groupId` instead of
 * `ownerGroupId` (`GatheringSeries`'s own field name). */
let GatheringSeriesCreateResourceContextGuard = class GatheringSeriesCreateResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    groupScopeService;
    constructor(branchConfigurationService, groupScopeService) {
        super(branchConfigurationService);
        this.groupScopeService = groupScopeService;
    }
    async loadResource(request, actor) {
        const groupId = request.body?.groupId;
        if (groupId) {
            return this.groupScopeService.loadResourceContext(groupId);
        }
        return { branchId: actor.branchId };
    }
};
exports.GatheringSeriesCreateResourceContextGuard = GatheringSeriesCreateResourceContextGuard;
exports.GatheringSeriesCreateResourceContextGuard = GatheringSeriesCreateResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _b : Object])
], GatheringSeriesCreateResourceContextGuard);
/** `GET /v1/gathering-series/:id`. */
let GatheringSeriesResourceContextGuard = class GatheringSeriesResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    gatheringSeriesRepository;
    groupScopeService;
    constructor(branchConfigurationService, gatheringSeriesRepository, groupScopeService) {
        super(branchConfigurationService);
        this.gatheringSeriesRepository = gatheringSeriesRepository;
        this.groupScopeService = groupScopeService;
    }
    async loadResource(request, _actor) {
        const id = request.params.id;
        const series = await this.gatheringSeriesRepository.findById(id);
        if (!series) {
            throw new common_1.NotFoundException(`No Gathering series found with id '${id}'`);
        }
        if (series.groupId) {
            return this.groupScopeService.loadResourceContext(series.groupId);
        }
        return { branchId: series.branchId };
    }
};
exports.GatheringSeriesResourceContextGuard = GatheringSeriesResourceContextGuard;
exports.GatheringSeriesResourceContextGuard = GatheringSeriesResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_c = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _c : Object, typeof (_d = typeof gathering_series_repository_1.GatheringSeriesRepository !== "undefined" && gathering_series_repository_1.GatheringSeriesRepository) === "function" ? _d : Object, typeof (_e = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _e : Object])
], GatheringSeriesResourceContextGuard);


/***/ }),
/* 108 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GatheringSeriesRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/**
 * Prisma-backed persistence for `gatherings.gathering_series` (FR-GTH-02).
 * Schema-scoped per Blueprint §6.4/§7.2, same rule as every other
 * repository in this codebase. See `PersonRepository`'s doc comment for
 * the explicit-`branchId`-filtering rationale (RLS not yet wired).
 */
let GatheringSeriesRepository = class GatheringSeriesRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.gatheringSeries.create({ data: input });
    }
    findById(id) {
        return this.prisma.gatheringSeries.findUnique({ where: { id } });
    }
};
exports.GatheringSeriesRepository = GatheringSeriesRepository;
exports.GatheringSeriesRepository = GatheringSeriesRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], GatheringSeriesRepository);


/***/ }),
/* 109 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GatheringSeriesService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const gathering_series_repository_1 = __webpack_require__(108);
function toResponseDto(series) {
    return {
        id: series.id,
        branchId: series.branchId,
        groupId: series.groupId,
        type: series.type,
        recurrenceRule: series.recurrenceRule,
        startDate: series.startDate.toISOString().slice(0, 10),
        endDate: series.endDate ? series.endDate.toISOString().slice(0, 10) : null,
        createdByPersonId: series.createdByPersonId,
        createdAt: series.createdAt.toISOString(),
        updatedAt: series.updatedAt.toISOString(),
    };
}
/**
 * FR-GTH-02: "define recurring series; manage individual instance
 * exceptions." This service only creates/reads the series definition
 * itself - it does not auto-generate dated `Gathering` instances from
 * `recurrenceRule` (see `libs/domain/gatherings/README.md`'s "what this
 * library deliberately does not do" and
 * `GATHERINGS_DESIGN_NOTES.md`). Instances are created explicitly via
 * `GatheringService.create`, optionally referencing this series'
 * `seriesId` - which is exactly what §12.4's edge case requires ("any one
 * of which can be individually cancelled ... without altering the series
 * definition").
 */
let GatheringSeriesService = class GatheringSeriesService {
    gatheringSeriesRepository;
    constructor(gatheringSeriesRepository) {
        this.gatheringSeriesRepository = gatheringSeriesRepository;
    }
    async create(actor, input) {
        const series = await this.gatheringSeriesRepository.create({
            branchId: actor.branchId,
            type: input.type,
            groupId: input.groupId,
            recurrenceRule: input.recurrenceRule,
            startDate: new Date(input.startDate),
            endDate: input.endDate ? new Date(input.endDate) : undefined,
            createdByPersonId: actor.personId,
        });
        return toResponseDto(series);
    }
    async getById(id) {
        const series = await this.gatheringSeriesRepository.findById(id);
        if (!series) {
            throw new common_1.NotFoundException(`No Gathering series found with id '${id}'`);
        }
        return toResponseDto(series);
    }
};
exports.GatheringSeriesService = GatheringSeriesService;
exports.GatheringSeriesService = GatheringSeriesService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof gathering_series_repository_1.GatheringSeriesRepository !== "undefined" && gathering_series_repository_1.GatheringSeriesRepository) === "function" ? _a : Object])
], GatheringSeriesService);


/***/ }),
/* 110 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VisitorIntakeController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const visitor_intake_resource_context_guard_1 = __webpack_require__(111);
const visitor_intake_service_1 = __webpack_require__(112);
/** FR-GTH-04/BR-GTH-03 - [INFERRED - no PRD §17.3 row covers this, see
 * `libs/rbac/src/lib/actions.ts`'s `gatherings.visitor_intake.*` doc
 * comment]. */
let VisitorIntakeController = class VisitorIntakeController {
    visitorIntakeService;
    constructor(visitorIntakeService) {
        this.visitorIntakeService = visitorIntakeService;
    }
    submit(actor, body) {
        return this.visitorIntakeService.submit(actor, body);
    }
};
exports.VisitorIntakeController = VisitorIntakeController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, rbac_1.RequirePermission)('gatherings.visitor_intake.create'),
    (0, common_1.UseGuards)(visitor_intake_resource_context_guard_1.VisitorIntakeResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.submitVisitorIntakeSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], VisitorIntakeController.prototype, "submit", null);
exports.VisitorIntakeController = VisitorIntakeController = tslib_1.__decorate([
    (0, common_1.Controller)('visitor-intake'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof visitor_intake_service_1.VisitorIntakeService !== "undefined" && visitor_intake_service_1.VisitorIntakeService) === "function" ? _a : Object])
], VisitorIntakeController);


/***/ }),
/* 111 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VisitorIntakeResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const group_scope_service_1 = __webpack_require__(53);
const gathering_repository_1 = __webpack_require__(97);
/**
 * `POST /v1/visitor-intake` (FR-GTH-04). Scope preference order: the
 * Gathering the visitor was captured at (`gatheringId`, if supplied) -
 * matching `AttendanceResourceContextGuard`'s own resolution, since a
 * visitor intake at a specific Gathering is scoped the same way
 * attendance for that Gathering would be - then a supplied
 * `bacentaPreferenceGroupId` (self-service capture with no specific
 * Gathering context), then the actor's own Branch.
 */
let VisitorIntakeResourceContextGuard = class VisitorIntakeResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    gatheringRepository;
    groupScopeService;
    constructor(branchConfigurationService, gatheringRepository, groupScopeService) {
        super(branchConfigurationService);
        this.gatheringRepository = gatheringRepository;
        this.groupScopeService = groupScopeService;
    }
    async loadResource(request, actor) {
        const body = request.body;
        const gatheringId = body?.gatheringId;
        if (gatheringId) {
            const gathering = await this.gatheringRepository.findById(gatheringId);
            if (gathering?.ownerGroupId) {
                return this.groupScopeService.loadResourceContext(gathering.ownerGroupId);
            }
            if (gathering) {
                return { branchId: gathering.branchId };
            }
            // A nonexistent gatheringId is a validation concern for the
            // service layer, not this guard - falls through to the next
            // preference rather than throwing here, since RbacGuard denying
            // on a bad ID would produce a confusing 403 instead of the
            // service's own clearer 404/400.
        }
        const bacentaPreferenceGroupId = body?.bacentaPreferenceGroupId;
        if (bacentaPreferenceGroupId) {
            return this.groupScopeService.loadResourceContext(bacentaPreferenceGroupId);
        }
        return { branchId: actor.branchId };
    }
};
exports.VisitorIntakeResourceContextGuard = VisitorIntakeResourceContextGuard;
exports.VisitorIntakeResourceContextGuard = VisitorIntakeResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof gathering_repository_1.GatheringRepository !== "undefined" && gathering_repository_1.GatheringRepository) === "function" ? _b : Object, typeof (_c = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _c : Object])
], VisitorIntakeResourceContextGuard);


/***/ }),
/* 112 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VisitorIntakeService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const follow_up_task_service_1 = __webpack_require__(84);
const group_leadership_service_1 = __webpack_require__(79);
const person_service_1 = __webpack_require__(69);
const visitor_intake_repository_1 = __webpack_require__(113);
function toResponseDto(submission, followUpTaskCreated) {
    return {
        id: submission.id,
        branchId: submission.branchId,
        gatheringId: submission.gatheringId,
        personId: submission.personId,
        submittedData: submission.submittedData,
        createdAt: submission.createdAt.toISOString(),
        followUpTaskCreated,
    };
}
/**
 * FR-GTH-04/BR-GTH-03: "digital visitor forms," replacing the manual
 * paper-card process, creating a Person and (per US-A1/FR-PC-03) an
 * automatic Follow-up task within the same processing cycle.
 *
 * Consumes two cross-module public service interfaces (Blueprint §7.2):
 * People's `PersonService` (create the Person; transition to
 * `FIRST_TIME_GUEST` when confirmed) and `GroupLeadershipService`
 * (resolve a Bacenta preference to its current Shepherd), and Pastoral
 * Care's `FollowUpTaskService` (create the Follow-up task itself).
 *
 * **The Follow-up task is only auto-created when a Bacenta preference is
 * supplied and resolves to an active Shepherd** - US-A2's exact,
 * concretely-specified path ("Given a visitor form indicates a Bacenta
 * preference... then the Follow-up task defaults to the matching
 * Shepherd"). When no preference is given, §19.1 step 3's "rotation among
 * Shepherds" fallback has no buildable algorithm behind it (see
 * `PASTORAL_CARE_DESIGN_NOTES.md`'s open question, restated here since
 * this is the concrete call site that gap blocks) - this service does not
 * invent one. The Person is still created and transitioned correctly
 * either way (FR-GTH-04 is fully satisfied); only the *automatic*
 * Follow-up task creation is conditional. `followUpTaskCreated` on the
 * response tells the caller which case occurred, so a UI can prompt an
 * Usher/Admin to assign one manually when it's `false`.
 */
let VisitorIntakeService = class VisitorIntakeService {
    visitorIntakeRepository;
    personService;
    groupLeadershipService;
    followUpTaskService;
    constructor(visitorIntakeRepository, personService, groupLeadershipService, followUpTaskService) {
        this.visitorIntakeRepository = visitorIntakeRepository;
        this.personService = personService;
        this.groupLeadershipService = groupLeadershipService;
        this.followUpTaskService = followUpTaskService;
    }
    async submit(actor, input) {
        const person = await this.personService.create(actor, {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            overrideDuplicateCheck: false,
        });
        // FR-GTH-04: "creating a new Person at lifecycle_stage = Visitor (or
        // FirstTimeGuest if this is confirmed as their first attendance)."
        // `PersonService.create` always starts at VISITOR (FR-PPL-01's own
        // default) - the transition below is this service's job, not
        // People's, since only the capturing actor at the point of intake
        // knows whether this is a first attendance.
        if (input.firstTimeGuest) {
            await this.personService.transitionLifecycleStage(person.id, { toStage: 'FIRST_TIME_GUEST' });
        }
        let followUpTaskCreated = false;
        if (input.firstTimeGuest && input.bacentaPreferenceGroupId) {
            const shepherdPersonId = await this.groupLeadershipService.getActiveBacentaLeaderPersonId(input.bacentaPreferenceGroupId);
            if (shepherdPersonId) {
                await this.followUpTaskService.create(actor, person.id, {
                    assignedToPersonId: shepherdPersonId,
                    groupId: input.bacentaPreferenceGroupId,
                    trigger: 'FIRST_TIME_GUEST',
                });
                followUpTaskCreated = true;
            }
        }
        const submittedData = {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone ?? null,
            howTheyHeard: input.howTheyHeard ?? null,
            firstTimeGuest: input.firstTimeGuest,
            bacentaPreferenceGroupId: input.bacentaPreferenceGroupId ?? null,
        };
        const submission = await this.visitorIntakeRepository.create({
            branchId: actor.branchId,
            gatheringId: input.gatheringId,
            personId: person.id,
            submittedData,
        });
        return toResponseDto(submission, followUpTaskCreated);
    }
};
exports.VisitorIntakeService = VisitorIntakeService;
exports.VisitorIntakeService = VisitorIntakeService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof visitor_intake_repository_1.VisitorIntakeRepository !== "undefined" && visitor_intake_repository_1.VisitorIntakeRepository) === "function" ? _a : Object, typeof (_b = typeof person_service_1.PersonService !== "undefined" && person_service_1.PersonService) === "function" ? _b : Object, typeof (_c = typeof group_leadership_service_1.GroupLeadershipService !== "undefined" && group_leadership_service_1.GroupLeadershipService) === "function" ? _c : Object, typeof (_d = typeof follow_up_task_service_1.FollowUpTaskService !== "undefined" && follow_up_task_service_1.FollowUpTaskService) === "function" ? _d : Object])
], VisitorIntakeService);


/***/ }),
/* 113 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VisitorIntakeRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/**
 * Prisma-backed persistence for `gatherings.visitor_intake_submissions`
 * (FR-GTH-04/BR-GTH-03).
 */
let VisitorIntakeRepository = class VisitorIntakeRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.visitorIntakeSubmission.create({ data: input });
    }
};
exports.VisitorIntakeRepository = VisitorIntakeRepository;
exports.VisitorIntakeRepository = VisitorIntakeRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], VisitorIntakeRepository);


/***/ }),
/* 114 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GatheringScopeService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const gathering_repository_1 = __webpack_require__(97);
/**
 * Gatherings' public service interface (Blueprint §7.2) - extracted for
 * the Ministry milestone, the first cross-module consumer of Gathering
 * data. `StaffingTargetService.create()` (FR-MIN-02) needs to confirm the
 * `gatheringId` a Basonta Leader supplies actually exists, and belongs to
 * the same Branch as the target Basonta, before writing a `StaffingTarget`
 * row - the same "validate the cross-module reference before insert"
 * discipline `PledgeService.fulfill()` and `ExpenseService` already apply
 * to their own cross-entity references. Deliberately returns only
 * `branchId`, not a full `ResourceContext` - unlike `GroupScopeService`,
 * this is not used for RBAC scope resolution (a `StaffingTarget`'s scope
 * is its target Group, resolved via `GroupScopeService` as normal), only
 * for existence-plus-branch-match validation.
 */
let GatheringScopeService = class GatheringScopeService {
    gatheringRepository;
    constructor(gatheringRepository) {
        this.gatheringRepository = gatheringRepository;
    }
    async loadScope(gatheringId) {
        const gathering = await this.gatheringRepository.findById(gatheringId);
        if (!gathering) {
            throw new common_1.NotFoundException(`No Gathering found with id '${gatheringId}'`);
        }
        return { branchId: gathering.branchId };
    }
};
exports.GatheringScopeService = GatheringScopeService;
exports.GatheringScopeService = GatheringScopeService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof gathering_repository_1.GatheringRepository !== "undefined" && gathering_repository_1.GatheringRepository) === "function" ? _a : Object])
], GatheringScopeService);


/***/ }),
/* 115 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InsightsModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const database_module_1 = __webpack_require__(12);
const rbac_platform_module_1 = __webpack_require__(17);
const people_module_1 = __webpack_require__(20);
const alert_controller_1 = __webpack_require__(116);
const dashboard_controller_1 = __webpack_require__(124);
const alert_resource_context_guard_1 = __webpack_require__(117);
const insights_dashboard_resource_context_guard_1 = __webpack_require__(125);
const alert_repository_1 = __webpack_require__(118);
const engagement_signal_repository_1 = __webpack_require__(127);
const pulse_score_history_repository_1 = __webpack_require__(123);
const pulse_score_repository_1 = __webpack_require__(128);
const alert_service_1 = __webpack_require__(119);
const engagement_signal_service_1 = __webpack_require__(129);
const pulse_score_service_1 = __webpack_require__(126);
/**
 * InsightsModule (PRD §13.6 / Blueprint §4.2 module inventory) - the
 * fifth bounded-context module, and (per `app.module.ts`'s own prior doc
 * comment) the last of the six before Ministry. Internal layout mirrors
 * `StewardshipModule`'s own doc comment.
 *
 * Imports `PeopleModule` as an ordinary import (no `forwardRef`) for
 * `GroupScopeService` - the third bounded-context consumer of that
 * cross-module service after Gatherings and Stewardship.
 *
 * Exports `EngagementSignalService` - unlike every other module built so
 * far, this is deliberately made available for cross-module/future
 * consumption: it is the landing point a future `apps/worker` Engagement
 * Signal consumer (Blueprint Ch.4's EventBridge/SQS bus, which does not
 * exist yet - see `INSIGHTS_DESIGN_NOTES.md`) would call, and in
 * principle any other bounded-context module could call it directly too
 * once that architecture is in place. No route in this module calls it -
 * see `EngagementSignalService`'s own doc comment for why it has no
 * controller.
 */
let InsightsModule = class InsightsModule {
};
exports.InsightsModule = InsightsModule;
exports.InsightsModule = InsightsModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, rbac_platform_module_1.RbacPlatformModule, people_module_1.PeopleModule],
        controllers: [dashboard_controller_1.DashboardController, alert_controller_1.AlertController],
        providers: [
            engagement_signal_repository_1.EngagementSignalRepository,
            pulse_score_repository_1.PulseScoreRepository,
            pulse_score_history_repository_1.PulseScoreHistoryRepository,
            alert_repository_1.AlertRepository,
            engagement_signal_service_1.EngagementSignalService,
            alert_service_1.AlertService,
            pulse_score_service_1.PulseScoreService,
            insights_dashboard_resource_context_guard_1.BranchDashboardResourceContextGuard,
            insights_dashboard_resource_context_guard_1.GroupDashboardResourceContextGuard,
            alert_resource_context_guard_1.AlertResourceContextGuard,
        ],
        exports: [engagement_signal_service_1.EngagementSignalService],
    })
], InsightsModule);


/***/ }),
/* 116 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AlertController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const alert_resource_context_guard_1 = __webpack_require__(117);
const alert_service_1 = __webpack_require__(119);
/**
 * `GET/PATCH /insights/alerts/:id` (FR-INS-03/05). Single-Alert
 * read/resolve - the scoped-by-dashboard alert lists (branch/bacenta/
 * cluster) already serve the "inbox" browsing surface; this controller
 * is for acting on one specific alert once a leader has found it there.
 */
let AlertController = class AlertController {
    alertService;
    constructor(alertService) {
        this.alertService = alertService;
    }
    getById(id) {
        return this.alertService.getById(id);
    }
    resolve(actor, id, body) {
        return this.alertService.resolve(actor.personId, id, body);
    }
};
exports.AlertController = AlertController;
tslib_1.__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_1.RequirePermission)('insights.alert.read'),
    (0, common_1.UseGuards)(alert_resource_context_guard_1.AlertResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], AlertController.prototype, "getById", null);
tslib_1.__decorate([
    (0, common_1.Patch)(':id/resolve'),
    (0, rbac_1.RequirePermission)('insights.alert.resolve'),
    (0, common_1.UseGuards)(alert_resource_context_guard_1.AlertResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.resolveAlertSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], AlertController.prototype, "resolve", null);
exports.AlertController = AlertController = tslib_1.__decorate([
    (0, common_1.Controller)('insights/alerts'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof alert_service_1.AlertService !== "undefined" && alert_service_1.AlertService) === "function" ? _a : Object])
], AlertController);


/***/ }),
/* 117 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AlertResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const group_scope_service_1 = __webpack_require__(53);
const alert_repository_1 = __webpack_require__(118);
/**
 * `GET/PATCH /insights/alerts/:id` (read/resolve, FR-INS-03/05). Loads
 * the target Alert and resolves its `ResourceContext` from its own
 * `scopeType`/`scopeId` pair - `GROUP` resolves via People's
 * `GroupScopeService` (same pattern the dashboard guards use), `BRANCH`
 * resolves to the Alert's own `branchId` directly. `PERSON` is handled
 * defensively (falls back to the branch-only shape) but is unreachable in
 * practice - `PulseScoreService`/`AlertService` never construct a
 * `PERSON`-scoped Alert (NFR-PRIV-02).
 */
let AlertResourceContextGuard = class AlertResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    alertRepository;
    groupScopeService;
    constructor(branchConfigurationService, alertRepository, groupScopeService) {
        super(branchConfigurationService);
        this.alertRepository = alertRepository;
        this.groupScopeService = groupScopeService;
    }
    async loadResource(request, _actor) {
        const id = request.params.id;
        const alert = await this.alertRepository.findById(id);
        if (!alert) {
            throw new common_1.NotFoundException(`No Alert found with id '${id}'`);
        }
        if (alert.scopeType === 'GROUP') {
            return this.groupScopeService.loadResourceContext(alert.scopeId);
        }
        return { branchId: alert.branchId };
    }
};
exports.AlertResourceContextGuard = AlertResourceContextGuard;
exports.AlertResourceContextGuard = AlertResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof alert_repository_1.AlertRepository !== "undefined" && alert_repository_1.AlertRepository) === "function" ? _b : Object, typeof (_c = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _c : Object])
], AlertResourceContextGuard);


/***/ }),
/* 118 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AlertRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/** Prisma-backed persistence for `insights.alerts` (FR-INS-03/05). */
let AlertRepository = class AlertRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.alert.create({ data: input });
    }
    findById(id) {
        return this.prisma.alert.findUnique({ where: { id } });
    }
    /**
     * Whether an `OPEN` alert of this type already exists for this scope -
     * avoids re-raising a duplicate alert every time
     * `PulseScoreService`'s compute-on-read recomputation finds the same
     * still-ongoing decline. No scheduler/dedup-window infrastructure
     * exists in this codebase to do this any other way - see
     * `INSIGHTS_DESIGN_NOTES.md`.
     */
    async hasOpenAlert(scopeType, scopeId, alertType) {
        const existing = await this.prisma.alert.findFirst({
            where: { scopeType, scopeId, alertType, status: 'OPEN' },
        });
        return existing !== null;
    }
    /** Every alert for a scope, most recent first - the per-dashboard
     * "alert inbox" slice (branch/bacenta/cluster dashboards each embed
     * this for their own scope; see `INSIGHTS_DESIGN_NOTES.md` for why
     * there is no separate cross-cutting multi-scope inbox endpoint). */
    listByScope(scopeType, scopeId) {
        return this.prisma.alert.findMany({ where: { scopeType, scopeId }, orderBy: { triggeredAt: 'desc' } });
    }
    resolve(id, input) {
        return this.prisma.alert.update({
            where: { id },
            data: { status: input.status, resolvedByPersonId: input.resolvedByPersonId, resolvedAt: input.resolvedAt },
        });
    }
};
exports.AlertRepository = AlertRepository;
exports.AlertRepository = AlertRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], AlertRepository);


/***/ }),
/* 119 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AlertService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const domain_insights_1 = __webpack_require__(120);
const alert_repository_1 = __webpack_require__(118);
const pulse_score_history_repository_1 = __webpack_require__(123);
/** The one alert type this milestone raises - FR-INS-03 names only the
 * trend-decline case; §16.6's capabilities table names no other alert
 * category for Release 1. */
const PULSE_DECLINE_ALERT_TYPE = 'PULSE_DECLINE';
function toResponseDto(alert) {
    return {
        id: alert.id,
        branchId: alert.branchId,
        scopeType: alert.scopeType,
        scopeId: alert.scopeId,
        alertType: alert.alertType,
        message: alert.message,
        status: alert.status,
        resolvedByPersonId: alert.resolvedByPersonId,
        resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
        triggeredAt: alert.triggeredAt.toISOString(),
    };
}
/**
 * FR-INS-03 (trend/threshold alerting) and FR-INS-05 (record whether a
 * leader acted on or dismissed an alert).
 */
let AlertService = class AlertService {
    alertRepository;
    pulseScoreHistoryRepository;
    constructor(alertRepository, pulseScoreHistoryRepository) {
        this.alertRepository = alertRepository;
        this.pulseScoreHistoryRepository = pulseScoreHistoryRepository;
    }
    /**
     * Called by `PulseScoreService` immediately after it appends a fresh
     * `PulseScoreHistory` point - evaluates the trailing-window trend via
     * `evaluatePulseTrend()` and raises a new Alert only if (a) the trend
     * has genuinely declined past the threshold and (b) no `OPEN` alert of
     * this type already exists for this scope
     * (`AlertRepository.hasOpenAlert`'s dedup). No scheduler exists in this
     * codebase to run this evaluation on its own cadence - every dashboard
     * read that happens to recompute the score is this evaluation's only
     * trigger. See `INSIGHTS_DESIGN_NOTES.md`.
     */
    async evaluateAndCreateIfNeeded(branchId, scopeType, scopeId, now) {
        const since = new Date(now.getTime() - domain_insights_1.DEFAULT_PULSE_TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        const history = await this.pulseScoreHistoryRepository.findRecentByScope(scopeType, scopeId, since);
        const evaluation = (0, domain_insights_1.evaluatePulseTrend)(history.map((point) => ({ score: point.score.toNumber(), computedAt: point.computedAt })), now);
        if (!evaluation.declined) {
            return;
        }
        const alreadyOpen = await this.alertRepository.hasOpenAlert(scopeType, scopeId, PULSE_DECLINE_ALERT_TYPE);
        if (alreadyOpen) {
            return;
        }
        await this.alertRepository.create({
            branchId,
            scopeType,
            scopeId,
            alertType: PULSE_DECLINE_ALERT_TYPE,
            message: evaluation.reason,
        });
    }
    async listForScope(scopeType, scopeId) {
        const alerts = await this.alertRepository.listByScope(scopeType, scopeId);
        return alerts.map(toResponseDto);
    }
    async getById(id) {
        const alert = await this.requireAlert(id);
        return toResponseDto(alert);
    }
    /** FR-INS-05: "each alert has a recorded resolution status (acted /
     * dismissed) attributable to the responding user" - `actorPersonId`
     * always comes from `ActorContext`, never a client-supplied field. */
    async resolve(actorPersonId, id, input) {
        await this.requireAlert(id);
        const resolved = await this.alertRepository.resolve(id, {
            status: input.status,
            resolvedByPersonId: actorPersonId,
            resolvedAt: new Date(),
        });
        return toResponseDto(resolved);
    }
    async requireAlert(id) {
        const alert = await this.alertRepository.findById(id);
        if (!alert) {
            throw new common_1.NotFoundException(`No Alert found with id '${id}'`);
        }
        return alert;
    }
};
exports.AlertService = AlertService;
exports.AlertService = AlertService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof alert_repository_1.AlertRepository !== "undefined" && alert_repository_1.AlertRepository) === "function" ? _a : Object, typeof (_b = typeof pulse_score_history_repository_1.PulseScoreHistoryRepository !== "undefined" && pulse_score_history_repository_1.PulseScoreHistoryRepository) === "function" ? _b : Object])
], AlertService);


/***/ }),
/* 120 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(8);
tslib_1.__exportStar(__webpack_require__(121), exports);
tslib_1.__exportStar(__webpack_require__(122), exports);


/***/ }),
/* 121 */
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
/* 122 */
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
/* 123 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PulseScoreHistoryRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/**
 * Prisma-backed persistence for `insights.pulse_score_history` - the full
 * time series `evaluatePulseTrend()` (FR-INS-03,
 * `libs/domain/insights`) reads from. Append-only, mirroring
 * `EngagementSignalRepository`.
 */
let PulseScoreHistoryRepository = class PulseScoreHistoryRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    append(input) {
        return this.prisma.pulseScoreHistory.create({ data: input });
    }
    findRecentByScope(scopeType, scopeId, since) {
        return this.prisma.pulseScoreHistory.findMany({
            where: { scopeType, scopeId, computedAt: { gte: since } },
            orderBy: { computedAt: 'asc' },
        });
    }
};
exports.PulseScoreHistoryRepository = PulseScoreHistoryRepository;
exports.PulseScoreHistoryRepository = PulseScoreHistoryRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], PulseScoreHistoryRepository);


/***/ }),
/* 124 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DashboardController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const current_actor_decorator_1 = __webpack_require__(43);
const group_scope_service_1 = __webpack_require__(53);
const insights_dashboard_resource_context_guard_1 = __webpack_require__(125);
const alert_service_1 = __webpack_require__(119);
const pulse_score_service_1 = __webpack_require__(126);
/**
 * FR-INS-04: role-scoped Insights dashboards (Resident Pastor -> whole
 * Branch, Assistant Pastor -> own cluster, Shepherd -> own Bacenta).
 * Each response embeds both the freshly compute-on-read Church Pulse
 * score (`PulseScoreService`, FR-INS-01) and that same scope's own alert
 * list (§16.6's "Alert inbox" surface - deliberately served per-dashboard
 * here rather than as a separate cross-cutting endpoint; see
 * `INSIGHTS_DESIGN_NOTES.md`).
 *
 * `bacenta-dashboard` and `cluster-dashboard` are near-identical
 * single-Bacenta drill-downs - see `GroupDashboardResourceContextGuard`'s
 * doc comment for why a true multi-Bacenta ranked list (US-G2) is not
 * built this milestone.
 */
let DashboardController = class DashboardController {
    pulseScoreService;
    alertService;
    groupScopeService;
    constructor(pulseScoreService, alertService, groupScopeService) {
        this.pulseScoreService = pulseScoreService;
        this.alertService = alertService;
        this.groupScopeService = groupScopeService;
    }
    async getBranchDashboard(actor) {
        const pulseScore = await this.pulseScoreService.computeAndStoreBranchScore(actor.branchId);
        const alerts = await this.alertService.listForScope('BRANCH', actor.branchId);
        return { branchId: actor.branchId, pulseScore, alerts };
    }
    getBacentaDashboard(groupId) {
        return this.getGroupDashboard(groupId);
    }
    getClusterDashboard(groupId) {
        return this.getGroupDashboard(groupId);
    }
    async getGroupDashboard(groupId) {
        // Resolved independently of the guard's own identical lookup - the
        // guard's result is used only for authorization
        // (`EcclesiaRequestContext`, not exposed to controllers) and this
        // service call needs the Group's actual `branchId` (not assumed to
        // equal the actor's own), per `PulseScoreService.computeAndStoreGroupScore`'s
        // signature.
        const scope = await this.groupScopeService.loadResourceContext(groupId);
        const pulseScore = await this.pulseScoreService.computeAndStoreGroupScore(scope.branchId, groupId);
        const alerts = await this.alertService.listForScope('GROUP', groupId);
        return { branchId: scope.branchId, groupId, pulseScore, alerts };
    }
};
exports.DashboardController = DashboardController;
tslib_1.__decorate([
    (0, common_1.Get)('branch-dashboard'),
    (0, rbac_1.RequirePermission)('insights.branch_dashboard.read'),
    (0, common_1.UseGuards)(insights_dashboard_resource_context_guard_1.BranchDashboardResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], DashboardController.prototype, "getBranchDashboard", null);
tslib_1.__decorate([
    (0, common_1.Get)('bacenta-dashboard/:groupId'),
    (0, rbac_1.RequirePermission)('insights.bacenta_dashboard.read'),
    (0, common_1.UseGuards)(insights_dashboard_resource_context_guard_1.GroupDashboardResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('groupId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], DashboardController.prototype, "getBacentaDashboard", null);
tslib_1.__decorate([
    (0, common_1.Get)('cluster-dashboard/:groupId'),
    (0, rbac_1.RequirePermission)('insights.cluster_dashboard.read'),
    (0, common_1.UseGuards)(insights_dashboard_resource_context_guard_1.GroupDashboardResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('groupId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], DashboardController.prototype, "getClusterDashboard", null);
exports.DashboardController = DashboardController = tslib_1.__decorate([
    (0, common_1.Controller)('insights'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof pulse_score_service_1.PulseScoreService !== "undefined" && pulse_score_service_1.PulseScoreService) === "function" ? _a : Object, typeof (_b = typeof alert_service_1.AlertService !== "undefined" && alert_service_1.AlertService) === "function" ? _b : Object, typeof (_c = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _c : Object])
], DashboardController);


/***/ }),
/* 125 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroupDashboardResourceContextGuard = exports.BranchDashboardResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const group_scope_service_1 = __webpack_require__(53);
/**
 * `GET /insights/branch-dashboard` (FR-INS-04, Resident Pastor's
 * whole-Branch view). Always resolves to just the actor's own Branch -
 * the `BRANCH`-scoped rows (`RESIDENT_PASTOR`/`ASSISTANT_PASTOR`/`ADMIN`)
 * are this endpoint's intended consumers, mirroring
 * `FinancialTransactionListResourceContextGuard`'s identical precedent
 * (Stewardship's `GET /financial-transactions`).
 */
let BranchDashboardResourceContextGuard = class BranchDashboardResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    constructor(branchConfigurationService) {
        super(branchConfigurationService);
    }
    async loadResource(_request, actor) {
        return { branchId: actor.branchId };
    }
};
exports.BranchDashboardResourceContextGuard = BranchDashboardResourceContextGuard;
exports.BranchDashboardResourceContextGuard = BranchDashboardResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object])
], BranchDashboardResourceContextGuard);
/**
 * `GET /insights/bacenta-dashboard/:groupId` and
 * `GET /insights/cluster-dashboard/:groupId` (FR-INS-04, Shepherd's own
 * Bacenta / Assistant Pastor's cluster drill-down). Both routes share
 * this one guard - they differ only in which `@RequirePermission` action
 * (and therefore which `permission-matrix.ts` scope rows) applies, not in
 * how the target Group's `ResourceContext` is resolved. Reuses People's
 * exported `GroupScopeService` (Blueprint §7.2), the third consumer of
 * that cross-module service after Gatherings and Stewardship.
 *
 * The cluster route is a **single-Bacenta drill-down**, not a true
 * multi-Bacenta ranked list - `evaluate.ts`'s `resourceInScope()` CLUSTER
 * case tests one `resource.bacentaId` against the actor's
 * `clusterBacentaIds` set; there is no `ResourceContext` shape for "many
 * Bacentas at once" under the current single-resource model. See
 * `INSIGHTS_DESIGN_NOTES.md` for the disclosed gap (same category as
 * People's deferred search/directory).
 */
let GroupDashboardResourceContextGuard = class GroupDashboardResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    groupScopeService;
    constructor(branchConfigurationService, groupScopeService) {
        super(branchConfigurationService);
        this.groupScopeService = groupScopeService;
    }
    async loadResource(request, _actor) {
        const groupId = request.params.groupId;
        return this.groupScopeService.loadResourceContext(groupId);
    }
};
exports.GroupDashboardResourceContextGuard = GroupDashboardResourceContextGuard;
exports.GroupDashboardResourceContextGuard = GroupDashboardResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_b = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _b : Object, typeof (_c = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _c : Object])
], GroupDashboardResourceContextGuard);


/***/ }),
/* 126 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PulseScoreService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const domain_insights_1 = __webpack_require__(120);
const engagement_signal_repository_1 = __webpack_require__(127);
const pulse_score_history_repository_1 = __webpack_require__(123);
const pulse_score_repository_1 = __webpack_require__(128);
const alert_service_1 = __webpack_require__(119);
function toResponseDto(pulseScore) {
    return {
        id: pulseScore.id,
        branchId: pulseScore.branchId,
        scopeType: pulseScore.scopeType,
        scopeId: pulseScore.scopeId,
        score: pulseScore.score.toNumber(),
        computedAt: pulseScore.computedAt.toISOString(),
    };
}
/** Falls back to `DEFAULT_CHURCH_PULSE_WEIGHTS` (OQ-10's equal-sixths
 * placeholder) when a Branch has no `church_pulse_weights` configured
 * yet, or when its configured value contains no recognized signal-type
 * keys - defensive against a partially/incorrectly configured Branch,
 * matching `computeChurchPulseScore()`'s own "missing category = 0"
 * philosophy rather than throwing. */
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
 * FR-INS-01: computes and stores Church Pulse for **Group (Bacenta) and
 * Branch scope only**.
 *
 * **NFR-PRIV-02 (RISK-06) is a hard release gate, not a scope-management
 * choice**: "Person-level Church Pulse scoring must not ship until a
 * separate access-control review is complete." This class deliberately
 * has no `computeAndStorePersonScore` method and no code path capable of
 * constructing a `PERSON`-scoped `PulseScore`/`PulseScoreHistory` row -
 * both public methods below hard-code `scopeType` to `'BRANCH'` or
 * `'GROUP'`.
 *
 * **Compute-on-read.** No scheduler/worker exists in this codebase (see
 * `INSIGHTS_DESIGN_NOTES.md`) to run this on the "defined cadence"
 * FR-INS-01's acceptance criteria describes. Every call recomputes the
 * score fresh from the trailing `DEFAULT_CHURCH_PULSE_WINDOW_DAYS`-day
 * window of `EngagementSignal` rows, upserts the `PulseScore` "current"
 * row, appends a `PulseScoreHistory` point, and hands off to
 * `AlertService.evaluateAndCreateIfNeeded` (FR-INS-03) - all as a side
 * effect of a dashboard endpoint being read, not a background job.
 */
let PulseScoreService = class PulseScoreService {
    engagementSignalRepository;
    pulseScoreRepository;
    pulseScoreHistoryRepository;
    alertService;
    constructor(engagementSignalRepository, pulseScoreRepository, pulseScoreHistoryRepository, alertService) {
        this.engagementSignalRepository = engagementSignalRepository;
        this.pulseScoreRepository = pulseScoreRepository;
        this.pulseScoreHistoryRepository = pulseScoreHistoryRepository;
        this.alertService = alertService;
    }
    computeAndStoreBranchScore(branchId) {
        return this.computeAndStore(branchId, 'BRANCH', branchId, undefined);
    }
    computeAndStoreGroupScore(branchId, groupId) {
        return this.computeAndStore(branchId, 'GROUP', groupId, groupId);
    }
    async computeAndStore(branchId, scopeType, scopeId, groupIdFilter) {
        const now = new Date();
        const windowStart = new Date(now.getTime() - domain_insights_1.DEFAULT_CHURCH_PULSE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        const counts = await this.engagementSignalRepository.countByTypeInWindow(branchId, groupIdFilter, windowStart, now);
        const signalCountsByType = {};
        for (const row of counts) {
            if ((0, domain_insights_1.isChurchPulseSignalType)(row.signalType)) {
                signalCountsByType[row.signalType] = row.count;
            }
        }
        const rawWeights = await this.pulseScoreRepository.findChurchPulseWeights(branchId);
        const weights = toWeightsRecord(rawWeights);
        const score = (0, domain_insights_1.computeChurchPulseScore)(signalCountsByType, weights);
        const pulseScore = await this.pulseScoreRepository.upsert({ branchId, scopeType, scopeId, score, computedAt: now });
        await this.pulseScoreHistoryRepository.append({ branchId, scopeType, scopeId, score, computedAt: now });
        await this.alertService.evaluateAndCreateIfNeeded(branchId, scopeType, scopeId, now);
        return toResponseDto(pulseScore);
    }
};
exports.PulseScoreService = PulseScoreService;
exports.PulseScoreService = PulseScoreService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof engagement_signal_repository_1.EngagementSignalRepository !== "undefined" && engagement_signal_repository_1.EngagementSignalRepository) === "function" ? _a : Object, typeof (_b = typeof pulse_score_repository_1.PulseScoreRepository !== "undefined" && pulse_score_repository_1.PulseScoreRepository) === "function" ? _b : Object, typeof (_c = typeof pulse_score_history_repository_1.PulseScoreHistoryRepository !== "undefined" && pulse_score_history_repository_1.PulseScoreHistoryRepository) === "function" ? _c : Object, typeof (_d = typeof alert_service_1.AlertService !== "undefined" && alert_service_1.AlertService) === "function" ? _d : Object])
], PulseScoreService);


/***/ }),
/* 127 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EngagementSignalRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/**
 * Prisma-backed persistence for `insights.engagement_signals` - an
 * append-only stream (Blueprint §4.3 rule 3, PRD §12.8). No `update`/
 * `delete` method exists here by design, mirroring
 * `financial_transaction_events`' own event-log precedent.
 */
let EngagementSignalRepository = class EngagementSignalRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.engagementSignal.create({ data: input });
    }
    /**
     * Raw signal counts per type within a trailing window, scoped either to
     * a whole Branch (`groupId` omitted) or to one Group within it
     * (`groupId` supplied) - the two shapes `PulseScoreService` needs for
     * Branch-level vs. Group-level Church Pulse (FR-INS-01). Deliberately
     * has no `personId` filter parameter - see `PulseScoreService`'s doc
     * comment (NFR-PRIV-02: Person-level scoring must not ship).
     */
    async countByTypeInWindow(branchId, groupId, windowStart, now) {
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
};
exports.EngagementSignalRepository = EngagementSignalRepository;
exports.EngagementSignalRepository = EngagementSignalRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], EngagementSignalRepository);


/***/ }),
/* 128 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PulseScoreRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/**
 * Prisma-backed persistence for `insights.pulse_scores` - the current/
 * latest score per scope (see `PulseScore`'s own doc comment in
 * `db/schema.prisma` for why this is split from `pulse_score_history`).
 */
let PulseScoreRepository = class PulseScoreRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    upsert(input) {
        return this.prisma.pulseScore.upsert({
            where: { scopeType_scopeId: { scopeType: input.scopeType, scopeId: input.scopeId } },
            create: input,
            update: { score: input.score, computedAt: input.computedAt },
        });
    }
    findByScope(scopeType, scopeId) {
        return this.prisma.pulseScore.findUnique({ where: { scopeType_scopeId: { scopeType, scopeId } } });
    }
    /**
     * Reads `platform.configurations.church_pulse_weights` for a Branch
     * (FR-INS-02/OQ-10) - queried directly via Prisma rather than through
     * `BranchConfigurationService` (`apps/api/src/platform/rbac`), since
     * that service's `BranchConfiguration` shape only carries
     * `poimenGateEnabled` (Blueprint §9.3's own record-level-check need);
     * widening a libs/rbac-facing contract for an Insights-only field would
     * be the wrong layer for it. Mirrors `FinancialTransactionRepository`'s
     * own precedent of querying `platform.*` tables directly as shared
     * infrastructure (Blueprint §7.2), not a module-boundary violation.
     * Returns `null` (not a thrown error) when unconfigured - "a Branch has
     * not yet touched the H2 weight-configuration screen" is the expected
     * steady state for every Branch in this milestone, since FR-INS-02
     * itself is H2 and not built here (see INSIGHTS_DESIGN_NOTES.md); the
     * caller falls back to `DEFAULT_CHURCH_PULSE_WEIGHTS`.
     */
    async findChurchPulseWeights(branchId) {
        const configuration = await this.prisma.configuration.findUnique({
            where: { branchId },
            select: { churchPulseWeights: true },
        });
        if (!configuration || configuration.churchPulseWeights === null || typeof configuration.churchPulseWeights !== 'object') {
            return null;
        }
        // `churchPulseWeights` is Prisma's `JsonValue` (a broad recursive
        // union) - going through `unknown` first avoids TS2352 ("conversion
        // may be a mistake") that a direct cast to `Record<string, number>`
        // risks, since `JsonValue` and `Record<string, number>` don't
        // structurally overlap enough for TS to accept a direct assertion.
        return configuration.churchPulseWeights;
    }
};
exports.PulseScoreRepository = PulseScoreRepository;
exports.PulseScoreRepository = PulseScoreRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], PulseScoreRepository);


/***/ }),
/* 129 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EngagementSignalService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const engagement_signal_repository_1 = __webpack_require__(127);
/**
 * Insights' public service interface (Blueprint §7.2) for ingesting one
 * Engagement Signal. Deliberately has **no HTTP controller** in this
 * milestone: Blueprint §10.6 models every Engagement Signal as
 * asynchronous, arriving via the EventBridge/SQS bus described in
 * Blueprint Ch.4 and consumed by `apps/worker`, which does not exist yet
 * anywhere in this codebase (see `INSIGHTS_DESIGN_NOTES.md`'s disclosed
 * infra gap). This service is the landing point that future consumer
 * would call once it exists - injecting `EngagementSignalService` and
 * calling `record()` is then a one-line integration, not a redesign of
 * this module.
 */
let EngagementSignalService = class EngagementSignalService {
    engagementSignalRepository;
    constructor(engagementSignalRepository) {
        this.engagementSignalRepository = engagementSignalRepository;
    }
    record(input) {
        return this.engagementSignalRepository.create({
            branchId: input.branchId,
            personId: input.personId,
            groupId: input.groupId,
            signalType: input.signalType,
            // `payload` is validated as a plain JSON-shaped object by
            // `recordEngagementSignalSchema` (`z.record(z.string(), z.unknown())`)
            // but Zod's `unknown` values don't structurally satisfy Prisma's
            // `InputJsonValue` - the same category of Prisma-vs-TS type gap
            // `gathering.service.ts`'s `Prisma.JsonNull` fix addressed for a
            // nullable Json column; this one is non-nullable, so a plain cast
            // is enough (no `JsonNull` case to handle).
            payload: input.payload,
            occurredAt: new Date(input.occurredAt),
        });
    }
};
exports.EngagementSignalService = EngagementSignalService;
exports.EngagementSignalService = EngagementSignalService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof engagement_signal_repository_1.EngagementSignalRepository !== "undefined" && engagement_signal_repository_1.EngagementSignalRepository) === "function" ? _a : Object])
], EngagementSignalService);


/***/ }),
/* 130 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MinistryModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const database_module_1 = __webpack_require__(12);
const rbac_platform_module_1 = __webpack_require__(17);
const gatherings_module_1 = __webpack_require__(11);
const people_module_1 = __webpack_require__(20);
const roster_controller_1 = __webpack_require__(131);
const staffing_target_controller_1 = __webpack_require__(137);
const worker_availability_controller_1 = __webpack_require__(141);
const roster_resource_context_guard_1 = __webpack_require__(132);
const staffing_target_resource_context_guard_1 = __webpack_require__(138);
const worker_availability_resource_context_guard_1 = __webpack_require__(142);
const staffing_target_repository_1 = __webpack_require__(139);
const worker_availability_repository_1 = __webpack_require__(144);
const roster_service_1 = __webpack_require__(133);
const staffing_target_service_1 = __webpack_require__(140);
const worker_availability_service_1 = __webpack_require__(143);
/**
 * MinistryModule (PRD §13.3 / Blueprint §4.2 module inventory) - the
 * sixth and last bounded-context module in the locked roadmap. Internal
 * layout mirrors every prior module's own doc comment.
 *
 * **Basonta creation (FR-MIN-01) is not reimplemented here.** It is
 * already fully functional through People's existing
 * `GroupController`/`GroupService`/`GroupRepository` - `Group.type` is a
 * plain, ungated parameter, so `type: 'MINISTRY'` already works today
 * with no repository changes. Likewise, roster add/remove is People's
 * existing `GroupMembershipController`/`GroupMembershipService`,
 * unchanged. This module owns only what's genuinely new: staffing
 * targets/adequacy (FR-MIN-02/03), worker availability (§16.3 H2), and
 * the roster/overcommitment *views* (FR-MIN-01/04) built on top of
 * People's data via its newly-exported `GroupRosterService`.
 *
 * Imports `PeopleModule` (for `GroupScopeService`, `GroupRosterService`)
 * and, for the first time in this codebase, `GatheringsModule` (for the
 * newly-exported `GatheringScopeService`, validating a `StaffingTarget`'s
 * `gatheringId` reference) - both as ordinary imports, no `forwardRef`;
 * neither People nor Gatherings needs anything from Ministry. See
 * `MINISTRY_DESIGN_NOTES.md`.
 *
 * Exports nothing - no other bounded-context module currently consumes a
 * Ministry service.
 */
let MinistryModule = class MinistryModule {
};
exports.MinistryModule = MinistryModule;
exports.MinistryModule = MinistryModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, rbac_platform_module_1.RbacPlatformModule, people_module_1.PeopleModule, gatherings_module_1.GatheringsModule],
        controllers: [staffing_target_controller_1.StaffingTargetController, worker_availability_controller_1.WorkerAvailabilityController, roster_controller_1.RosterController],
        providers: [
            staffing_target_repository_1.StaffingTargetRepository,
            worker_availability_repository_1.WorkerAvailabilityRepository,
            staffing_target_service_1.StaffingTargetService,
            worker_availability_service_1.WorkerAvailabilityService,
            roster_service_1.RosterService,
            staffing_target_resource_context_guard_1.StaffingTargetCreateResourceContextGuard,
            staffing_target_resource_context_guard_1.StaffingTargetResourceContextGuard,
            worker_availability_resource_context_guard_1.WorkerAvailabilityResourceContextGuard,
            roster_resource_context_guard_1.RosterResourceContextGuard,
        ],
    })
], MinistryModule);


/***/ }),
/* 131 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RosterController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const roster_resource_context_guard_1 = __webpack_require__(132);
const roster_service_1 = __webpack_require__(133);
/** FR-MIN-01/§16.3's "Basonta roster view" and FR-MIN-04's
 * overcommitment flag. */
let RosterController = class RosterController {
    rosterService;
    constructor(rosterService) {
        this.rosterService = rosterService;
    }
    listRoster(groupId) {
        return this.rosterService.listRoster(groupId);
    }
    listOvercommitmentFlags(groupId) {
        return this.rosterService.listOvercommitmentFlags(groupId);
    }
};
exports.RosterController = RosterController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    (0, rbac_1.RequirePermission)('ministry.roster.read'),
    (0, common_1.UseGuards)(roster_resource_context_guard_1.RosterResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('groupId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], RosterController.prototype, "listRoster", null);
tslib_1.__decorate([
    (0, common_1.Get)('overcommitment'),
    (0, rbac_1.RequirePermission)('ministry.roster.overcommitment.read'),
    (0, common_1.UseGuards)(roster_resource_context_guard_1.RosterResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('groupId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], RosterController.prototype, "listOvercommitmentFlags", null);
exports.RosterController = RosterController = tslib_1.__decorate([
    (0, common_1.Controller)('ministry/groups/:groupId/roster'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof roster_service_1.RosterService !== "undefined" && roster_service_1.RosterService) === "function" ? _a : Object])
], RosterController);


/***/ }),
/* 132 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RosterResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const group_scope_service_1 = __webpack_require__(53);
/** `GET /ministry/groups/:groupId/roster` and
 * `GET /ministry/groups/:groupId/roster/overcommitment` (FR-MIN-01/04) -
 * both resolve identically, differing only in `@RequirePermission`
 * action. */
let RosterResourceContextGuard = class RosterResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    groupScopeService;
    constructor(branchConfigurationService, groupScopeService) {
        super(branchConfigurationService);
        this.groupScopeService = groupScopeService;
    }
    async loadResource(request, _actor) {
        const groupId = request.params.groupId;
        return this.groupScopeService.loadResourceContext(groupId);
    }
};
exports.RosterResourceContextGuard = RosterResourceContextGuard;
exports.RosterResourceContextGuard = RosterResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _b : Object])
], RosterResourceContextGuard);


/***/ }),
/* 133 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RosterService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const domain_ministry_1 = __webpack_require__(134);
const group_roster_service_1 = __webpack_require__(80);
/**
 * FR-MIN-01/§16.3's "Basonta roster view" and FR-MIN-04's overcommitment
 * flag - both read-only views built on top of People's exported
 * `GroupRosterService`, not a new roster-membership mechanism of
 * Ministry's own (roster add/remove already happens through People's
 * `GroupMembershipService`, unchanged - see `MINISTRY_DESIGN_NOTES.md`).
 */
let RosterService = class RosterService {
    groupRosterService;
    constructor(groupRosterService) {
        this.groupRosterService = groupRosterService;
    }
    async listRoster(groupId) {
        const members = await this.groupRosterService.listActiveMembers(groupId);
        return members.map((member) => ({ personId: member.personId, startedAt: member.startedAt.toISOString() }));
    }
    /** Only the flagged (overcommitted) members are returned - this
     * endpoint *is* the flag list, not a full roster status report. See
     * `libs/domain/ministry`'s `overcommitment.ts` for what
     * "overcommitted" measures here. */
    async listOvercommitmentFlags(groupId) {
        const members = await this.groupRosterService.listActiveMembers(groupId);
        const flags = [];
        for (const member of members) {
            const concurrentCount = await this.groupRosterService.countActiveMinistryMembershipsForPerson(member.personId);
            const evaluation = (0, domain_ministry_1.evaluateOvercommitment)(concurrentCount);
            if (evaluation.overcommitted) {
                flags.push({
                    personId: member.personId,
                    concurrentCommitmentCount: evaluation.concurrentCommitmentCount,
                    threshold: evaluation.threshold,
                    overcommitted: true,
                });
            }
        }
        return flags;
    }
};
exports.RosterService = RosterService;
exports.RosterService = RosterService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof group_roster_service_1.GroupRosterService !== "undefined" && group_roster_service_1.GroupRosterService) === "function" ? _a : Object])
], RosterService);


/***/ }),
/* 134 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(8);
tslib_1.__exportStar(__webpack_require__(135), exports);
tslib_1.__exportStar(__webpack_require__(136), exports);


/***/ }),
/* 135 */
/***/ ((__unused_webpack_module, exports) => {


/**
 * FR-MIN-03: "compute and display staffing adequacy (rostered workers vs.
 * staffing target) per Basonta per upcoming Gathering." Acceptance
 * criterion: "A Basonta Leader sees a ratio (e.g., '5 of 8 rostered')
 * updating as workers are added to the roster."
 *
 * **"Rostered" = active Basonta `GroupMembership`, not a per-Gathering
 * roster assignment.** `db/schema.prisma`'s `ministry` schema models only
 * `StaffingTarget` (a target count against one Group+Gathering pair) - no
 * separate "who is assigned to serve at this specific Gathering" entity
 * exists. The acceptance criterion's own wording ("updating as workers
 * are added to the roster") confirms this reading: adding a worker to the
 * roster means opening a `GroupMembership` (People's existing
 * `GroupMembershipService`), not a Ministry-owned per-Gathering
 * assignment action. `computeStaffingAdequacy()` is therefore a pure
 * function of two counts the caller already has - a target and a current
 * roster size - not a query itself.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.computeStaffingAdequacy = computeStaffingAdequacy;
function computeStaffingAdequacy(targetCount, rosteredCount) {
    const ratio = targetCount <= 0 ? 1 : rosteredCount / targetCount;
    return {
        targetCount,
        rosteredCount,
        ratio: Math.round(ratio * 100) / 100,
        isAdequate: rosteredCount >= targetCount,
    };
}


/***/ }),
/* 136 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEFAULT_OVERCOMMITMENT_THRESHOLD = void 0;
exports.evaluateOvercommitment = evaluateOvercommitment;
/**
 * FR-MIN-04: "flag a Person as rostered across a configurable-threshold
 * number of concurrent Basontas/Gatherings as a possible overcommitment."
 * Acceptance criterion: "A worker rostered on 4+ overlapping Gathering
 * commitments in one week is flagged to their Basonta Leader(s)."
 *
 * **Modeled proxy, not the literal acceptance criterion.** The
 * acceptance criterion's own wording is about *Gathering*-level overlap
 * within one week - but `db/schema.prisma`'s `ministry` schema has no
 * per-Gathering roster-assignment entity (see `staffing-adequacy.ts`'s
 * own doc comment), so a Person's specific concurrent *Gathering*
 * commitments cannot be computed at all against the existing schema.
 * The closest computable proxy is a Person's count of concurrent active
 * Basonta (`GroupType.MINISTRY`) `GroupMembership` rows - a Person
 * serving in many Basontas at once is a reasonable, disclosed
 * approximation of "overcommitted," but is not the same measurement the
 * acceptance criterion describes. True Gathering-level overlap detection
 * needs a schema addition outside an application-layer milestone's
 * scope - the same "needs a schema change, not an engineering guess"
 * framing the Stewardship milestone used for FR-STW-07's bank-deposit
 * comparison. See `apps/api/src/modules/ministry/MINISTRY_DESIGN_NOTES.md`.
 *
 * `DEFAULT_OVERCOMMITMENT_THRESHOLD = 4` is `[PRD-DERIVED]` from the
 * acceptance criterion's own "4+" example - the one concrete number the
 * PRD gives anywhere for this rule, even though it was stated against a
 * different (uncomputable) measurement than the one actually used here.
 */
exports.DEFAULT_OVERCOMMITMENT_THRESHOLD = 4;
function evaluateOvercommitment(concurrentCommitmentCount, threshold = exports.DEFAULT_OVERCOMMITMENT_THRESHOLD) {
    return {
        concurrentCommitmentCount,
        threshold,
        overcommitted: concurrentCommitmentCount >= threshold,
    };
}


/***/ }),
/* 137 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StaffingTargetController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const staffing_target_resource_context_guard_1 = __webpack_require__(138);
const staffing_target_service_1 = __webpack_require__(140);
/** FR-MIN-02/03. `create` doubles as "set or correct" (upsert) - see
 * `createStaffingTargetSchema`'s own doc comment. */
let StaffingTargetController = class StaffingTargetController {
    staffingTargetService;
    constructor(staffingTargetService) {
        this.staffingTargetService = staffingTargetService;
    }
    create(actor, body) {
        return this.staffingTargetService.create(actor, body);
    }
    getById(id) {
        return this.staffingTargetService.getById(id);
    }
};
exports.StaffingTargetController = StaffingTargetController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, rbac_1.RequirePermission)('ministry.staffing_target.create'),
    (0, common_1.UseGuards)(staffing_target_resource_context_guard_1.StaffingTargetCreateResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createStaffingTargetSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], StaffingTargetController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_1.RequirePermission)('ministry.staffing_target.read'),
    (0, common_1.UseGuards)(staffing_target_resource_context_guard_1.StaffingTargetResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], StaffingTargetController.prototype, "getById", null);
exports.StaffingTargetController = StaffingTargetController = tslib_1.__decorate([
    (0, common_1.Controller)('ministry/staffing-targets'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof staffing_target_service_1.StaffingTargetService !== "undefined" && staffing_target_service_1.StaffingTargetService) === "function" ? _a : Object])
], StaffingTargetController);


/***/ }),
/* 138 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StaffingTargetResourceContextGuard = exports.StaffingTargetCreateResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const group_scope_service_1 = __webpack_require__(53);
const staffing_target_repository_1 = __webpack_require__(139);
/** `POST /ministry/staffing-targets` (FR-MIN-02) - resolves scope from
 * the target Basonta named in the request body, reusing People's
 * exported `GroupScopeService` exactly as Stewardship/Insights already
 * do. */
let StaffingTargetCreateResourceContextGuard = class StaffingTargetCreateResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    groupScopeService;
    constructor(branchConfigurationService, groupScopeService) {
        super(branchConfigurationService);
        this.groupScopeService = groupScopeService;
    }
    async loadResource(request, _actor) {
        const groupId = request.body?.groupId;
        if (!groupId) {
            throw new common_1.NotFoundException("Request body must include a 'groupId'");
        }
        return this.groupScopeService.loadResourceContext(groupId);
    }
};
exports.StaffingTargetCreateResourceContextGuard = StaffingTargetCreateResourceContextGuard;
exports.StaffingTargetCreateResourceContextGuard = StaffingTargetCreateResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _b : Object])
], StaffingTargetCreateResourceContextGuard);
/** `GET /ministry/staffing-targets/:id`. */
let StaffingTargetResourceContextGuard = class StaffingTargetResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    staffingTargetRepository;
    groupScopeService;
    constructor(branchConfigurationService, staffingTargetRepository, groupScopeService) {
        super(branchConfigurationService);
        this.staffingTargetRepository = staffingTargetRepository;
        this.groupScopeService = groupScopeService;
    }
    async loadResource(request, _actor) {
        const id = request.params.id;
        const target = await this.staffingTargetRepository.findById(id);
        if (!target) {
            throw new common_1.NotFoundException(`No Staffing Target found with id '${id}'`);
        }
        return this.groupScopeService.loadResourceContext(target.groupId);
    }
};
exports.StaffingTargetResourceContextGuard = StaffingTargetResourceContextGuard;
exports.StaffingTargetResourceContextGuard = StaffingTargetResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_c = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _c : Object, typeof (_d = typeof staffing_target_repository_1.StaffingTargetRepository !== "undefined" && staffing_target_repository_1.StaffingTargetRepository) === "function" ? _d : Object, typeof (_e = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _e : Object])
], StaffingTargetResourceContextGuard);


/***/ }),
/* 139 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StaffingTargetRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/**
 * Prisma-backed persistence for `ministry.staffing_targets` (FR-MIN-02).
 * `create()` is deliberately an upsert keyed on `db/schema.prisma`'s
 * `@@unique([gatheringId, groupId])` - re-submitting a target for the
 * same (Gathering, Basonta) pair corrects it, the same
 * "re-recording is a correction, not a duplicate" precedent
 * `AttendanceRecordRepository.upsert()` already established for
 * `@@unique([gatheringId, personId])`.
 */
let StaffingTargetRepository = class StaffingTargetRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    upsert(input) {
        return this.prisma.staffingTarget.upsert({
            where: { gatheringId_groupId: { gatheringId: input.gatheringId, groupId: input.groupId } },
            create: input,
            update: { targetCount: input.targetCount },
        });
    }
    findById(id) {
        return this.prisma.staffingTarget.findUnique({ where: { id } });
    }
};
exports.StaffingTargetRepository = StaffingTargetRepository;
exports.StaffingTargetRepository = StaffingTargetRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], StaffingTargetRepository);


/***/ }),
/* 140 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StaffingTargetService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const domain_ministry_1 = __webpack_require__(134);
const gathering_scope_service_1 = __webpack_require__(114);
const group_roster_service_1 = __webpack_require__(80);
const staffing_target_repository_1 = __webpack_require__(139);
/**
 * FR-MIN-02/03: `create()` sets (or, via the repository's upsert,
 * corrects) a staffing target; every read embeds the live-computed
 * adequacy ratio (FR-MIN-03), "compute-on-read" the same way Insights'
 * `PulseScoreService` already established for Church Pulse.
 */
let StaffingTargetService = class StaffingTargetService {
    staffingTargetRepository;
    gatheringScopeService;
    groupRosterService;
    constructor(staffingTargetRepository, gatheringScopeService, groupRosterService) {
        this.staffingTargetRepository = staffingTargetRepository;
        this.gatheringScopeService = gatheringScopeService;
        this.groupRosterService = groupRosterService;
    }
    async create(actor, input) {
        const gatheringScope = await this.gatheringScopeService.loadScope(input.gatheringId);
        if (gatheringScope.branchId !== actor.branchId) {
            throw new common_1.ConflictException(`Gathering '${input.gatheringId}' does not belong to this Branch`);
        }
        const target = await this.staffingTargetRepository.upsert({
            branchId: actor.branchId,
            gatheringId: input.gatheringId,
            groupId: input.groupId,
            targetCount: input.targetCount,
            createdByPersonId: actor.personId,
        });
        return this.toResponseDto(target);
    }
    async getById(id) {
        const target = await this.requireTarget(id);
        return this.toResponseDto(target);
    }
    async toResponseDto(target) {
        const rosteredCount = await this.groupRosterService.countActiveMembers(target.groupId);
        const adequacy = (0, domain_ministry_1.computeStaffingAdequacy)(target.targetCount, rosteredCount);
        return {
            id: target.id,
            branchId: target.branchId,
            gatheringId: target.gatheringId,
            groupId: target.groupId,
            targetCount: target.targetCount,
            rosteredCount: adequacy.rosteredCount,
            ratio: adequacy.ratio,
            isAdequate: adequacy.isAdequate,
            createdByPersonId: target.createdByPersonId,
            createdAt: target.createdAt.toISOString(),
            updatedAt: target.updatedAt.toISOString(),
        };
    }
    async requireTarget(id) {
        const target = await this.staffingTargetRepository.findById(id);
        if (!target) {
            throw new common_1.NotFoundException(`No Staffing Target found with id '${id}'`);
        }
        return target;
    }
};
exports.StaffingTargetService = StaffingTargetService;
exports.StaffingTargetService = StaffingTargetService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof staffing_target_repository_1.StaffingTargetRepository !== "undefined" && staffing_target_repository_1.StaffingTargetRepository) === "function" ? _a : Object, typeof (_b = typeof gathering_scope_service_1.GatheringScopeService !== "undefined" && gathering_scope_service_1.GatheringScopeService) === "function" ? _b : Object, typeof (_c = typeof group_roster_service_1.GroupRosterService !== "undefined" && group_roster_service_1.GroupRosterService) === "function" ? _c : Object])
], StaffingTargetService);


/***/ }),
/* 141 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkerAvailabilityController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const worker_availability_resource_context_guard_1 = __webpack_require__(142);
const worker_availability_service_1 = __webpack_require__(143);
/** §16.3 H2's worker availability self-service surface. */
let WorkerAvailabilityController = class WorkerAvailabilityController {
    workerAvailabilityService;
    constructor(workerAvailabilityService) {
        this.workerAvailabilityService = workerAvailabilityService;
    }
    create(actor, body) {
        return this.workerAvailabilityService.create(actor, body);
    }
    listMine(actor) {
        return this.workerAvailabilityService.listForActor(actor);
    }
};
exports.WorkerAvailabilityController = WorkerAvailabilityController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, rbac_1.RequirePermission)('ministry.worker_availability.create'),
    (0, common_1.UseGuards)(worker_availability_resource_context_guard_1.WorkerAvailabilityResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.recordWorkerAvailabilitySchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], WorkerAvailabilityController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Get)(),
    (0, rbac_1.RequirePermission)('ministry.worker_availability.read'),
    (0, common_1.UseGuards)(worker_availability_resource_context_guard_1.WorkerAvailabilityResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], WorkerAvailabilityController.prototype, "listMine", null);
exports.WorkerAvailabilityController = WorkerAvailabilityController = tslib_1.__decorate([
    (0, common_1.Controller)('ministry/worker-availability'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof worker_availability_service_1.WorkerAvailabilityService !== "undefined" && worker_availability_service_1.WorkerAvailabilityService) === "function" ? _a : Object])
], WorkerAvailabilityController);


/***/ }),
/* 142 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkerAvailabilityResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
/** `POST/GET /ministry/worker-availability` - always the acting Person's
 * own record (`SELF` scope), the same shape for both routes since
 * neither takes a `personId` param - mirrors `PledgeCreateResourceContextGuard`. */
let WorkerAvailabilityResourceContextGuard = class WorkerAvailabilityResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    constructor(branchConfigurationService) {
        super(branchConfigurationService);
    }
    async loadResource(_request, actor) {
        return { branchId: actor.branchId, ownerId: actor.personId };
    }
};
exports.WorkerAvailabilityResourceContextGuard = WorkerAvailabilityResourceContextGuard;
exports.WorkerAvailabilityResourceContextGuard = WorkerAvailabilityResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object])
], WorkerAvailabilityResourceContextGuard);


/***/ }),
/* 143 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkerAvailabilityService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const worker_availability_repository_1 = __webpack_require__(144);
function toResponseDto(availability) {
    return {
        id: availability.id,
        branchId: availability.branchId,
        personId: availability.personId,
        unavailableFrom: availability.unavailableFrom.toISOString().slice(0, 10),
        unavailableTo: availability.unavailableTo.toISOString().slice(0, 10),
        reason: availability.reason,
        createdAt: availability.createdAt.toISOString(),
    };
}
/**
 * §16.3 H2's "Worker availability self-service" surface - always the
 * *acting* Person's own window (`SELF` scope,
 * `permission-matrix.ts`'s `ministry.worker_availability.*` rows), never
 * a client-supplied `personId`, the same reasoning
 * `createPledgeSchema`/`recordFinancialTransactionSchema` already apply
 * to their own SELF-scoped fields.
 */
let WorkerAvailabilityService = class WorkerAvailabilityService {
    workerAvailabilityRepository;
    constructor(workerAvailabilityRepository) {
        this.workerAvailabilityRepository = workerAvailabilityRepository;
    }
    async create(actor, input) {
        const availability = await this.workerAvailabilityRepository.create({
            branchId: actor.branchId,
            personId: actor.personId,
            unavailableFrom: new Date(input.unavailableFrom),
            unavailableTo: new Date(input.unavailableTo),
            reason: input.reason,
        });
        return toResponseDto(availability);
    }
    async listForActor(actor) {
        const list = await this.workerAvailabilityRepository.listByPerson(actor.personId);
        return list.map(toResponseDto);
    }
};
exports.WorkerAvailabilityService = WorkerAvailabilityService;
exports.WorkerAvailabilityService = WorkerAvailabilityService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof worker_availability_repository_1.WorkerAvailabilityRepository !== "undefined" && worker_availability_repository_1.WorkerAvailabilityRepository) === "function" ? _a : Object])
], WorkerAvailabilityService);


/***/ }),
/* 144 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkerAvailabilityRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/** Prisma-backed persistence for `ministry.worker_availability` (§16.3
 * H2: "lets a worker mark themselves unavailable for a date range"). */
let WorkerAvailabilityRepository = class WorkerAvailabilityRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.workerAvailability.create({ data: input });
    }
    listByPerson(personId) {
        return this.prisma.workerAvailability.findMany({
            where: { personId },
            orderBy: { unavailableFrom: 'desc' },
        });
    }
};
exports.WorkerAvailabilityRepository = WorkerAvailabilityRepository;
exports.WorkerAvailabilityRepository = WorkerAvailabilityRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], WorkerAvailabilityRepository);


/***/ }),
/* 145 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StewardshipModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const database_module_1 = __webpack_require__(12);
const rbac_platform_module_1 = __webpack_require__(17);
const people_module_1 = __webpack_require__(20);
const expense_controller_1 = __webpack_require__(146);
const financial_transaction_controller_1 = __webpack_require__(153);
const pledge_controller_1 = __webpack_require__(156);
const project_controller_1 = __webpack_require__(161);
const expense_resource_context_guard_1 = __webpack_require__(147);
const financial_transaction_resource_context_guard_1 = __webpack_require__(154);
const pledge_resource_context_guard_1 = __webpack_require__(157);
const project_resource_context_guard_1 = __webpack_require__(162);
const expense_repository_1 = __webpack_require__(148);
const financial_transaction_repository_1 = __webpack_require__(152);
const pledge_repository_1 = __webpack_require__(158);
const project_repository_1 = __webpack_require__(160);
const expense_service_1 = __webpack_require__(149);
const financial_transaction_service_1 = __webpack_require__(155);
const pledge_service_1 = __webpack_require__(159);
const project_service_1 = __webpack_require__(163);
/**
 * StewardshipModule (PRD §13.5 / Blueprint §4.2 module inventory) - the
 * fourth bounded-context module. Internal layout mirrors
 * `PeopleModule`/`PastoralCareModule`/`GatheringsModule`'s own doc
 * comments.
 *
 * Imports `PeopleModule` as an ordinary import (no `forwardRef`) for
 * `GroupScopeService` (Bacenta-recorded Financial Transactions) and
 * `PersonScopeService` (Expense requester scope) - the same cross-module
 * consumption pattern Gatherings already established. Unlike Gatherings,
 * this module does not need anything from Pastoral Care.
 *
 * Exports nothing yet - no other bounded-context module currently
 * consumes a Stewardship service, unlike People/Pastoral Care's mutual
 * dependency or Gatherings' consumption of both.
 */
let StewardshipModule = class StewardshipModule {
};
exports.StewardshipModule = StewardshipModule;
exports.StewardshipModule = StewardshipModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, rbac_platform_module_1.RbacPlatformModule, people_module_1.PeopleModule],
        controllers: [financial_transaction_controller_1.FinancialTransactionController, expense_controller_1.ExpenseController, project_controller_1.ProjectController, pledge_controller_1.PledgeController],
        providers: [
            financial_transaction_repository_1.FinancialTransactionRepository,
            expense_repository_1.ExpenseRepository,
            project_repository_1.ProjectRepository,
            pledge_repository_1.PledgeRepository,
            financial_transaction_service_1.FinancialTransactionService,
            expense_service_1.ExpenseService,
            project_service_1.ProjectService,
            pledge_service_1.PledgeService,
            financial_transaction_resource_context_guard_1.FinancialTransactionCreateResourceContextGuard,
            financial_transaction_resource_context_guard_1.FinancialTransactionResourceContextGuard,
            financial_transaction_resource_context_guard_1.FinancialTransactionListResourceContextGuard,
            expense_resource_context_guard_1.ExpenseCreateResourceContextGuard,
            expense_resource_context_guard_1.ExpenseResourceContextGuard,
            project_resource_context_guard_1.ProjectCreateResourceContextGuard,
            project_resource_context_guard_1.ProjectResourceContextGuard,
            pledge_resource_context_guard_1.PledgeCreateResourceContextGuard,
            pledge_resource_context_guard_1.PledgeResourceContextGuard,
        ],
    })
], StewardshipModule);


/***/ }),
/* 146 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExpenseController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const expense_resource_context_guard_1 = __webpack_require__(147);
const expense_service_1 = __webpack_require__(149);
/** PRD §17.3's "Expense: request/approve" rows, FR-STW-09, BR-STW-07/08. */
let ExpenseController = class ExpenseController {
    expenseService;
    constructor(expenseService) {
        this.expenseService = expenseService;
    }
    request(actor, body) {
        return this.expenseService.request(actor, body);
    }
    getById(id) {
        return this.expenseService.getById(id);
    }
    /** FR-STW-09: approver must not be the requester -
     * `DIFFERENT_ACTOR_THAN_RECORDER`, reused (see `ExpenseResourceContextGuard`'s
     * doc comment); the first consumer of `RecordLevelPolicyGuard` outside
     * the Financial Transaction sub-flow. */
    approve(actor, id) {
        return this.expenseService.approve(actor, id);
    }
    reject(actor, id, body) {
        return this.expenseService.reject(actor, id, body);
    }
    pay(actor, id) {
        return this.expenseService.pay(actor, id);
    }
    attachReceipt(actor, id, body) {
        return this.expenseService.attachReceipt(actor, id, body);
    }
};
exports.ExpenseController = ExpenseController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, rbac_1.RequirePermission)('stewardship.expense.request'),
    (0, common_1.UseGuards)(expense_resource_context_guard_1.ExpenseCreateResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.requestExpenseSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], ExpenseController.prototype, "request", null);
tslib_1.__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_1.RequirePermission)('stewardship.expense.read'),
    (0, common_1.UseGuards)(expense_resource_context_guard_1.ExpenseResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], ExpenseController.prototype, "getById", null);
tslib_1.__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, rbac_1.RequirePermission)('stewardship.expense.approve'),
    (0, common_1.UseGuards)(expense_resource_context_guard_1.ExpenseResourceContextGuard, rbac_1.RbacGuard, rbac_1.RecordLevelPolicyGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", void 0)
], ExpenseController.prototype, "approve", null);
tslib_1.__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, rbac_1.RequirePermission)('stewardship.expense.approve'),
    (0, common_1.UseGuards)(expense_resource_context_guard_1.ExpenseResourceContextGuard, rbac_1.RbacGuard, rbac_1.RecordLevelPolicyGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.rejectExpenseSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], ExpenseController.prototype, "reject", null);
tslib_1.__decorate([
    (0, common_1.Post)(':id/pay'),
    (0, rbac_1.RequirePermission)('stewardship.expense.pay'),
    (0, common_1.UseGuards)(expense_resource_context_guard_1.ExpenseResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", void 0)
], ExpenseController.prototype, "pay", null);
tslib_1.__decorate([
    (0, common_1.Post)(':id/receipt'),
    (0, rbac_1.RequirePermission)('stewardship.expense.receipt'),
    (0, common_1.UseGuards)(expense_resource_context_guard_1.ExpenseResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.attachExpenseReceiptSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], ExpenseController.prototype, "attachReceipt", null);
exports.ExpenseController = ExpenseController = tslib_1.__decorate([
    (0, common_1.Controller)('expenses'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof expense_service_1.ExpenseService !== "undefined" && expense_service_1.ExpenseService) === "function" ? _a : Object])
], ExpenseController);


/***/ }),
/* 147 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExpenseResourceContextGuard = exports.ExpenseCreateResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const person_scope_service_1 = __webpack_require__(58);
const expense_repository_1 = __webpack_require__(148);
/**
 * `POST /v1/expenses` (FR-STW-09). `db/schema.prisma`'s `Expense` has no
 * `groupId` field of its own (only `requestedByPersonId`) - scope is
 * resolved from the *requester's own* Person scope via People's exported
 * `PersonScopeService`, the same cross-module pattern already established
 * for Gatherings/Pastoral Care, applied here to the *acting* Person
 * (`actor.personId`) rather than some other resource's subject Person.
 */
let ExpenseCreateResourceContextGuard = class ExpenseCreateResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    personScopeService;
    constructor(branchConfigurationService, personScopeService) {
        super(branchConfigurationService);
        this.personScopeService = personScopeService;
    }
    async loadResource(_request, actor) {
        return this.personScopeService.loadResourceContext(actor.personId, actor);
    }
};
exports.ExpenseCreateResourceContextGuard = ExpenseCreateResourceContextGuard;
exports.ExpenseCreateResourceContextGuard = ExpenseCreateResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof person_scope_service_1.PersonScopeService !== "undefined" && person_scope_service_1.PersonScopeService) === "function" ? _b : Object])
], ExpenseCreateResourceContextGuard);
/**
 * `GET/POST /v1/expenses/:id/...` (approve/reject/pay/receipt/read).
 * Resolves scope from the Expense's own `requestedByPersonId` via
 * `PersonScopeService`, and always additionally sets
 * `resource.recordedByPersonId` to that same `requestedByPersonId` -
 * FR-STW-09's "approver must not be the requester" reuses
 * `DIFFERENT_ACTOR_THAN_RECORDER` (see `permission-matrix.ts`'s
 * `stewardship.expense.approve` rows), which reads that exact field
 * regardless of whether the underlying resource is a Financial
 * Transaction or, as here, an Expense.
 */
let ExpenseResourceContextGuard = class ExpenseResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    expenseRepository;
    personScopeService;
    constructor(branchConfigurationService, expenseRepository, personScopeService) {
        super(branchConfigurationService);
        this.expenseRepository = expenseRepository;
        this.personScopeService = personScopeService;
    }
    async loadResource(request, actor) {
        const id = request.params.id;
        const expense = await this.expenseRepository.findById(id);
        if (!expense) {
            throw new common_1.NotFoundException(`No Expense found with id '${id}'`);
        }
        const personScope = await this.personScopeService.loadResourceContext(expense.requestedByPersonId, actor);
        return { ...personScope, recordedByPersonId: expense.requestedByPersonId };
    }
};
exports.ExpenseResourceContextGuard = ExpenseResourceContextGuard;
exports.ExpenseResourceContextGuard = ExpenseResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_c = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _c : Object, typeof (_d = typeof expense_repository_1.ExpenseRepository !== "undefined" && expense_repository_1.ExpenseRepository) === "function" ? _d : Object, typeof (_e = typeof person_scope_service_1.PersonScopeService !== "undefined" && person_scope_service_1.PersonScopeService) === "function" ? _e : Object])
], ExpenseResourceContextGuard);


/***/ }),
/* 148 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExpenseRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/**
 * Prisma-backed persistence for `stewardship.expenses` - the 1:1
 * extension-table half of an Expense (`db/DESIGN_NOTES.md` Open Question
 * #5); the shared state-machine half (`currentState`, the event log) is
 * `FinancialTransactionRepository`'s responsibility, not this one's.
 */
let ExpenseRepository = class ExpenseRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.expense.create({ data: input });
    }
    findById(id) {
        return this.prisma.expense.findUnique({ where: { id } });
    }
    findByTransactionId(transactionId) {
        return this.prisma.expense.findUnique({ where: { transactionId } });
    }
    update(id, input) {
        return this.prisma.expense.update({ where: { id }, data: input });
    }
};
exports.ExpenseRepository = ExpenseRepository;
exports.ExpenseRepository = ExpenseRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ExpenseRepository);


/***/ }),
/* 149 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExpenseService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const domain_stewardship_1 = __webpack_require__(150);
const expense_repository_1 = __webpack_require__(148);
const financial_transaction_repository_1 = __webpack_require__(152);
function toResponseDto(expense, transaction) {
    return {
        id: expense.id,
        branchId: expense.branchId,
        transactionId: expense.transactionId,
        requestedByPersonId: expense.requestedByPersonId,
        description: expense.description,
        category: expense.category,
        receiptStorageKey: expense.receiptStorageKey,
        approvedByPersonId: expense.approvedByPersonId,
        approvedAt: expense.approvedAt ? expense.approvedAt.toISOString() : null,
        amountMinor: transaction.amountMinor.toString(),
        currency: transaction.currency,
        currentState: transaction.currentState,
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
    };
}
/**
 * FR-STW-09/BR-STW-07/BR-STW-08: the outbound/Expense sub-flow (request/
 * approve/reject/pay/receipt). Modeled as a 1:1 extension of
 * `FinancialTransaction` (`type=EXPENSE`) per `db/DESIGN_NOTES.md` Open
 * Question #5 - this service therefore orchestrates *two* repositories:
 * `FinancialTransactionRepository` for the shared state-machine/event-log
 * half (the same one `FinancialTransactionService` uses for the inbound
 * sub-flow), and `ExpenseRepository` for the extension table's own fields
 * (`description`, `receiptStorageKey`, `approvedByPersonId`, ...).
 *
 * FR-STW-09's "approver != requester" is enforced at the guard/RBAC layer
 * (`DIFFERENT_ACTOR_THAN_RECORDER`, reused - see `permission-matrix.ts`'s
 * `stewardship.expense.approve` rows) exactly like BR-STW-04's
 * verifier != recorder rule, not re-checked here.
 */
let ExpenseService = class ExpenseService {
    expenseRepository;
    financialTransactionRepository;
    constructor(expenseRepository, financialTransactionRepository) {
        this.expenseRepository = expenseRepository;
        this.financialTransactionRepository = financialTransactionRepository;
    }
    async request(actor, input) {
        const actorUserId = await this.financialTransactionRepository.findUserIdByPersonId(actor.personId);
        if (!actorUserId) {
            throw new common_1.ConflictException(`No platform.users record links to Person '${actor.personId}' - cannot attribute this Financial Transaction event`);
        }
        const transaction = await this.financialTransactionRepository.createWithEvent({
            branchId: actor.branchId,
            type: 'EXPENSE',
            amountMinor: BigInt(input.amountMinor),
            currency: input.currency ?? 'GHS',
            initialState: 'REQUESTED',
            actorUserId,
        });
        const expense = await this.expenseRepository.create({
            branchId: actor.branchId,
            transactionId: transaction.id,
            requestedByPersonId: actor.personId,
            description: input.description,
            category: input.category,
        });
        return toResponseDto(expense, transaction);
    }
    async getById(id) {
        const { expense, transaction } = await this.requireExpenseWithTransaction(id);
        return toResponseDto(expense, transaction);
    }
    /** FR-STW-09: `REQUESTED -> APPROVED`, stamping `approvedByPersonId`/
     * `approvedAt` on the Expense extension row alongside the shared event
     * log entry. */
    async approve(actor, id) {
        const { expense, transaction } = await this.transitionTo(actor, id, 'APPROVED');
        const updated = await this.expenseRepository.update(expense.id, {
            approvedByPersonId: actor.personId,
            approvedAt: new Date(),
        });
        return toResponseDto(updated, transaction);
    }
    /** FR-STW-09: `REQUESTED -> REJECTED` (terminal) with a reason,
     * mirroring `FinancialTransactionService.flag`'s own shape. */
    async reject(actor, id, input) {
        const { expense, transaction } = await this.transitionTo(actor, id, 'REJECTED', input.reason);
        return toResponseDto(expense, transaction);
    }
    /** [INFERRED] `stewardship.expense.pay`, Treasurer-only - see
     * `actions.ts`'s doc comment. `APPROVED -> PAID`. */
    async pay(actor, id) {
        const { expense, transaction } = await this.transitionTo(actor, id, 'PAID');
        return toResponseDto(expense, transaction);
    }
    /**
     * BR-STW-08: "receipts are retained for all expenses." `PAID ->
     * RECEIPT_RETAINED` (terminal). [INFERRED] restricted to the Expense's
     * own `requestedByPersonId` at the service layer (not a new
     * record-level check registered in the matrix - see `actions.ts`'s doc
     * comment on `stewardship.expense.receipt` for why): the original
     * requester is the one who made the purchase and holds the physical
     * receipt.
     */
    async attachReceipt(actor, id, input) {
        const { expense } = await this.requireExpenseWithTransaction(id);
        if (expense.requestedByPersonId !== actor.personId) {
            throw new common_1.ForbiddenException(`FR-STW-09: only the original requester (Person '${expense.requestedByPersonId}') may attach this Expense's receipt`);
        }
        const { transaction } = await this.transitionTo(actor, id, 'RECEIPT_RETAINED');
        const updated = await this.expenseRepository.update(expense.id, { receiptStorageKey: input.receiptStorageKey });
        return toResponseDto(updated, transaction);
    }
    async requireExpenseWithTransaction(id) {
        const expense = await this.expenseRepository.findById(id);
        if (!expense) {
            throw new common_1.NotFoundException(`No Expense found with id '${id}'`);
        }
        const transaction = await this.financialTransactionRepository.findById(expense.transactionId);
        if (!transaction) {
            throw new common_1.NotFoundException(`No Financial Transaction found for Expense '${id}' (transactionId '${expense.transactionId}')`);
        }
        return { expense, transaction };
    }
    async transitionTo(actor, id, to, reason) {
        const { expense, transaction } = await this.requireExpenseWithTransaction(id);
        if (!(0, domain_stewardship_1.isOutboundTransactionState)(transaction.currentState)) {
            throw new common_1.ConflictException(`Expense '${id}' transaction is in state '${transaction.currentState}', which is not a recognized outbound state`);
        }
        const check = (0, domain_stewardship_1.checkOutboundTransactionTransition)(transaction.currentState, to);
        if (!check.allowed) {
            throw new common_1.ConflictException(check.reason);
        }
        const actorUserId = await this.financialTransactionRepository.findUserIdByPersonId(actor.personId);
        if (!actorUserId) {
            throw new common_1.ConflictException(`No platform.users record links to Person '${actor.personId}' - cannot attribute this Financial Transaction event`);
        }
        const updatedTransaction = await this.financialTransactionRepository.appendEvent(transaction.id, transaction.currentState, to, actorUserId, reason);
        return { expense, transaction: updatedTransaction };
    }
};
exports.ExpenseService = ExpenseService;
exports.ExpenseService = ExpenseService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof expense_repository_1.ExpenseRepository !== "undefined" && expense_repository_1.ExpenseRepository) === "function" ? _a : Object, typeof (_b = typeof financial_transaction_repository_1.FinancialTransactionRepository !== "undefined" && financial_transaction_repository_1.FinancialTransactionRepository) === "function" ? _b : Object])
], ExpenseService);


/***/ }),
/* 150 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(8);
tslib_1.__exportStar(__webpack_require__(151), exports);


/***/ }),
/* 151 */
/***/ ((__unused_webpack_module, exports) => {


/**
 * PRD §12.7's two sub-flows under the single `FinancialTransaction`
 * entity. `db/schema.prisma`'s `FinancialTransactionEvent.fromState`/
 * `toState` are free-form strings, not a fixed Prisma enum (its own doc
 * comment: "the real state machine has 8+ states across two sub-flows") -
 * this module is where those literal string values are actually pinned
 * down and validated, mirroring `libs/domain/gatherings`'
 * `gathering-status.ts` precedent for an untyped-string Prisma column
 * backed by a real domain state machine.
 *
 * [INFERRED] casing: the PRD's Mermaid diagrams write state names in
 * PascalCase (`Recorded`, `Verified`, ...). This module represents them
 * as SCREAMING_SNAKE_CASE string literals instead, matching every other
 * enum-shaped value in this codebase (`GatheringStatus`, `AttendanceStatus`,
 * `FollowUpTaskStatus`, ...) for consistency across the API surface. The
 * *set* of states and the transitions between them are
 * `[BLUEPRINT-EXACT]`, transcribed directly from PRD §12.7's two
 * `stateDiagram-v2` blocks; only the string casing is a stylistic choice.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OUTBOUND_TRANSACTION_STATES = exports.INBOUND_TRANSACTION_STATES = void 0;
exports.isInboundTransactionState = isInboundTransactionState;
exports.isOutboundTransactionState = isOutboundTransactionState;
exports.checkInboundTransactionTransition = checkInboundTransactionTransition;
exports.checkOutboundTransactionTransition = checkOutboundTransactionTransition;
exports.INBOUND_TRANSACTION_STATES = [
    'RECORDED',
    'VERIFIED',
    'FLAGGED',
    'UNDER_INVESTIGATION',
    'RECONCILED',
];
function isInboundTransactionState(value) {
    return exports.INBOUND_TRANSACTION_STATES.includes(value);
}
const INBOUND_TRANSITIONS = {
    RECORDED: ['VERIFIED', 'FLAGGED'],
    VERIFIED: ['RECONCILED'],
    FLAGGED: ['VERIFIED', 'UNDER_INVESTIGATION'],
    UNDER_INVESTIGATION: ['VERIFIED'],
    RECONCILED: [],
};
exports.OUTBOUND_TRANSACTION_STATES = ['REQUESTED', 'APPROVED', 'REJECTED', 'PAID', 'RECEIPT_RETAINED'];
function isOutboundTransactionState(value) {
    return exports.OUTBOUND_TRANSACTION_STATES.includes(value);
}
const OUTBOUND_TRANSITIONS = {
    REQUESTED: ['APPROVED', 'REJECTED'],
    APPROVED: ['PAID'],
    REJECTED: [],
    PAID: ['RECEIPT_RETAINED'],
    RECEIPT_RETAINED: [],
};
function checkTransition(from, to, transitions, label) {
    if (from === to) {
        return { allowed: false, reason: `'${from}' is already the current state; not a transition` };
    }
    const allowedNext = transitions[from];
    if (!allowedNext.includes(to)) {
        return {
            allowed: false,
            reason: `PRD §12.7 (${label}): '${from}' -> '${to}' is not a modeled transition (allowed: ${allowedNext.length > 0 ? allowedNext.join(', ') : 'none - terminal state'})`,
        };
    }
    return { allowed: true, reason: `PRD §12.7 (${label}): '${from}' -> '${to}' is a modeled transition` };
}
/**
 * Inbound sub-flow (Offering/Tithe/Special Offering/Pledge/Donation).
 * `RECORDED -> FLAGGED` is FR-STW-04 (a Treasurer finds a discrepancy);
 * `FLAGGED -> UNDER_INVESTIGATION` is the "discrepancy unresolved past
 * SLA" edge - modeled as a reachable state here, but see
 * `apps/api/src/modules/stewardship/STEWARDSHIP_DESIGN_NOTES.md` for why
 * nothing in this milestone triggers that transition *automatically* (no
 * SLA duration is specified anywhere in the PRD, and no scheduler exists
 * in this codebase yet - the same "no scheduler" gap already flagged for
 * Pastoral Care's silent-drift sweep and Gatherings' completeness sweep).
 */
function checkInboundTransactionTransition(from, to) {
    return checkTransition(from, to, INBOUND_TRANSITIONS, 'inbound');
}
/**
 * Outbound sub-flow (Expense). FR-STW-09: `ReceiptRetained` (terminal)
 * cannot be reached without an attached receipt - that precondition is
 * enforced by `ExpenseService`, not this pure function, since it depends
 * on `Expense.receiptStorageKey` being populated, which is data this
 * module has no access to (Blueprint §6.4: domain libraries are
 * framework/persistence-agnostic).
 */
function checkOutboundTransactionTransition(from, to) {
    return checkTransition(from, to, OUTBOUND_TRANSITIONS, 'outbound/Expense');
}


/***/ }),
/* 152 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FinancialTransactionRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/**
 * Prisma-backed persistence for `stewardship.financial_transactions` and
 * its append-only `stewardship.financial_transaction_events` log
 * (Blueprint §7.4, `db/schema.prisma`'s own doc comment: "No update/delete
 * allowed" - enforced at the database-role/trigger level per
 * `db/DESIGN_NOTES.md` Open Question #2, not by this repository omitting
 * an `update`/`delete` method, though it does that too as defense in
 * depth). `FinancialTransaction.currentState` is a denormalized mirror of
 * the latest event's `toState`, kept in sync in the same transaction as
 * each new event (`db/schema.prisma`'s own doc comment on that field).
 */
let FinancialTransactionRepository = class FinancialTransactionRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Creates the `FinancialTransaction` row and its first
     * `FinancialTransactionEvent` (`fromState: null`) atomically - PRD
     * §12.7's `[*] --> Recorded`/`[*] --> Requested` initial transitions.
     */
    createWithEvent(input) {
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.financialTransaction.create({
                data: {
                    branchId: input.branchId,
                    type: input.type,
                    sourceGroupId: input.sourceGroupId,
                    giverPersonId: input.giverPersonId,
                    channel: input.channel,
                    amountMinor: input.amountMinor,
                    currency: input.currency,
                    currentState: input.initialState,
                },
            });
            await tx.financialTransactionEvent.create({
                data: {
                    transactionId: transaction.id,
                    fromState: null,
                    toState: input.initialState,
                    actorUserId: input.actorUserId,
                    reason: input.reason,
                },
            });
            return transaction;
        });
    }
    /**
     * Appends a new event and mirrors its `toState` onto
     * `FinancialTransaction.currentState`, atomically - every state
     * transition after the initial one (verify, flag, reconcile, approve,
     * reject, pay, receipt) goes through this one method.
     */
    appendEvent(transactionId, fromState, toState, actorUserId, reason) {
        return this.prisma.$transaction(async (tx) => {
            await tx.financialTransactionEvent.create({
                data: { transactionId, fromState, toState, actorUserId, reason },
            });
            return tx.financialTransaction.update({
                where: { id: transactionId },
                data: { currentState: toState },
            });
        });
    }
    findById(id) {
        return this.prisma.financialTransaction.findUnique({ where: { id } });
    }
    /** FR-STW-03/04's "verification queue"/"discrepancy queue" - a minimal
     * single-Branch, single-state filter. Full pagination and the
     * multi-filter (date range, type, Bacenta) reporting surface FR-STW-07
     * eventually needs is not built here - see
     * `STEWARDSHIP_DESIGN_NOTES.md`. */
    findManyByBranch(branchId, currentState) {
        return this.prisma.financialTransaction.findMany({
            where: { branchId, ...(currentState ? { currentState } : {}) },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Finds the event that first moved this transaction into `toState`
     * (there can only be one per state in this codebase's forward-only
     * model - `libs/domain/stewardship`'s transition checks never allow
     * re-entering a state already visited). Used to resolve "who recorded
     * this" (`toState: 'RECORDED'`) for `DIFFERENT_ACTOR_THAN_RECORDER`
     * (PRD §17.4/BR-STW-04).
     */
    findFirstEventByToState(transactionId, toState) {
        return this.prisma.financialTransactionEvent.findFirst({
            where: { transactionId, toState },
            orderBy: { occurredAt: 'asc' },
        });
    }
    /** Reverse of `RoleAssignmentRepository.findUserIdByPersonId` - see that
     * method's doc comment for why a direct `prisma.user` query is
     * appropriate here (`platform.users` is shared infrastructure, not
     * another bounded context's private schema, Blueprint §7.2). */
    async findUserIdByPersonId(personId) {
        const user = await this.prisma.user.findUnique({ where: { personId }, select: { id: true } });
        return user?.id;
    }
    async findPersonIdByUserId(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { personId: true } });
        return user?.personId ?? undefined;
    }
    /**
     * Composes `findFirstEventByToState(transactionId, 'RECORDED')` +
     * `findPersonIdByUserId` into the one fact both
     * `FinancialTransactionResourceContextGuard` (building
     * `ResourceContext.recordedByPersonId` for `DIFFERENT_ACTOR_THAN_RECORDER`)
     * and `FinancialTransactionService` (populating the response DTO's own
     * `recordedByPersonId`) need, so neither reimplements the two-step join.
     */
    async findRecordedByPersonId(transactionId) {
        const recordedEvent = await this.findFirstEventByToState(transactionId, 'RECORDED');
        if (!recordedEvent) {
            return undefined;
        }
        return this.findPersonIdByUserId(recordedEvent.actorUserId);
    }
};
exports.FinancialTransactionRepository = FinancialTransactionRepository;
exports.FinancialTransactionRepository = FinancialTransactionRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], FinancialTransactionRepository);


/***/ }),
/* 153 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FinancialTransactionController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const financial_transaction_resource_context_guard_1 = __webpack_require__(154);
const financial_transaction_service_1 = __webpack_require__(155);
/**
 * PRD §17.3's "Financial Transaction: record/verify/reconcile" rows,
 * FR-STW-01 through FR-STW-05/FR-STW-07. `verify`/`flag`/`escalate` all
 * declare `stewardship.transaction.verify` - PRD §17.3 has one "verify"
 * row covering the Treasurer's whole verification-time decision
 * (confirm/flag a discrepancy/escalate an unresolved one), not three
 * separate matrix rows. `verify` is this module's - and this codebase's -
 * first real declarative use of `RecordLevelPolicyGuard` (Blueprint §9.4's
 * own worked example): every prior `recordLevelCheck` user
 * (`POIMEN_GATE_IF_ENABLED`) went through `RoleAssignmentService`'s
 * imperative `evaluate()` escape hatch instead, for reasons specific to
 * that endpoint's data-dependent action selection - see that service's
 * own doc comment. This endpoint has no such complication, so it uses the
 * declarative pipeline exactly as documented.
 */
let FinancialTransactionController = class FinancialTransactionController {
    financialTransactionService;
    constructor(financialTransactionService) {
        this.financialTransactionService = financialTransactionService;
    }
    record(actor, body) {
        return this.financialTransactionService.record(actor, body);
    }
    listByBranch(actor, state) {
        return this.financialTransactionService.listByBranch(actor, state);
    }
    getById(id) {
        return this.financialTransactionService.getById(id);
    }
    verify(actor, id) {
        return this.financialTransactionService.verify(actor, id);
    }
    flag(actor, id, body) {
        return this.financialTransactionService.flag(actor, id, body);
    }
    escalate(actor, id) {
        return this.financialTransactionService.escalate(actor, id);
    }
    reconcile(actor, id) {
        return this.financialTransactionService.reconcile(actor, id);
    }
};
exports.FinancialTransactionController = FinancialTransactionController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, rbac_1.RequirePermission)('stewardship.transaction.record'),
    (0, common_1.UseGuards)(financial_transaction_resource_context_guard_1.FinancialTransactionCreateResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.recordFinancialTransactionSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], FinancialTransactionController.prototype, "record", null);
tslib_1.__decorate([
    (0, common_1.Get)(),
    (0, rbac_1.RequirePermission)('stewardship.transaction.read'),
    (0, common_1.UseGuards)(financial_transaction_resource_context_guard_1.FinancialTransactionListResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Query)('state')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", void 0)
], FinancialTransactionController.prototype, "listByBranch", null);
tslib_1.__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_1.RequirePermission)('stewardship.transaction.read'),
    (0, common_1.UseGuards)(financial_transaction_resource_context_guard_1.FinancialTransactionResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], FinancialTransactionController.prototype, "getById", null);
tslib_1.__decorate([
    (0, common_1.Post)(':id/verify'),
    (0, rbac_1.RequirePermission)('stewardship.transaction.verify'),
    (0, common_1.UseGuards)(financial_transaction_resource_context_guard_1.FinancialTransactionResourceContextGuard, rbac_1.RbacGuard, rbac_1.RecordLevelPolicyGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", void 0)
], FinancialTransactionController.prototype, "verify", null);
tslib_1.__decorate([
    (0, common_1.Post)(':id/flag'),
    (0, rbac_1.RequirePermission)('stewardship.transaction.verify'),
    (0, common_1.UseGuards)(financial_transaction_resource_context_guard_1.FinancialTransactionResourceContextGuard, rbac_1.RbacGuard, rbac_1.RecordLevelPolicyGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.flagFinancialTransactionSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], FinancialTransactionController.prototype, "flag", null);
tslib_1.__decorate([
    (0, common_1.Post)(':id/escalate'),
    (0, rbac_1.RequirePermission)('stewardship.transaction.verify'),
    (0, common_1.UseGuards)(financial_transaction_resource_context_guard_1.FinancialTransactionResourceContextGuard, rbac_1.RbacGuard, rbac_1.RecordLevelPolicyGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", void 0)
], FinancialTransactionController.prototype, "escalate", null);
tslib_1.__decorate([
    (0, common_1.Post)(':id/reconcile'),
    (0, rbac_1.RequirePermission)('stewardship.transaction.reconcile'),
    (0, common_1.UseGuards)(financial_transaction_resource_context_guard_1.FinancialTransactionResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", void 0)
], FinancialTransactionController.prototype, "reconcile", null);
exports.FinancialTransactionController = FinancialTransactionController = tslib_1.__decorate([
    (0, common_1.Controller)('financial-transactions'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof financial_transaction_service_1.FinancialTransactionService !== "undefined" && financial_transaction_service_1.FinancialTransactionService) === "function" ? _a : Object])
], FinancialTransactionController);


/***/ }),
/* 154 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FinancialTransactionListResourceContextGuard = exports.FinancialTransactionResourceContextGuard = exports.FinancialTransactionCreateResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const group_scope_service_1 = __webpack_require__(53);
const financial_transaction_repository_1 = __webpack_require__(152);
/**
 * `POST /v1/financial-transactions` (FR-STW-01). §12.7's edge case:
 * `sourceGroupId` present means a Bacenta-collected offering (resolved via
 * People's exported `GroupScopeService`, the same cross-module pattern
 * Gatherings already established for `ownerGroupId`/`groupId`); absent
 * means an individual Mobile Money entry, whose resource is the *acting*
 * Person themselves (`ownerId: actor.personId`, matching
 * `evaluate.ts`'s `SELF` scope check) - never a client-supplied
 * `giverPersonId`, per `recordFinancialTransactionSchema`'s own doc
 * comment.
 */
let FinancialTransactionCreateResourceContextGuard = class FinancialTransactionCreateResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    groupScopeService;
    constructor(branchConfigurationService, groupScopeService) {
        super(branchConfigurationService);
        this.groupScopeService = groupScopeService;
    }
    async loadResource(request, actor) {
        const sourceGroupId = request.body?.sourceGroupId;
        if (sourceGroupId) {
            return this.groupScopeService.loadResourceContext(sourceGroupId);
        }
        return { branchId: actor.branchId, ownerId: actor.personId };
    }
};
exports.FinancialTransactionCreateResourceContextGuard = FinancialTransactionCreateResourceContextGuard;
exports.FinancialTransactionCreateResourceContextGuard = FinancialTransactionCreateResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object, typeof (_b = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _b : Object])
], FinancialTransactionCreateResourceContextGuard);
/**
 * `GET/POST /v1/financial-transactions/:id/...` (verify/flag/escalate/
 * reconcile/read). Loads the existing transaction, resolves scope the same
 * way the create guard does when `sourceGroupId` is set, and always
 * additionally populates `recordedByPersonId`
 * (`FinancialTransactionRepository.findRecordedByPersonId`) - PRD §17.4/
 * BR-STW-04's `DIFFERENT_ACTOR_THAN_RECORDER` record-level check needs it
 * on the `verify` route; populating it unconditionally on every route this
 * guard covers is simpler than branching per-action, and harmless for
 * routes whose matched rule names no `recordLevelCheck` at all
 * (`evaluateRecordLevelCheck` only consults it when a rule actually names
 * one).
 */
let FinancialTransactionResourceContextGuard = class FinancialTransactionResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    financialTransactionRepository;
    groupScopeService;
    constructor(branchConfigurationService, financialTransactionRepository, groupScopeService) {
        super(branchConfigurationService);
        this.financialTransactionRepository = financialTransactionRepository;
        this.groupScopeService = groupScopeService;
    }
    async loadResource(request, _actor) {
        const id = request.params.id;
        const transaction = await this.financialTransactionRepository.findById(id);
        if (!transaction) {
            throw new common_1.NotFoundException(`No Financial Transaction found with id '${id}'`);
        }
        const recordedByPersonId = await this.financialTransactionRepository.findRecordedByPersonId(id);
        if (transaction.sourceGroupId) {
            const groupScope = await this.groupScopeService.loadResourceContext(transaction.sourceGroupId);
            return { ...groupScope, recordedByPersonId };
        }
        return {
            branchId: transaction.branchId,
            ownerId: transaction.giverPersonId ?? undefined,
            recordedByPersonId,
        };
    }
};
exports.FinancialTransactionResourceContextGuard = FinancialTransactionResourceContextGuard;
exports.FinancialTransactionResourceContextGuard = FinancialTransactionResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_c = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _c : Object, typeof (_d = typeof financial_transaction_repository_1.FinancialTransactionRepository !== "undefined" && financial_transaction_repository_1.FinancialTransactionRepository) === "function" ? _d : Object, typeof (_e = typeof group_scope_service_1.GroupScopeService !== "undefined" && group_scope_service_1.GroupScopeService) === "function" ? _e : Object])
], FinancialTransactionResourceContextGuard);
/**
 * `GET /v1/financial-transactions` (the verification/discrepancy queue,
 * FR-STW-03/04). Always resolves to just the actor's own Branch - the
 * `BRANCH`-scoped rows (`RESIDENT_PASTOR`/`ASSISTANT_PASTOR`/`TREASURER`)
 * are this endpoint's intended consumers. A `BACENTA_LEADER`'s own
 * `OWN_GROUP`-scoped `.read` grant cannot be satisfied by a Branch-wide
 * list resource - they use `GET /v1/financial-transactions/:id` for
 * individual records instead. See `STEWARDSHIP_DESIGN_NOTES.md`.
 */
let FinancialTransactionListResourceContextGuard = class FinancialTransactionListResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    constructor(branchConfigurationService) {
        super(branchConfigurationService);
    }
    async loadResource(_request, actor) {
        return { branchId: actor.branchId };
    }
};
exports.FinancialTransactionListResourceContextGuard = FinancialTransactionListResourceContextGuard;
exports.FinancialTransactionListResourceContextGuard = FinancialTransactionListResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_f = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _f : Object])
], FinancialTransactionListResourceContextGuard);


/***/ }),
/* 155 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FinancialTransactionService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const domain_stewardship_1 = __webpack_require__(150);
const financial_transaction_repository_1 = __webpack_require__(152);
function toResponseDto(transaction, recordedByPersonId) {
    return {
        id: transaction.id,
        branchId: transaction.branchId,
        type: transaction.type,
        sourceGroupId: transaction.sourceGroupId,
        giverPersonId: transaction.giverPersonId,
        channel: transaction.channel,
        amountMinor: transaction.amountMinor.toString(),
        currency: transaction.currency,
        currentState: transaction.currentState,
        recordedByPersonId,
        createdAt: transaction.createdAt.toISOString(),
    };
}
/**
 * FR-STW-01 through FR-STW-05/FR-STW-07, BR-STW-01 through BR-STW-04: the
 * inbound Financial Transaction sub-flow (record/verify/flag/escalate/
 * reconcile). Authorization (who may call `verify`, and BR-STW-04's
 * same-actor check) is decided by `FinancialTransactionResourceContextGuard`
 * + `RbacGuard` + `RecordLevelPolicyGuard` at the HTTP layer (see
 * `stewardship.module.ts`) - this service only enforces PRD §12.7's own
 * state-machine validity, the same division of responsibility
 * `PersonService`/`GatheringService` already established for their own
 * domains.
 */
let FinancialTransactionService = class FinancialTransactionService {
    financialTransactionRepository;
    constructor(financialTransactionRepository) {
        this.financialTransactionRepository = financialTransactionRepository;
    }
    /**
     * FR-STW-01/BR-STW-01/BR-STW-02: `sourceGroupId` present means a
     * Bacenta-collected offering (`giverPersonId` left unset - the giver is
     * the Bacenta as a collection point, not one individual); absent means
     * an individual Mobile Money entry, whose `giverPersonId` is always the
     * *acting* Person - see `recordFinancialTransactionSchema`'s doc comment
     * in `libs/contracts` for why this is never taken from client input.
     */
    async record(actor, input) {
        const actorUserId = await this.financialTransactionRepository.findUserIdByPersonId(actor.personId);
        if (!actorUserId) {
            throw new common_1.ConflictException(`No platform.users record links to Person '${actor.personId}' - cannot attribute this Financial Transaction event`);
        }
        const transaction = await this.financialTransactionRepository.createWithEvent({
            branchId: actor.branchId,
            type: input.type,
            sourceGroupId: input.sourceGroupId,
            giverPersonId: input.sourceGroupId ? undefined : actor.personId,
            channel: input.channel,
            amountMinor: BigInt(input.amountMinor),
            currency: input.currency ?? 'GHS',
            initialState: 'RECORDED',
            actorUserId,
        });
        return toResponseDto(transaction, actor.personId);
    }
    async getById(id) {
        const transaction = await this.requireTransaction(id);
        const recordedByPersonId = await this.financialTransactionRepository.findRecordedByPersonId(id);
        return toResponseDto(transaction, recordedByPersonId ?? null);
    }
    /** FR-STW-03/04's verification-queue/discrepancy-queue read. See
     * `FinancialTransactionRepository.findManyByBranch`'s doc comment for
     * why `recordedByPersonId` is left `null` in list results (avoiding an
     * N+1 join per row for a minimal queue view). */
    async listByBranch(actor, currentState) {
        const transactions = await this.financialTransactionRepository.findManyByBranch(actor.branchId, currentState);
        return transactions.map((transaction) => toResponseDto(transaction, null));
    }
    /** FR-STW-03: `RECORDED -> VERIFIED`, or `FLAGGED`/`UNDER_INVESTIGATION
     * -> VERIFIED` once a discrepancy is resolved. BR-STW-04's same-actor
     * check has already run at the guard layer by the time this executes -
     * see this class's own doc comment. */
    async verify(actor, id) {
        const transaction = await this.transitionTo(actor, id, 'VERIFIED');
        const recordedByPersonId = await this.financialTransactionRepository.findRecordedByPersonId(id);
        return toResponseDto(transaction, recordedByPersonId ?? null);
    }
    /** FR-STW-04: `RECORDED -> FLAGGED` with a discrepancy reason, routing
     * to the "discrepancy queue" (`listByBranch(actor, 'FLAGGED')`). */
    async flag(actor, id, input) {
        const transaction = await this.transitionTo(actor, id, 'FLAGGED', input.reason);
        const recordedByPersonId = await this.financialTransactionRepository.findRecordedByPersonId(id);
        return toResponseDto(transaction, recordedByPersonId ?? null);
    }
    /**
     * PRD §12.7's `Flagged -> UnderInvestigation`: "discrepancy unresolved
     * past SLA." No SLA duration is specified anywhere in the PRD, and no
     * scheduler exists in this codebase to evaluate one automatically (the
     * same gap already flagged for Pastoral Care's silent-drift sweep and
     * Gatherings' completeness sweep) - this is a manual transition a
     * Treasurer/Admin invokes, not an automatic one. See
     * `STEWARDSHIP_DESIGN_NOTES.md`.
     */
    async escalate(actor, id) {
        const transaction = await this.transitionTo(actor, id, 'UNDER_INVESTIGATION');
        const recordedByPersonId = await this.financialTransactionRepository.findRecordedByPersonId(id);
        return toResponseDto(transaction, recordedByPersonId ?? null);
    }
    /** FR-STW-07: `VERIFIED -> RECONCILED`, "matched against bank
     * deposit." See `STEWARDSHIP_DESIGN_NOTES.md` for why the *comparison*
     * half of FR-STW-07 (an actual bank-deposit-confirmation record) is not
     * built this milestone - `db/schema.prisma` has no such entity; this
     * method only records the state transition itself. */
    async reconcile(actor, id) {
        const transaction = await this.transitionTo(actor, id, 'RECONCILED');
        const recordedByPersonId = await this.financialTransactionRepository.findRecordedByPersonId(id);
        return toResponseDto(transaction, recordedByPersonId ?? null);
    }
    async requireTransaction(id) {
        const transaction = await this.financialTransactionRepository.findById(id);
        if (!transaction) {
            throw new common_1.NotFoundException(`No Financial Transaction found with id '${id}'`);
        }
        return transaction;
    }
    async transitionTo(actor, id, to, reason) {
        const existing = await this.requireTransaction(id);
        if (!(0, domain_stewardship_1.isInboundTransactionState)(existing.currentState)) {
            throw new common_1.ConflictException(`Financial Transaction '${id}' is in state '${existing.currentState}', which is not a recognized inbound state ` +
                '(it may be an Expense - use ExpenseService instead)');
        }
        const check = (0, domain_stewardship_1.checkInboundTransactionTransition)(existing.currentState, to);
        if (!check.allowed) {
            throw new common_1.ConflictException(check.reason);
        }
        const actorUserId = await this.financialTransactionRepository.findUserIdByPersonId(actor.personId);
        if (!actorUserId) {
            throw new common_1.ConflictException(`No platform.users record links to Person '${actor.personId}' - cannot attribute this Financial Transaction event`);
        }
        return this.financialTransactionRepository.appendEvent(id, existing.currentState, to, actorUserId, reason);
    }
};
exports.FinancialTransactionService = FinancialTransactionService;
exports.FinancialTransactionService = FinancialTransactionService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof financial_transaction_repository_1.FinancialTransactionRepository !== "undefined" && financial_transaction_repository_1.FinancialTransactionRepository) === "function" ? _a : Object])
], FinancialTransactionService);


/***/ }),
/* 156 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PledgeController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const pledge_resource_context_guard_1 = __webpack_require__(157);
const pledge_service_1 = __webpack_require__(159);
/** [INFERRED - no PRD §17.3 row, H2] FR-STW-08. */
let PledgeController = class PledgeController {
    pledgeService;
    constructor(pledgeService) {
        this.pledgeService = pledgeService;
    }
    create(actor, body) {
        return this.pledgeService.create(actor, body);
    }
    getById(id) {
        return this.pledgeService.getById(id);
    }
    fulfill(id, body) {
        return this.pledgeService.fulfill(id, body);
    }
};
exports.PledgeController = PledgeController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, rbac_1.RequirePermission)('stewardship.pledge.create'),
    (0, common_1.UseGuards)(pledge_resource_context_guard_1.PledgeCreateResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createPledgeSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], PledgeController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_1.RequirePermission)('stewardship.pledge.read'),
    (0, common_1.UseGuards)(pledge_resource_context_guard_1.PledgeResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], PledgeController.prototype, "getById", null);
tslib_1.__decorate([
    (0, common_1.Post)(':id/fulfill'),
    (0, rbac_1.RequirePermission)('stewardship.pledge.fulfill'),
    (0, common_1.UseGuards)(pledge_resource_context_guard_1.PledgeResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.fulfillPledgeSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], PledgeController.prototype, "fulfill", null);
exports.PledgeController = PledgeController = tslib_1.__decorate([
    (0, common_1.Controller)('pledges'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof pledge_service_1.PledgeService !== "undefined" && pledge_service_1.PledgeService) === "function" ? _a : Object])
], PledgeController);


/***/ }),
/* 157 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PledgeResourceContextGuard = exports.PledgeCreateResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const pledge_repository_1 = __webpack_require__(158);
/** `POST /v1/pledges` (FR-STW-08/H2) - always the acting Member's own
 * commitment (`SELF` scope) - see `PledgeService`'s doc comment. */
let PledgeCreateResourceContextGuard = class PledgeCreateResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    constructor(branchConfigurationService) {
        super(branchConfigurationService);
    }
    async loadResource(_request, actor) {
        return { branchId: actor.branchId, ownerId: actor.personId };
    }
};
exports.PledgeCreateResourceContextGuard = PledgeCreateResourceContextGuard;
exports.PledgeCreateResourceContextGuard = PledgeCreateResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object])
], PledgeCreateResourceContextGuard);
/** `GET/POST /v1/pledges/:id/...` (read/fulfill). */
let PledgeResourceContextGuard = class PledgeResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    pledgeRepository;
    constructor(branchConfigurationService, pledgeRepository) {
        super(branchConfigurationService);
        this.pledgeRepository = pledgeRepository;
    }
    async loadResource(request, _actor) {
        const id = request.params.id;
        const pledge = await this.pledgeRepository.findById(id);
        if (!pledge) {
            throw new common_1.NotFoundException(`No Pledge found with id '${id}'`);
        }
        return { branchId: pledge.branchId, ownerId: pledge.personId };
    }
};
exports.PledgeResourceContextGuard = PledgeResourceContextGuard;
exports.PledgeResourceContextGuard = PledgeResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_b = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _b : Object, typeof (_c = typeof pledge_repository_1.PledgeRepository !== "undefined" && pledge_repository_1.PledgeRepository) === "function" ? _c : Object])
], PledgeResourceContextGuard);


/***/ }),
/* 158 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PledgeRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/** Prisma-backed persistence for `stewardship.pledges` (FR-STW-08/H2). */
let PledgeRepository = class PledgeRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.pledge.create({ data: input });
    }
    findById(id) {
        return this.prisma.pledge.findUnique({ where: { id } });
    }
    fulfill(id, fulfilledTransactionId) {
        return this.prisma.pledge.update({ where: { id }, data: { fulfilledTransactionId } });
    }
};
exports.PledgeRepository = PledgeRepository;
exports.PledgeRepository = PledgeRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], PledgeRepository);


/***/ }),
/* 159 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PledgeService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const financial_transaction_repository_1 = __webpack_require__(152);
const pledge_repository_1 = __webpack_require__(158);
const project_repository_1 = __webpack_require__(160);
function toResponseDto(pledge) {
    return {
        id: pledge.id,
        branchId: pledge.branchId,
        projectId: pledge.projectId,
        personId: pledge.personId,
        pledgedAmountMinor: pledge.pledgedAmountMinor.toString(),
        currency: pledge.currency,
        pledgedAt: pledge.pledgedAt.toISOString(),
        reminderOptIn: pledge.reminderOptIn,
        reminderSentAt: pledge.reminderSentAt ? pledge.reminderSentAt.toISOString() : null,
        fulfilledTransactionId: pledge.fulfilledTransactionId,
        createdAt: pledge.createdAt.toISOString(),
        updatedAt: pledge.updatedAt.toISOString(),
    };
}
/**
 * FR-STW-08/H2: a Pledge is the giver's commitment against a Project,
 * always created for the *acting* Person (`SELF` scope,
 * `permission-matrix.ts`'s `stewardship.pledge.create` row) - see
 * `createPledgeSchema`'s doc comment in `libs/contracts` for why there is
 * no client-supplied `personId`, the same reasoning
 * `recordFinancialTransactionSchema` already applies to `giverPersonId`.
 * `reminderOptIn` is accepted and stored (OQ-07's resolution) but this
 * milestone does not deliver the reminder itself - no scheduler exists in
 * this codebase yet. See `STEWARDSHIP_DESIGN_NOTES.md`.
 */
let PledgeService = class PledgeService {
    pledgeRepository;
    projectRepository;
    financialTransactionRepository;
    constructor(pledgeRepository, projectRepository, financialTransactionRepository) {
        this.pledgeRepository = pledgeRepository;
        this.projectRepository = projectRepository;
        this.financialTransactionRepository = financialTransactionRepository;
    }
    async create(actor, input) {
        const project = await this.projectRepository.findById(input.projectId);
        if (!project) {
            throw new common_1.NotFoundException(`No Project found with id '${input.projectId}'`);
        }
        const pledge = await this.pledgeRepository.create({
            branchId: project.branchId,
            projectId: input.projectId,
            personId: actor.personId,
            pledgedAmountMinor: BigInt(input.pledgedAmountMinor),
            currency: input.currency ?? 'GHS',
            reminderOptIn: input.reminderOptIn,
        });
        return toResponseDto(pledge);
    }
    async getById(id) {
        const pledge = await this.requirePledge(id);
        return toResponseDto(pledge);
    }
    /**
     * Links this Pledge to an already-recorded Financial Transaction (a
     * real payment - `recordFinancialTransactionSchema`'s own doc comment
     * on the `PLEDGE`/`DONATION` types this fulfils) - see
     * `fulfillPledgeSchema`'s doc comment for why this milestone does not
     * spell out a more elaborate linkage workflow than "reference an
     * existing transaction by id."
     */
    async fulfill(id, input) {
        await this.requirePledge(id);
        const transaction = await this.financialTransactionRepository.findById(input.fulfilledTransactionId);
        if (!transaction) {
            throw new common_1.NotFoundException(`No Financial Transaction found with id '${input.fulfilledTransactionId}'`);
        }
        if (transaction.type !== 'PLEDGE' && transaction.type !== 'DONATION') {
            throw new common_1.ConflictException(`Financial Transaction '${input.fulfilledTransactionId}' has type '${transaction.type}', expected 'PLEDGE' or 'DONATION'`);
        }
        const pledge = await this.pledgeRepository.fulfill(id, input.fulfilledTransactionId);
        return toResponseDto(pledge);
    }
    async requirePledge(id) {
        const pledge = await this.pledgeRepository.findById(id);
        if (!pledge) {
            throw new common_1.NotFoundException(`No Pledge found with id '${id}'`);
        }
        return pledge;
    }
};
exports.PledgeService = PledgeService;
exports.PledgeService = PledgeService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof pledge_repository_1.PledgeRepository !== "undefined" && pledge_repository_1.PledgeRepository) === "function" ? _a : Object, typeof (_b = typeof project_repository_1.ProjectRepository !== "undefined" && project_repository_1.ProjectRepository) === "function" ? _b : Object, typeof (_c = typeof financial_transaction_repository_1.FinancialTransactionRepository !== "undefined" && financial_transaction_repository_1.FinancialTransactionRepository) === "function" ? _c : Object])
], PledgeService);


/***/ }),
/* 160 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProjectRepository = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(15);
/** Prisma-backed persistence for `stewardship.projects` (FR-STW-08/H2). */
let ProjectRepository = class ProjectRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.project.create({ data: input });
    }
    findById(id) {
        return this.prisma.project.findUnique({ where: { id } });
    }
};
exports.ProjectRepository = ProjectRepository;
exports.ProjectRepository = ProjectRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ProjectRepository);


/***/ }),
/* 161 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProjectController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const rbac_1 = __webpack_require__(22);
const contracts_1 = __webpack_require__(33);
const current_actor_decorator_1 = __webpack_require__(43);
const zod_validation_pipe_1 = __webpack_require__(50);
const project_resource_context_guard_1 = __webpack_require__(162);
const project_service_1 = __webpack_require__(163);
/** [INFERRED - no PRD §17.3 row, H2] FR-STW-08. */
let ProjectController = class ProjectController {
    projectService;
    constructor(projectService) {
        this.projectService = projectService;
    }
    create(actor, body) {
        return this.projectService.create(actor, body);
    }
    getById(id) {
        return this.projectService.getById(id);
    }
};
exports.ProjectController = ProjectController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, rbac_1.RequirePermission)('stewardship.project.create'),
    (0, common_1.UseGuards)(project_resource_context_guard_1.ProjectCreateResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, current_actor_decorator_1.CurrentActor)()),
    tslib_1.__param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createProjectSchema))),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], ProjectController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_1.RequirePermission)('stewardship.project.read'),
    (0, common_1.UseGuards)(project_resource_context_guard_1.ProjectResourceContextGuard, rbac_1.RbacGuard),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], ProjectController.prototype, "getById", null);
exports.ProjectController = ProjectController = tslib_1.__decorate([
    (0, common_1.Controller)('projects'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof project_service_1.ProjectService !== "undefined" && project_service_1.ProjectService) === "function" ? _a : Object])
], ProjectController);


/***/ }),
/* 162 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProjectResourceContextGuard = exports.ProjectCreateResourceContextGuard = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const branch_configuration_service_1 = __webpack_require__(18);
const ecclesia_context_guard_base_1 = __webpack_require__(52);
const project_repository_1 = __webpack_require__(160);
/** `POST /v1/projects` (FR-STW-08/H2) - a Branch-level structural entity,
 * not owned by any single Group; resource is simply the actor's own
 * Branch. */
let ProjectCreateResourceContextGuard = class ProjectCreateResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    constructor(branchConfigurationService) {
        super(branchConfigurationService);
    }
    async loadResource(_request, actor) {
        return { branchId: actor.branchId };
    }
};
exports.ProjectCreateResourceContextGuard = ProjectCreateResourceContextGuard;
exports.ProjectCreateResourceContextGuard = ProjectCreateResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _a : Object])
], ProjectCreateResourceContextGuard);
/** `GET /v1/projects/:id`. */
let ProjectResourceContextGuard = class ProjectResourceContextGuard extends ecclesia_context_guard_base_1.EcclesiaContextGuardBase {
    projectRepository;
    constructor(branchConfigurationService, projectRepository) {
        super(branchConfigurationService);
        this.projectRepository = projectRepository;
    }
    async loadResource(request, _actor) {
        const id = request.params.id;
        const project = await this.projectRepository.findById(id);
        if (!project) {
            throw new common_1.NotFoundException(`No Project found with id '${id}'`);
        }
        return { branchId: project.branchId };
    }
};
exports.ProjectResourceContextGuard = ProjectResourceContextGuard;
exports.ProjectResourceContextGuard = ProjectResourceContextGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_b = typeof branch_configuration_service_1.BranchConfigurationService !== "undefined" && branch_configuration_service_1.BranchConfigurationService) === "function" ? _b : Object, typeof (_c = typeof project_repository_1.ProjectRepository !== "undefined" && project_repository_1.ProjectRepository) === "function" ? _c : Object])
], ProjectResourceContextGuard);


/***/ }),
/* 163 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProjectService = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const project_repository_1 = __webpack_require__(160);
function toResponseDto(project) {
    return {
        id: project.id,
        branchId: project.branchId,
        name: project.name,
        description: project.description,
        targetAmountMinor: project.targetAmountMinor.toString(),
        currency: project.currency,
        status: project.status,
        createdByPersonId: project.createdByPersonId,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
    };
}
/**
 * FR-STW-08/H2: Project entities against which Pledges are tracked. Only
 * create/read are built this milestone - see `PledgeService` for
 * fulfillment, and `STEWARDSHIP_DESIGN_NOTES.md` for why progress
 * aggregation (total pledged/received vs. target) is deferred.
 */
let ProjectService = class ProjectService {
    projectRepository;
    constructor(projectRepository) {
        this.projectRepository = projectRepository;
    }
    async create(actor, input) {
        const project = await this.projectRepository.create({
            branchId: actor.branchId,
            name: input.name,
            description: input.description,
            targetAmountMinor: BigInt(input.targetAmountMinor),
            currency: input.currency ?? 'GHS',
            createdByPersonId: actor.personId,
        });
        return toResponseDto(project);
    }
    async getById(id) {
        const project = await this.projectRepository.findById(id);
        if (!project) {
            throw new common_1.NotFoundException(`No Project found with id '${id}'`);
        }
        return toResponseDto(project);
    }
};
exports.ProjectService = ProjectService;
exports.ProjectService = ProjectService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof project_repository_1.ProjectRepository !== "undefined" && project_repository_1.ProjectRepository) === "function" ? _a : Object])
], ProjectService);


/***/ }),
/* 164 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlatformModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(4);
const core_1 = __webpack_require__(3);
const terminus_1 = __webpack_require__(14);
const nestjs_pino_1 = __webpack_require__(6);
const audit_module_1 = __webpack_require__(165);
const auth_module_1 = __webpack_require__(166);
const env_schema_1 = __webpack_require__(167);
const database_module_1 = __webpack_require__(12);
const all_exceptions_filter_1 = __webpack_require__(168);
const health_controller_1 = __webpack_require__(169);
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
/* 165 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuditModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const database_module_1 = __webpack_require__(12);
const audit_log_service_1 = __webpack_require__(45);
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
/* 166 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthModule = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const core_1 = __webpack_require__(3);
const audit_module_1 = __webpack_require__(165);
const database_module_1 = __webpack_require__(12);
const actor_context_resolver_service_1 = __webpack_require__(46);
const auth_guard_1 = __webpack_require__(44);
const cognito_verifier_service_1 = __webpack_require__(47);
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
/* 167 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.envSchema = void 0;
exports.validateEnv = validateEnv;
const zod_1 = __webpack_require__(36);
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
/* 168 */
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
/* 169 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HealthController = void 0;
const tslib_1 = __webpack_require__(8);
const common_1 = __webpack_require__(2);
const terminus_1 = __webpack_require__(14);
const database_health_indicator_1 = __webpack_require__(13);
const public_decorator_1 = __webpack_require__(49);
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