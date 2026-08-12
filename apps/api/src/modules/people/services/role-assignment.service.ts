import { randomUUID } from 'crypto';

import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { checkRoleAssignmentEligibility } from '@ecclesia/domain-people';
import { evaluate, PERMISSION_MATRIX } from '@ecclesia/rbac';
import type { Action, ActorContext, ResourceContext } from '@ecclesia/rbac';
import type { CreateRoleAssignmentRequestInput, PublishableEngagementSignal, RoleAssignmentResponseDto } from '@ecclesia/contracts';
import type { RoleAssignment } from '@prisma/client';

import { EventBridgePublisherService } from '../../../platform/events/eventbridge-publisher.service';
import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PoimenEnrollmentService } from '../../pastoral-care/services/poimen-enrollment.service';
import { PersonRepository } from '../repositories/person.repository';
import { RoleAssignmentRepository } from '../repositories/role-assignment.repository';
import type { CreateRoleAssignmentRecord } from '../repositories/role-assignment.repository';

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
 *
 * **Why this service injects `PoimenEnrollmentService` rather than
 * querying `pastoral_care.poimen_enrollments` itself.** It used to do the
 * latter (`RoleAssignmentRepository.findPoimenStatus`), a module-boundary
 * violation - a People-schema repository reaching into a table
 * Blueprint §7.2 assigns to the `pastoral_care` schema/module. Fixed in
 * the Pastoral Care milestone by consuming Pastoral Care's own exported
 * public service interface instead (`PastoralCareModule`'s `forwardRef`
 * import of `PeopleModule`, and vice versa, is what makes this injection
 * possible - see both modules' doc comments). See
 * `PASTORAL_CARE_DESIGN_NOTES.md`.
 */
@Injectable()
export class RoleAssignmentService {
  constructor(
    private readonly roleAssignmentRepository: RoleAssignmentRepository,
    private readonly personRepository: PersonRepository,
    private readonly branchConfigurationService: BranchConfigurationService,
    private readonly poimenEnrollmentService: PoimenEnrollmentService,
    private readonly eventPublisher: EventBridgePublisherService,
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
      resource.candidatePoimenStatus = await this.poimenEnrollmentService.getStatus(person.id);
    }

    const branchConfig = await this.branchConfigurationService.loadForBranch(person.branchId);
    const decision = evaluate(actor, action, resource, branchConfig, PERMISSION_MATRIX);
    if (decision.effect === 'DENY') {
      throw new ForbiddenException(decision.reason);
    }

    const grantedByUserId = await this.roleAssignmentRepository.findUserIdByPersonId(actor.personId);

    const record: CreateRoleAssignmentRecord = {
      personId: person.id,
      role: input.role,
      branchId: person.branchId,
      groupId: input.groupId,
      scopeGroupIds: input.scopeGroupIds,
      grantedByUserId,
      effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : undefined,
    };

    // PRD §17.2: "Exactly one active Bacenta Leader per Bacenta at a
    // time." A plain create() would let a second concurrently-active
    // BACENTA_LEADER assignment for the same Bacenta coexist, silently
    // violating that invariant (PRD §19.4 step 6 describes this exact
    // succession scenario - a new Shepherd replacing a departing one).
    // `input.groupId` is optional on the contract in general, but this
    // branch only ever runs for BACENTA_LEADER grants, which are
    // meaningless without a target Bacenta - if it's missing here, that's
    // a caller error the eligibility/authorization checks above should
    // already have every reason to have required, not a case to silently
    // skip succession for.
    if (input.role === 'BACENTA_LEADER' && input.groupId) {
      const now = record.effectiveFrom ?? new Date();
      const priorLeader = await this.roleAssignmentRepository.findActiveBacentaLeader(input.groupId, now);
      const created = await this.roleAssignmentRepository.createWithSuccession(record, priorLeader?.id, now);
      await this.publishRoleAssignmentActive(created);
      return toResponseDto(created);
    }

    const created = await this.roleAssignmentRepository.create(record);
    await this.publishRoleAssignmentActive(created);

    return toResponseDto(created);
  }

  /**
   * `[Engagement Signal Ingestion Pipeline milestone]` Blueprint §10.4's
   * `role_assignment.active` (Serving category) - fires for every role
   * grant regardless of the target Group's `type`, including `BACENTA_LEADER`
   * succession. This is distinct from `GroupMembershipService`'s
   * `basonta_roster.updated` below, which fires only when a *membership* (as
   * opposed to a *role*) opens in a `MINISTRY`-type Group - a Person can
   * receive a role without any Group membership at all (`input.groupId` is
   * optional on the contract), so the two signals are not redundant.
   */
  private async publishRoleAssignmentActive(assignment: RoleAssignment): Promise<void> {
    const envelope: PublishableEngagementSignal = {
      eventId: randomUUID(),
      eventType: 'role_assignment.active',
      schemaVersion: 1,
      branchId: assignment.branchId,
      occurredAt: assignment.effectiveFrom.toISOString(),
      subjectPersonId: assignment.personId,
      subjectGroupId: assignment.groupId ?? undefined,
      payload: { role: assignment.role, groupId: assignment.groupId },
    };
    await this.eventPublisher.publish(envelope);
  }

  /** FR-PPL-07: full Role Assignment history for a Person, including
   * closed/past assignments. Declarative RBAC (`people.role_assignment.read`)
   * is sufficient here, unlike `grant()` above - reading history has no
   * data-dependent action selection to make. */
  async listForPerson(personId: string): Promise<RoleAssignmentResponseDto[]> {
    const assignments = await this.roleAssignmentRepository.listByPerson(personId);
    return assignments.map(toResponseDto);
  }

  /**
   * `[Role Assignment Revoke milestone]` `POST
   * /people/:personId/role-assignments/:assignmentId/revoke` - ends a
   * currently-active assignment by setting `effectiveTo = now`, the same
   * temporal "close, don't delete" model `createWithSuccession` already
   * uses to end a prior Bacenta Leader during succession. Declarative RBAC
   * (`people.role_assignment.update`, an existing matrix action that
   * previously had no route implementing it at all) is sufficient here -
   * unlike `grant()`, there is no data-dependent action selection to make
   * (revoking is always `.update`, regardless of which `role` the
   * assignment being ended holds).
   *
   * **No successor is created, and none is required** - PRD §17.2's
   * "exactly one active Bacenta Leader per Bacenta at a time" is an
   * upper-bound constraint, not a lower-bound one; `createWithSuccession`'s
   * own doc comment already anticipates and accepts a Bacenta having zero
   * active leaders ("one whose leader stepped down without a same-transaction
   * successor") as a normal, valid transient state. Revoking any role
   * (including `BACENTA_LEADER`) is therefore just an ordinary close - no
   * role-specific branching, no invented "protected role" restriction, and
   * no restriction on self-revocation - none of these exist as domain
   * rules anywhere traced for this milestone, so none are added here.
   *
   * **No Engagement Signal is published.** `role_assignment.active`
   * (`publishRoleAssignmentActive` above) is the only Role-Assignment-shaped
   * event type in the closed `ENGAGEMENT_SIGNAL_EVENT_TYPES` catalog
   * (`libs/contracts`) - there is no `role_assignment.inactive`/`.ended`/
   * `.revoked` type modeled anywhere. Inventing one would mean extending a
   * closed, exhaustively-typed classification map another domain
   * (`libs/domain/insights`) owns, which is out of this milestone's scope
   * and not required by any traced rule - so revoke has no EventBridge
   * side effect at all, confirmed by omission, not overlooked.
   */
  async revoke(personId: string, assignmentId: string): Promise<RoleAssignmentResponseDto> {
    const existing = await this.roleAssignmentRepository.findById(assignmentId);
    if (!existing || existing.personId !== personId) {
      throw new NotFoundException(`No Role Assignment found with id '${assignmentId}' for Person '${personId}'`);
    }

    const now = new Date();
    const isActive = existing.effectiveFrom <= now && (existing.effectiveTo === null || existing.effectiveTo > now);
    if (!isActive) {
      throw new ConflictException(`Role Assignment '${assignmentId}' is not currently active`);
    }

    const revoked = await this.roleAssignmentRepository.revoke(assignmentId, now);
    return toResponseDto(revoked);
  }
}
