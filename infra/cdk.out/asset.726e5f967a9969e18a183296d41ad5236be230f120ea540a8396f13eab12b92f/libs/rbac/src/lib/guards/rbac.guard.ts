import 'reflect-metadata';

import { ForbiddenException, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { Action } from '../actions';
import { REQUIRE_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { evaluateRoleAndScope } from '../evaluate';
import { PERMISSION_MATRIX } from '../permission-matrix';
import { ECCLESIA_RBAC_DECISION_KEY, ECCLESIA_REQUEST_CONTEXT_KEY } from '../request-context';
import type { RequestWithEcclesiaContext } from '../request-context';

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
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const action = this.reflector.get<Action>(REQUIRE_PERMISSION_KEY, context.getHandler());
    if (!action) {
      throw new ForbiddenException(
        'No permission requirement declared for this endpoint (missing @RequirePermission)',
      );
    }

    const request = context.switchToHttp().getRequest<RequestWithEcclesiaContext>();
    const ecclesiaContext = request[ECCLESIA_REQUEST_CONTEXT_KEY];
    if (!ecclesiaContext) {
      throw new ForbiddenException('No authenticated actor context available for authorization');
    }

    const decision = evaluateRoleAndScope(
      ecclesiaContext.actor,
      action,
      ecclesiaContext.resource,
      PERMISSION_MATRIX,
    );
    request[ECCLESIA_RBAC_DECISION_KEY] = decision;

    if (decision.effect === 'DENY') {
      throw new ForbiddenException(decision.reason);
    }
    return true;
  }
}
