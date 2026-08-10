import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../services/group-scope.service';

/**
 * Loads the `ResourceContext` for a route acting on an existing Group
 * (`GET/PATCH /v1/groups/:id`). See `GroupScopeService`'s doc comment for
 * the resolution logic (extracted there so Gatherings can reuse it too).
 */
@Injectable()
export class GroupResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    return this.groupScopeService.loadResourceContext(id);
  }
}

/**
 * `POST /v1/groups` has no `:id` to load - PRD §17.3 has no row for Group
 * creation at all (see `people.group.*`'s doc comment in
 * `libs/rbac/src/lib/actions.ts`), and the matrix rows this module
 * inferred grant `people.group.create` only at BRANCH scope
 * (RESIDENT_PASTOR, ADMIN) - deliberately no CLUSTER/OWN_GROUP create
 * grant, since deciding which cluster or leader a brand-new Group belongs
 * to is itself unresolved (`db/DESIGN_NOTES.md` Open Question #1). The
 * resource is therefore trivially "the actor's own Branch," same pattern
 * as `PersonCreateResourceContextGuard`.
 */
@Injectable()
export class GroupCreateResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService, prisma: PrismaService) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId };
  }
}

/**
 * `GET /groups` (Ministry Web Admin sprint). Unlike `PersonListResourceContextGuard`,
 * this always resolves to the actor's own Branch - there is no per-request
 * "which single Group" to resolve an OWN_GROUP/CLUSTER scope from, since
 * the whole point of this route is *listing* Groups, not reading through
 * one already-known Group. This is a deliberate, not an incomplete,
 * design: a BACENTA_LEADER/BASONTA_LEADER already knows their own single
 * Group id (`actor.bacentaId`/`basontaId`) and has no need to list; an
 * ASSISTANT_PASTOR's CLUSTER scope cannot match a bare `{ branchId }`
 * resource at all (`evaluate.ts`'s CLUSTER case requires a `bacentaId` to
 * test membership against - see `MINISTRY_DESIGN_NOTES.md`'s own
 * "structural limitation" section for the same underlying gap), so this
 * route correctly denies them rather than returning an inconsistent
 * partial list. Only BRANCH-scoped roles (Resident Pastor, Admin) can
 * successfully call this route - which is exactly `people.group.read`'s
 * intended audience for a *branch-wide* listing.
 */
@Injectable()
export class GroupListResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService, prisma: PrismaService) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId };
  }
}
