import 'reflect-metadata';

import { ForbiddenException, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext, EcclesiaRequestContext, ResourceContext } from '@ecclesia/rbac';

import type { RequestWithActorContext } from '../auth/auth.guard';
import { BranchConfigurationService } from './branch-configuration.service';
import { PrismaService } from '../database/prisma.service';

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
 *
 * **Why `loadResource`/`loadForBranch` run inside `runInBranchScope` here,
 * not left to `BranchScopeInterceptor`.** Both can query RLS-protected
 * tables (`loadResource` implementations look up the target record via a
 * repository backed by `PrismaService`; `loadForBranch` always reads
 * `platform.configurations`). `BranchScopeInterceptor` sets
 * `app.current_branch_id` for the handler, but Guards run before
 * Interceptors - by the time this method runs, no branch scope exists yet,
 * so any such query would hit Postgres with `app.current_branch_id`
 * unset and be denied (or error) by RLS. Since Guards can't wrap
 * downstream execution the way an Interceptor's `next.handle()` can, this
 * class opens its own short-lived `runInBranchScope` transaction - closed
 * before `canActivate` returns - scoped to `actor.branchId`, the same
 * value `BranchScopeInterceptor` uses for the handler's own, separate
 * transaction afterward.
 */
@Injectable()
export abstract class EcclesiaContextGuardBase implements CanActivate {
  protected constructor(
    private readonly branchConfigurationService: BranchConfigurationService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Loads the `ResourceContext` for this specific route (e.g. "the Person
   * identified by `:id`"). Implemented per resource type by a concrete
   * subclass in the owning domain module - this base class has no
   * knowledge of any bounded context's own tables.
   */
  protected abstract loadResource(
    request: RequestWithActorContext,
    actor: ActorContext,
  ): Promise<ResourceContext>;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithActorContext>();
    const actor = request.actorContext;
    if (!actor) {
      // Should be unreachable in practice (AuthGuard is a global APP_GUARD
      // and runs first) - defensive, not a documented failure mode.
      throw new ForbiddenException('No authenticated actor context available - AuthGuard must run first');
    }

    const { resource, branchConfig } = await this.prisma.runInBranchScope(actor.branchId, async () => {
      const resource = await this.loadResource(request, actor);
      const branchConfig = await this.branchConfigurationService.loadForBranch(resource.branchId);
      return { resource, branchConfig };
    });

    const ecclesiaContext: EcclesiaRequestContext = { actor, resource, branchConfig };
    (request as RequestWithActorContext & Record<typeof ECCLESIA_REQUEST_CONTEXT_KEY, EcclesiaRequestContext>)[
      ECCLESIA_REQUEST_CONTEXT_KEY
    ] = ecclesiaContext;

    return true;
  }
}
