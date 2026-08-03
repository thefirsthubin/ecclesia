import 'reflect-metadata';

import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { ActorContext } from '@ecclesia/rbac';
import type { AuditLogService } from '../audit/audit-log.service';
import type { ActorContextResolverService } from './actor-context-resolver.service';
import { AuthGuard } from './auth.guard';
import type { RequestWithActorContext } from './auth.guard';
import { Public } from './decorators/public.decorator';
import type { TokenVerifierService } from './token-verifier.interface';

function buildContext(request: Partial<RequestWithActorContext>, handler: () => void = () => undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => handler,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  const actor: ActorContext = { personId: 'person-1', role: 'MEMBER', branchId: 'branch-1' };
  // Named generically, not `cognitoVerifier` - `AuthGuard` depends on the
  // `TokenVerifierService` abstraction (Development Authentication sprint),
  // never a concrete implementation, so these tests exercise the guard's
  // behavior against *any* conforming verifier, not specifically Cognito's.
  let tokenVerifier: jest.Mocked<TokenVerifierService>;
  let actorContextResolver: jest.Mocked<Pick<ActorContextResolverService, 'resolve'>>;
  let auditLog: jest.Mocked<Pick<AuditLogService, 'record'>>;
  let reflector: Reflector;

  beforeEach(() => {
    tokenVerifier = { verifyAccessToken: jest.fn() };
    actorContextResolver = { resolve: jest.fn() };
    auditLog = { record: jest.fn().mockResolvedValue(undefined) };
    reflector = new Reflector();
  });

  function buildGuard(): AuthGuard {
    return new AuthGuard(
      tokenVerifier,
      actorContextResolver as unknown as ActorContextResolverService,
      auditLog as unknown as AuditLogService,
      reflector,
    );
  }

  it('allows a @Public() route through without verifying a token', async () => {
    class Controller {
      @Public()
      handler(): void {
        /* noop */
      }
    }
    const guard = buildGuard();
    const context = buildContext({ headers: {} }, new Controller().handler);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(tokenVerifier.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('rejects a request with no Authorization header and logs the failure', async () => {
    const guard = buildGuard();
    const request: Partial<RequestWithActorContext> = { headers: {}, ip: '203.0.113.1' };
    const context = buildContext(request);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.token.verify', effect: 'DENY', ipAddress: '203.0.113.1' }),
    );
  });

  it('rejects a malformed Authorization header (no Bearer prefix)', async () => {
    const guard = buildGuard();
    const request: Partial<RequestWithActorContext> = { headers: { authorization: 'Basic abc123' } };
    const context = buildContext(request);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('verifies the token, resolves the actor, and attaches it to the request on success', async () => {
    tokenVerifier.verifyAccessToken.mockResolvedValue({ sub: 'cognito-sub-1' });
    actorContextResolver.resolve.mockResolvedValue(actor);
    const guard = buildGuard();
    const request: Partial<RequestWithActorContext> = { headers: { authorization: 'Bearer valid.jwt.token' } };
    const context = buildContext(request);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(tokenVerifier.verifyAccessToken).toHaveBeenCalledWith('valid.jwt.token');
    expect(actorContextResolver.resolve).toHaveBeenCalledWith('cognito-sub-1');
    expect(request.actorContext).toEqual(actor);
    expect(auditLog.record).not.toHaveBeenCalled();
  });

  it('logs and rethrows when token verification fails', async () => {
    tokenVerifier.verifyAccessToken.mockRejectedValue(new UnauthorizedException('Token expired'));
    const guard = buildGuard();
    const request: Partial<RequestWithActorContext> = { headers: { authorization: 'Bearer expired.jwt.token' } };
    const context = buildContext(request);

    await expect(guard.canActivate(context)).rejects.toThrow('Token expired');
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.token.verify', effect: 'DENY', reason: 'Token expired' }),
    );
  });

  it('picks up a device id from the X-Device-Id header when present', async () => {
    const guard = buildGuard();
    const request: Partial<RequestWithActorContext> = {
      headers: { 'x-device-id': 'device-abc' },
    };
    const context = buildContext(request);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(auditLog.record).toHaveBeenCalledWith(expect.objectContaining({ deviceId: 'device-abc' }));
  });
});
