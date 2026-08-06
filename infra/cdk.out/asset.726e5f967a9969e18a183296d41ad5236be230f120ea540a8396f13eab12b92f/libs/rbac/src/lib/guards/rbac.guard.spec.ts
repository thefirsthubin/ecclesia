import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

import { REQUIRE_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { ECCLESIA_RBAC_DECISION_KEY, ECCLESIA_REQUEST_CONTEXT_KEY } from '../request-context';
import type { EcclesiaRequestContext, RequestWithEcclesiaContext } from '../request-context';
import { RbacGuard } from './rbac.guard';

function buildContext(
  metadata: unknown,
  request: RequestWithEcclesiaContext,
): { context: ExecutionContext; reflector: Reflector } {
  const reflector = { get: jest.fn().mockReturnValue(metadata) } as unknown as Reflector;
  const context = {
    getHandler: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, reflector };
}

const ecclesiaContext: EcclesiaRequestContext = {
  actor: { personId: 'p1', role: 'BACENTA_LEADER', branchId: 'b1', bacentaId: 'bacenta-1' },
  resource: { branchId: 'b1', bacentaId: 'bacenta-1' },
  branchConfig: { poimenGateEnabled: false },
};

describe('RbacGuard (Blueprint §9.4)', () => {
  it('throws when the handler has no @RequirePermission metadata', () => {
    const { context, reflector } = buildContext(undefined, {});
    const guard = new RbacGuard(reflector);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws when no EcclesiaRequestContext has been attached to the request', () => {
    const { context, reflector } = buildContext('gatherings.attendance.create', {});
    const guard = new RbacGuard(reflector);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws when evaluateRoleAndScope denies, using the real REQUIRE_PERMISSION_KEY reflector contract', () => {
    // stewardship.transaction.record is only ALLOWed for a BACENTA_LEADER
    // within their own group (OWN_GROUP) - a resource in a different
    // Bacenta must be denied.
    const request: RequestWithEcclesiaContext = {
      [ECCLESIA_REQUEST_CONTEXT_KEY]: {
        ...ecclesiaContext,
        resource: { branchId: 'b1', bacentaId: 'a-different-bacenta' },
      },
    };
    const { context, reflector } = buildContext('stewardship.transaction.record', request);
    const guard = new RbacGuard(reflector);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(reflector.get).toHaveBeenCalledWith(REQUIRE_PERMISSION_KEY, expect.anything());
  });

  it('returns true and stashes the decision on the request when the role/scope grant passes', () => {
    const request: RequestWithEcclesiaContext = { [ECCLESIA_REQUEST_CONTEXT_KEY]: ecclesiaContext };
    const { context, reflector } = buildContext('gatherings.attendance.create', request);
    const guard = new RbacGuard(reflector);
    expect(guard.canActivate(context)).toBe(true);
    expect(request[ECCLESIA_RBAC_DECISION_KEY]?.effect).toBe('ALLOW');
  });
});
