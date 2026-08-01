import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { checkRoleAssignmentEligibility } from '@ecclesia/domain-people';
import { evaluate, PERMISSION_MATRIX } from '@ecclesia/rbac';
import type { Action, ActorContext, ResourceContext } from '@ecclesia/rbac';
import type { CreateRoleAssignmentRequestInput, RoleAssignmentResponseDto } from '@ecclesia/contracts';
import type { RoleAssignment } from '@prisma/client';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PersonRepository } from '../repositories/person.repository';
import { RoleAssignmentRepository } from '../repositories/role-assignment.repository';

function toResponseDto(assignment: RoleAssignment): RoleAssignmentResponseDto {
  return {
    id: assignment.id,
    personId: assignment.personId,
    role: assignment.role,
    branchId: assignment.branchId,
    groupId: assignment.groupId,
    scopeGroupIds: assignment.scopeGroupIds,
    effectiveFrom: assignment.effectiveFrom.toISOString(),
    effectiveTo: assignment.effectiveTo ? assignment.effectiveTo.toISOString() : null,
  };
}

/**
 * PRD §17.3 "Role Assignment: grant Shepherd/Worker/etc." row.
 *
 * **Why this service calls `evaluate()` directly instead of relying on
 * the declarative `@RequirePermission` + `RbacGuard` pipeline every other
 * People endpoint uses.** The matrix names *two different actions* on
 * what is, from the client's point of view, one endpoint:
 * `people.role_assignment.grant_shepherd` (Poimen-gated,
 * `POIMEN_GATE_IF_ENABLED`) when the role being granted is
 * `BACENTA_LEADER`, and the ungated `people.role_assignment.grant` for
 * every other role. `@RequirePermission` is a static, decoration-time
 * value - it cannot see `request.body.role` to pick between the two.
 * Declaring the endpoint as `people.role_assignment.grant` and stopping
 * there would silently skip the Poimen gate for every Shepherd grant, a
 * real correctness bug, not a stylistic shortcut. `evaluate.ts`'s own doc
 * comment names this exact escape hatch: "what any service-layer code
 * should call for an imperative check outside the HTTP guard pipeline" -
 * this is that sanctioned case, not an invented workaround. See
 * `PEOPLE_DESIGN_NOTES.md`.
 */
@Injectable()
export class RoleAssignmentService {
  constructor(
    private readonly roleAssignmentRepository: RoleAssignmentRepository,
    private readonly personRepository: PersonRepository,
    private readonly branchConfigurationService: BranchConfigurationService,
  ) {}

  async grant(actor: ActorContext, personId: string, input: CreateRoleAssignmentRequestInput): Promise<RoleAssignmentResponseDto> {
    const person = await this.personRepository.findById(personId);
    if (!person) {
      throw new NotFoundException(`No Person found with id '${personId}'`);
    }

    // BR-PPL-04/FR-PPL-06 - a business-rule precondition on the
    // *candidate*, independent of whether the *granting actor* is
    // authorized (checked next). Both must pass.
    const eligibility = checkRoleAssignmentEligibility(input.role, person.lifecycleStage);
    if (!eligibility.eligible) {
      throw new ConflictException(eligibility.reason);
    }

    const action: Action =
      input.role === 'BACENTA_LEADER' ? 'people.role_assignment.grant_shepherd' : 'people.role_assignment.grant';

    const resource: ResourceContext = {
      branchId: person.branchId,
      candidatePersonId: person.id,
    };
    if (input.role === 'BACENTA_LEADER') {
      resource.candidatePoimenStatus = await this.roleAssignmentRepository.findPoimenStatus(person.id);
    }

    const branchConfig = await this.branchConfigurationService.loadForBranch(person.branchId);
    const decision = evaluate(actor, action, resource, branchConfig, PERMISSION_MATRIX);
    if (decision.effect === 'DENY') {
      throw new ForbiddenException(decision.reason);
    }

    const grantedByUserId = await this.roleAssignmentRepository.findUserIdByPersonId(actor.personId);

    const created = await this.roleAssignmentRepository.create({
      personId: person.id,
      role: input.role,
      branchId: person.branchId,
      groupId: input.groupId,
      scopeGroupIds: input.scopeGroupIds,
      grantedByUserId,
      effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : undefined,
    });

    return toResponseDto(created);
  }
}
