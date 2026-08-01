import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { PersonScopeService } from '../../people/services/person-scope.service';

/**
 * `POST/GET /v1/people/:personId/pastoral-notes` (§16.2). Same
 * "subject Person defines the scope" resolution as
 * `PoimenEnrollmentResourceContextGuard`, via `PersonScopeService`.
 */
@Injectable()
export class PastoralNoteResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly personScopeService: PersonScopeService,
  ) {
    super(branchConfigurationService);
  }

  protected loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const personId = (request.params as Record<string, string>).personId;
    return this.personScopeService.loadResourceContext(personId, actor);
  }
}
