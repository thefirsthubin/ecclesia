import 'reflect-metadata';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
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
export declare class RbacGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
//# sourceMappingURL=rbac.guard.d.ts.map