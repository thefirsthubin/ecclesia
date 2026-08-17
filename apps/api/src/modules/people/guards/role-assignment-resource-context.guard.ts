import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../services/group-scope.service';
import { PersonScopeService } from '../services/person-scope.service';
import { RoleAssignmentRepository } from '../repositories/role-assignment.repository';

/**
 * `GET /people/:personId/role-assignments` (People Web Admin sprint,
 * FR-PPL-07's role-history read). The `POST` route on this same
 * controller carries no guard at all (see `RoleAssignmentService`'s own
 * doc comment for why - the grant action is data-dependent on
 * `request.body.role`); reading history has no such wrinkle, so this
 * follows the ordinary declarative pattern every other read route uses -
 * same resource resolution `GroupMembershipResourceContextGuard` already
 * uses for the sibling `people/:personId/group-memberships` route (the
 * resource being scoped is the target Person's own scope, via the shared
 * `PersonScopeService`).
 */
@Injectable()
export class RoleAssignmentResourceContextGuard extends EcclesiaContextGuardBase {
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

/**
 * `[Role Assignment Revoke milestone]` `POST /people/:personId/role-assignments/:assignmentId/revoke`.
 * Unlike the read/list guard above (which scopes from the *target
 * Person's own* group membership via `PersonScopeService`), this
 * resolves scope from the **assignment's own** `groupId`/`branchId` via
 * `GroupScopeService` - the same "act on an existing scoped resource"
 * pattern `FollowUpTaskResourceContextGuard`/`GatheringResourceContextGuard`/
 * `GroupResourceContextGuard` already establish, applied here since
 * revoke's real target is a specific, already-existing `RoleAssignment`
 * row with its own scope, not the candidate-Person-shaped resource
 * `RoleAssignmentService.grant()` builds for a not-yet-existing one.
 *
 * Also verifies the assignment actually belongs to the `:personId` named
 * in the route - a 404 here (not merely "resource not found for RBAC
 * purposes") if it doesn't, so a caller can never learn anything about an
 * assignment via a mismatched Person id in the URL.
 */
@Injectable()
export class RoleAssignmentRevokeResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly roleAssignmentRepository: RoleAssignmentRepository,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const { personId, assignmentId } = request.params as Record<string, string>;
    const assignment = await this.roleAssignmentRepository.findById(assignmentId);
    if (!assignment || assignment.personId !== personId) {
      throw new NotFoundException(`No Role Assignment found with id '${assignmentId}' for Person '${personId}'`);
    }
    if (assignment.groupId) {
      return this.groupScopeService.loadResourceContext(assignment.groupId);
    }
    // `[Multi-Tenant Foundation, Phase 1]` `assignment.branchId` can now be
    // null (a Council-scoped assignment) - unreachable via the grant flow
    // today (`RoleAssignmentService.grant()` rejects COUNCIL_TREASURER/
    // SYSTEM_ADMINISTRATOR before one can ever be created), but this
    // guard's own type no longer guarantees that on its own. Revoking a
    // Council-scoped assignment has no defined resource-scope policy yet
    // (who is authorized to revoke a Council Treasurer's own assignment,
    // and against what scope, is a real product decision this phase does
    // not make) - failing loudly here, not guessing a scope that could
    // silently grant or deny revoke authority incorrectly.
    if (!assignment.branchId) {
      throw new ConflictException(
        `Role Assignment '${assignmentId}' is Council-scoped - revoking a Council-scoped Role Assignment isn't ` +
          'supported yet (no resource-scope policy exists for it). This is a deliberately deferred capability.',
      );
    }
    return { branchId: assignment.branchId };
  }
}
