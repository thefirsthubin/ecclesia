import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ActorContext } from '@ecclesia/rbac';
import type { Request } from 'express';

import { AuditLogService } from '../audit/audit-log.service';
import { ActorContextResolverService } from './actor-context-resolver.service';
import { CognitoVerifierService } from './cognito-verifier.service';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

/** Property `AuthGuard` attaches the resolved actor to. */
export const ACTOR_CONTEXT_KEY = 'actorContext' as const;

export interface RequestWithActorContext extends Request {
  [ACTOR_CONTEXT_KEY]?: ActorContext;
}

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
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly cognitoVerifier: CognitoVerifierService,
    private readonly actorContextResolver: ActorContextResolverService,
    private readonly auditLog: AuditLogService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithActorContext>();
    try {
      const token = this.extractBearerToken(request);
      const payload = await this.cognitoVerifier.verifyAccessToken(token);
      const actor = await this.actorContextResolver.resolve(payload.sub);
      request[ACTOR_CONTEXT_KEY] = actor;
      return true;
    } catch (error) {
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

  private extractDeviceId(request: Request): string | undefined {
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

  private extractBearerToken(request: Request): string {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }
    return header.slice('Bearer '.length);
  }
}
