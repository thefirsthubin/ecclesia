import { randomUUID } from 'crypto';

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { checkLifecycleTransition, findDuplicateCandidates, requiresGroupMembershipToTransition } from '@ecclesia/domain-people';
import type {
  CreatePersonInput,
  PublishableEngagementSignal,
  LifecycleTransitionRequestInput,
  ListPeopleQuery,
  PersonResponseDto,
  UpdatePersonInput,
} from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { Person } from '@prisma/client';

import { EventBridgePublisherService } from '../../../platform/events/eventbridge-publisher.service';
import { PersonRepository } from '../repositories/person.repository';
import { GroupRosterService } from './group-roster.service';

function toResponseDto(person: Person): PersonResponseDto {
  return {
    id: person.id,
    branchId: person.branchId,
    firstName: person.firstName,
    lastName: person.lastName,
    phone: person.phone,
    email: person.email,
    dateOfBirth: person.dateOfBirth ? person.dateOfBirth.toISOString().slice(0, 10) : null,
    address: person.address,
    lifecycleStage: person.lifecycleStage,
    guardianPersonId: person.guardianPersonId,
    createdAt: person.createdAt.toISOString(),
    updatedAt: person.updatedAt.toISOString(),
  };
}

/**
 * Orchestrates the People module's Person use cases (Blueprint §6.4:
 * "Orchestrates use cases; calls into libs/domain/[bounded context] for
 * rules"). Authorization (who may call these methods, for which
 * resource) is already decided by the time these methods run - by
 * `PersonResourceContextGuard` + `RbacGuard` at the HTTP layer (see
 * `people.module.ts`) - this class only enforces the People domain's own
 * business rules (state machine validity, duplicate detection).
 */
