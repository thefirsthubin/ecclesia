import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { PersonScopeService } from '../../people/services/person-scope.service';

/**
 * `POST/GET/PATCH /v1/people/:personId/poimen-enrollment` -
 * [INFERRED - no PRD §17.3 row, see `libs/rbac/src/lib/actions.ts`'s
 * `pastoral_care.poimen_enrollment.*` doc comment]. The resource being
 * scoped is "the candidate Person," the exact same resolution
 * `PersonResourceContextGuard`/`GroupMembershipResourceContextGuard`
 * already need - reused here via `PersonScopeService`, People module's
 * exported public service interface (Blueprint §7.2), rather than
 * Pastoral Care reaching into People's `PersonRepository`/Prisma layer
 * directly. This is the cross-module consumption
 * `PASTORAL_CARE_DESIGN_NOTES.md` describes: `PastoralCareModule` imports
 * `PeopleModule` (with `forwardRef`, since `PeopleModule` in turn imports
 * `PastoralCareModule` for `PoimenEnrollmentService` - see both modules'
 * doc comments) specifically to inject this service.
 */
@Injectable()
export class PoimenEnrollmentResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly personScopeService: PersonScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const personId = (request.params as Record<string, string>).personId;
    return this.personScopeService.loadResourceContext(personId, actor);
  }
}
