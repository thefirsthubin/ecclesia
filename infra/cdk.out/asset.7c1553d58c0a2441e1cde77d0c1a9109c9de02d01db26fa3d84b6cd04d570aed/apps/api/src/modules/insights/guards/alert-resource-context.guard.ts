import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../../people/services/group-scope.service';
import { AlertRepository } from '../repositories/alert.repository';

/**
 * `GET/PATCH /insights/alerts/:id` (read/resolve, FR-INS-03/05). Loads
 * the target Alert and resolves its `ResourceContext` from its own
 * `scopeType`/`scopeId` pair - `GROUP` resolves via People's
 * `GroupScopeService` (same pattern the dashboard guards use), `BRANCH`
 * resolves to the Alert's own `branchId` directly. `PERSON` is handled
 * defensively (falls back to the branch-only shape) but is unreachable in
 * practice - `PulseScoreService`/`AlertService` never construct a
 * `PERSON`-scoped Alert (NFR-PRIV-02).
 */
@Injectable()
export class AlertResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly alertRepository: AlertRepository,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    const alert = await this.alertRepository.findById(id);
    if (!alert) {
      throw new NotFoundException(`No Alert found with id '${id}'`);
    }

    if (alert.scopeType === 'GROUP') {
      return this.groupScopeService.loadResourceContext(alert.scopeId);
    }
    return { branchId: alert.branchId };
  }
}