@Injectable()
export class PersonService {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly groupRosterService: GroupRosterService,
    private readonly eventPublisher: EventBridgePublisherService,
  ) {}

  /**
   * `GET /people` (PRD §16.1's "Search & directory" capability). Scope is
   * already enforced by `PersonListResourceContextGuard`/`RbacGuard`
   * before this runs - `query.groupId` set means the actor's role is
   * OWN_GROUP/CLUSTER-scoped and named their own group; absent means a
   * BRANCH-scoped role (Resident Pastor/Admin/Treasurer) searching the
   * whole Branch. Group-scoped listing goes through `GroupRosterService`
   * (People's own "active roster" service, already built for the
   * Ministry milestone) rather than a bespoke query, so "who is
   * currently in this group" has exactly one definition across the
   * module.
   */
  async list(actor: ActorContext, query: ListPeopleQuery): Promise<PersonResponseDto[]> {
    if (query.groupId) {
      const roster = await this.groupRosterService.listActiveMembers(query.groupId);
      const persons = await this.personRepository.findByIds(
        roster.map((member) => member.personId),
        query.search,
      );
      return persons.map(toResponseDto);
    }

    const persons = await this.personRepository.findByBranch(actor.branchId, query.search);
    return persons.map(toResponseDto);
  }

  /**
   * FR-PPL-01 (create) + FR-PPL-02 (duplicate detection "on every
   * creation"). A found, unacknowledged duplicate candidate set is a 409,
   * not a silently-created second record - see `people.schemas.ts`'s
   * `overrideDuplicateCheck` doc comment for the resubmission contract.
   */
  async create(actor: ActorContext, input: CreatePersonInput): Promise<PersonResponseDto> {
    if (!input.overrideDuplicateCheck) {
      const candidates = await this.personRepository.findDuplicateCandidateSet(actor.branchId, input.lastName);
      const matches = findDuplicateCandidates(
        {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone ?? null,
          // No Bacenta assignment happens at Person creation in this
          // module's API surface (assignment is a separate step, PRD
          // §19.1 step 6) - FR-PPL-02's "name + Bacenta + approximate
          // age" rule cannot fire here as a result; only name+phone can.
          // See PEOPLE_DESIGN_NOTES.md.
          activeBacentaGroupId: null,
        },
        candidates,
      );
      if (matches.length > 0) {
        throw new ConflictException({
          message:
            'FR-PPL-02: likely duplicate Person record(s) found. Resubmit with overrideDuplicateCheck=true to create anyway.',
          candidates: matches,
        });
      }
    }

    const person = await this.personRepository.create({
      branchId: actor.branchId,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      address: input.address,
      guardianPersonId: input.guardianPersonId,
    });
    return toResponseDto(person);
  }

  async getById(id: string): Promise<PersonResponseDto> {
    const person = await this.personRepository.findById(id);
    if (!person) {
      throw new NotFoundException(`No Person found with id '${id}'`);
    }
    return toResponseDto(person);
  }

  /**
   * Existence is already guaranteed on the real HTTP path by
   * `PersonResourceContextGuard` (which must load the Person to build
   * `ResourceContext` before `RbacGuard` runs) - the explicit check here
   * is defense in depth, so this method is also correct when called
   * directly (not just via that guard chain), rather than surfacing a raw
   * Prisma "record not found" error as an unhandled 500.
   */
  async update(id: string, input: UpdatePersonInput): Promise<PersonResponseDto> {
    const existing = await this.personRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`No Person found with id '${id}'`);
    }

    const person = await this.personRepository.update(id, {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      dateOfBirth: input.dateOfBirth === undefined ? undefined : input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      address: input.address,
      guardianPersonId: input.guardianPersonId,
    });
    return toResponseDto(person);
  }

  /**
   * FR-PPL-03: enforces PRD §12.5's state machine before writing.
   * `FOLLOW_UP -> ASSIGNED_TO_BACENTA` is deliberately rejected here (see
   * `requiresGroupMembershipToTransition`'s doc comment) and must go
   * through `GroupMembershipService` instead, which performs both halves
   * of PRD §19.1 step 6 atomically.
   */
  async transitionLifecycleStage(id: string, input: LifecycleTransitionRequestInput): Promise<PersonResponseDto> {
    const existing = await this.personRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`No Person found with id '${id}'`);
    }

    if (requiresGroupMembershipToTransition(existing.lifecycleStage, input.toStage)) {
      throw new ConflictException(
        `PRD §19.1 step 6: '${existing.lifecycleStage}' -> '${input.toStage}' only happens together with opening a ` +
          "GROUP_MEMBERSHIP - use POST /v1/people/:id/group-memberships instead of this endpoint.",
      );
    }

    const check = checkLifecycleTransition(existing.lifecycleStage, input.toStage);
    if (!check.allowed) {
      throw new ConflictException(check.reason);
    }

    const updated = await this.personRepository.updateLifecycleStage(id, input.toStage);

    // `[Engagement Signal Ingestion Pipeline milestone]` Blueprint §10.4's
    // `lifecycle_stage.transitioned` (Visitor retention category).
    // `subjectPersonId` here is the Person whose stage transitioned, not
    // the acting user - the envelope has no field for "who caused this,"
    // and this method's own signature (unlike most other mutations in this
    // module) never took an `actor: ActorContext` parameter to begin with
    // (authorization already happened at the guard layer, per this class's
    // own doc comment) - see ENGAGEMENT_SIGNAL_PIPELINE_DESIGN_NOTES.md for
    // why no signature change was needed to publish this signal.
    const envelope: PublishableEngagementSignal = {
      eventId: randomUUID(),
      eventType: 'lifecycle_stage.transitioned',
      schemaVersion: 1,
      branchId: existing.branchId,
      occurredAt: updated.updatedAt.toISOString(),
      subjectPersonId: updated.id,
      payload: { fromStage: existing.lifecycleStage, toStage: updated.lifecycleStage },
    };
    await this.eventPublisher.publish(envelope);

    return toResponseDto(updated);
  }
}
