import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

import { ECCLESIA_RBAC_DECISION_KEY, ECCLESIA_REQUEST_CONTEXT_KEY } from '../request-context';
import type { EcclesiaRequestContext, RequestWithEcclesiaContext } from '../request-context';
import type { AuthorizationDecision, PermissionRule } from '../types';
import { RecordLevelPolicyGuard } from './record-level-policy.guard';

function buildContext(request: RequestWithEcclesiaContext): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const verifyRule: PermissionRule = {
  role: 'TREASURER',
  action: 'stewardship.transaction.verify',
  effect: 'ALLOW',
  scope: 'BRANCH',
  recordLevelCheck: 'DIFFERENT_ACTOR_THAN_RECORDER',
};

const treasurerContext: EcclesiaRequestContext = {
  actor: { personId: 'treasurer-1', role: 'TREASURER', branchId: 'b1' },
  resource: { branchId: 'b1', recordedByPersonId: 'someone-else' },
  branchConfig: { poimenGateEnabled: false },
};

describe('RecordLevelPolicyGuard (Blueprint §9.4)', () => {
  it('throws when RbacGuard has not run first (no prior decision on the request)', () => {
    const request: RequestWithEcclesiaContext = { [ECCLESIA_REQUEST_CONTEXT_KEY]: treasurerContext };
    const guard = new RecordLevelPolicyGuard();
    expect(() => guard.canActivate(buildContext(request))).toThrow(ForbiddenException);
  });

  it('passes through when the record-level check succeeds', () => {
    const priorDecision: AuthorizationDecision = {
      effect: 'ALLOW',
      matchedRule: verifyRule,
      reason: 'role/scope granted',
    };
    const request: RequestWithEcclesiaContext = {
      [ECCLESIA_REQUEST_CONTEXT_KEY]: treasurerContext,
      [ECCLESIA_RBAC_DECISION_KEY]: priorDecision,
    };
    const guard = new RecordLevelPolicyGuard();
    expect(guard.canActivate(buildContext(request))).toBe(true);
    expect(request[ECCLESIA_RBAC_DECISION_KEY]?.effect).toBe('ALLOW');
  });

  it('throws when the record-level check fails (verifier is the recorder)', () => {
    const priorDecision: AuthorizationDecision = {
      effect: 'ALLOW',
      matchedRule: verifyRule,
      reason: 'role/scope granted',
    };
    const request: RequestWithEcclesiaContext = {
      [ECCLESIA_REQUEST_CONTEXT_KEY]: {
        ...treasurerContext,
        resource: { branchId: 'b1', recordedByPersonId: 'treasurer-1' },
      },
      [ECCLESIA_RBAC_DECISION_KEY]: priorDecision,
    };
    const guard = new RecordLevelPolicyGuard();
    expect(() => guard.canActivate(buildContext(request))).toThrow(ForbiddenException);
  });
});
