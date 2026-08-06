import 'reflect-metadata';

import { ForbiddenException, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';

import { evaluateRecordLevelCheck } from '../evaluate';
import { ECCLESIA_RBAC_DECISION_KEY, ECCLESIA_REQUEST_CONTEXT_KEY } from '../request-context';
import type { RequestWithEcclesiaContext } from '../request-context';

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
@Injectable()
export class RecordLevelPolicyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithEcclesiaContext>();
    const ecclesiaContext = request[ECCLESIA_REQUEST_CONTEXT_KEY];
    const priorDecision = request[ECCLESIA_RBAC_DECISION_KEY];

    if (!ecclesiaContext || !priorDecision) {
      throw new ForbiddenException(
        'RecordLevelPolicyGuard requires RbacGuard to run first on the same route (missing prior decision)',
      );
    }

    const finalDecision = evaluateRecordLevelCheck(
      priorDecision,
      ecclesiaContext.actor,
      ecclesiaContext.resource,
      ecclesiaContext.branchConfig,
    );
    request[ECCLESIA_RBAC_DECISION_KEY] = finalDecision;

    if (finalDecision.effect === 'DENY') {
      throw new ForbiddenException(finalDecision.reason);
    }
    return true;
  }
}
