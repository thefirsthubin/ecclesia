import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { firstValueFrom, from } from 'rxjs';

import { ACTOR_CONTEXT_KEY } from '../auth/auth.guard';
import type { RequestWithActorContext } from '../auth/auth.guard';
import { PrismaService } from './prisma.service';

/**
 * `[Row-Level Security sprint]` This codebase's first `NestInterceptor`.
 * Wraps every authenticated HTTP request's handler in exactly one
 * `PrismaService.runInBranchScope(actor.branchId, ...)` call, so every
 * repository query anywhere in that request's call stack transparently
 * runs inside the one transaction that has `app.current_branch_id` set -
 * see `db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md` §4.
 *
 * Reads `request[ACTOR_CONTEXT_KEY]`, the same property `AuthGuard`
 * attaches (`auth.guard.ts`). Guards run before interceptors in Nest's
 * request lifecycle, so by the time this runs, either:
 *
 * - the route is `@Public()` and `AuthGuard` returned `true` without ever
 *   setting `request.actorContext` - nothing to scope, this interceptor is
 *   a no-op (`return next.handle()`); or
 * - the route required authentication and `AuthGuard` already resolved and
 *   attached a real `ActorContext` (any failure there threw before this
 *   interceptor ever runs) - `actor.branchId` is always a valid UUID at
 *   this point, already validated Sprint 1.4's Cognito/dev-auth path.
 *
 * Bridges Nest's `Observable`-based interceptor contract to the
 * `Promise`-based `runInBranchScope`: `firstValueFrom(next.handle())`
 * resolves the (always single-emission, HTTP-response-shaped) observable
 * into a promise, `runInBranchScope` runs it inside the branch-scoped
 * transaction, and `from(...)` converts the resulting promise back into
 * the `Observable` Nest's pipeline expects to receive.
 */
@Injectable()
export class BranchScopeInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithActorContext>();
    const actor = request[ACTOR_CONTEXT_KEY];

    if (!actor) {
      return next.handle();
    }

    return from(this.prisma.runInBranchScope(actor.branchId, () => firstValueFrom(next.handle())));
  }
}
