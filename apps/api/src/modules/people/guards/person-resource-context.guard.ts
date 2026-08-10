import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../services/group-scope.service';
import { PersonScopeService } from '../services/person-scope.service';

/**
 * Loads the `ResourceContext` for a route acting on an existing Person
 * (`GET/PATCH /v1/people/:id`, `POST /v1/people/:id/lifecycle-transitions`).
 * See `EcclesiaContextGuardBase`'s doc comment for why this must be a
 * Guard, not an Interceptor.
 *
 * The actual `bacentaId`/`basontaId` resolution (including the "resolve
 * `basontaId` from the actor's perspective, not the Person's" reasoning -
 * see `PersonScopeService`'s doc comment for the full explanation) now
 * lives in `PersonScopeService`, People module's exported public service
 * interface (Blueprint §7.2), so it can be reused both here and by the
 * Group Membership module's own resource-context guard, as well as by
 * Pastoral Care's upcoming FollowUpTask/PastoralNote/PoimenEnrollment
 * resource-context guards, without any of them reaching into People's
 * `PersonRepository`/Prisma layer directly.
 */
@Injectable()
export class PersonResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly personScopeService: PersonScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    return this.personScopeService.loadResourceContext(id, actor);
  }
}

/**
 * `POST /v1/people` has no `:id` to load - PRD §17.3's `people.person.create`
 * row grants only ADMIN, at BRANCH scope, so the resource is trivially
 * "the actor's own Branch." No database read is needed.
 */
@Injectable()
export class PersonCreateResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService, prisma: PrismaService) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId };
  }
}

/**
 * `GET /people` (People Web Admin sprint - PRD §16.1's "Search &
 * directory"). `groupId` present means an OWN_GROUP/CLUSTER-scoped actor
 * named their own group - resolved via `GroupScopeService`, the same
 * pattern `GatheringListResourceContextGuard` already established.
 * `groupId` absent falls back to the actor's own Branch (unlike
 * Gatherings' list guard, which has no such fallback - `GET /gatherings`
 * has no BRANCH-scoped "list everything" case, but People's does: PRD
 * §16.1 explicitly names "an Admin searches the whole Branch").
 */
@Injectable()
export class PersonListResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const groupId = (request.query as Record<string, string>).groupId;
    if (groupId) {
      return this.groupScopeService.loadResourceContext(groupId);
    }
    return Promise.resolve({ branchId: actor.branchId });
  }
}
