"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacGuard = void 0;
const tslib_1 = require("tslib");
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const require_permission_decorator_1 = require("../decorators/require-permission.decorator");
const evaluate_1 = require("../evaluate");
const permission_matrix_1 = require("../permission-matrix");
const request_context_1 = require("../request-context");
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
    tslib_1.__metadata("design:paramtypes", [core_1.Reflector])
], RbacGuard);
//# sourceMappingURL=rbac.guard.js.map