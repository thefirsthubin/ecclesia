import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { checkLifecycleTransition, findDuplicateCandidates, requiresGroupMembershipToTransition } from '@ecclesia/domain-people';
import type { CreatePersonInput, LifecycleTransitionRequestInput, PersonResponseDto, UpdatePersonInput } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { Person } from '@prisma/client';

import { PersonRepository } from '../repositories/person.repository';

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
  constructor(private readonly personRepository: PersonRepository) {}

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
    return toResponseDto(updated);
  }
}
