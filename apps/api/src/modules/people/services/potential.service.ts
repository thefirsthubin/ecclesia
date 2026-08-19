import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreatePotentialInput, ListPotentialsQuery, PotentialResponseDto, UpdatePotentialInput } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { Potential } from '@prisma/client';

import { PotentialRepository } from '../repositories/potential.repository';

function toResponseDto(potential: Potential): PotentialResponseDto {
  return {
    id: potential.id,
    branchId: potential.branchId,
    groupId: potential.groupId,
    personId: potential.personId,
    firstName: potential.firstName,
    lastName: potential.lastName,
    phone: potential.phone,
    source: potential.source,
    status: potential.status,
    notes: potential.notes,
    assignedToPersonId: potential.assignedToPersonId,
    createdByPersonId: potential.createdByPersonId,
    createdAt: potential.createdAt.toISOString(),
    updatedAt: potential.updatedAt.toISOString(),
  };
}

/**
 * `[Milestone C.1.1: Complete Read Models]` Orchestrates the `Potential`
 * use cases - see `db/schema.prisma`'s own `Potential` model doc comment
 * for the full design, and Phase 1 decision #4 (Milestone C) for the
 * approved product shape this completes. Authorization (who may call
 * these methods, for which resource) is already decided by the time
 * these methods run - by the resource-context guards + `RbacGuard` at
 * the HTTP layer - this class only orchestrates persistence, the same
 * division of responsibility every other service in this codebase
 * follows.
 *
 * **`list()`'s Branch-wide fallback is deliberately not Council-looped**,
 * mirroring `OutreachService.list()`'s own exact precedent: Resident
 * Pastor's `people.potential.read` grant is COUNCIL-scoped in the
 * matrix, but (matching Outreach's own already-accepted shape) this
 * queries only `actor.branchId`, never loops `actor.councilBranchIds`.
 * Not a new gap this class introduces - an existing, consistent pattern
 * this class continues rather than solves differently for one resource
 * and not the other.
 */
@Injectable()
export class PotentialService {
  constructor(private readonly potentialRepository: PotentialRepository) {}

  async create(actor: ActorContext, input: CreatePotentialInput): Promise<PotentialResponseDto> {
    const potential = await this.potentialRepository.create({
      branchId: actor.branchId,
      groupId: input.groupId,
      personId: input.personId,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      source: input.source,
      notes: input.notes,
      assignedToPersonId: input.assignedToPersonId,
      createdByPersonId: actor.personId,
    });
    return toResponseDto(potential);
  }

  async getById(id: string): Promise<PotentialResponseDto> {
    const potential = await this.requirePotential(id);
    return toResponseDto(potential);
  }

  /** `query.groupId` present -> that one Group's own Potentials; absent
   * -> a CLUSTER-scoped actor (Assistant Pastor) gets their whole
   * cluster, an OWN_GROUP-scoped actor (Bacenta/Basonta Leader) gets
   * their one own Group, and a COUNCIL-scoped read-only actor (Resident
   * Pastor) falls back to their own Branch - the identical three-way
   * shape `FollowUpTaskService.list`'s own `[Milestone C]` cluster fix
   * already established. */
  async list(actor: ActorContext, query: ListPotentialsQuery): Promise<PotentialResponseDto[]> {
    let potentials: Potential[];
    if (query.groupId) {
      potentials = await this.potentialRepository.listByGroup(query.groupId);
    } else if (actor.clusterBacentaIds && actor.clusterBacentaIds.length > 0) {
      potentials = await this.potentialRepository.listByGroups(actor.clusterBacentaIds);
    } else {
      const ownGroupId = actor.bacentaId ?? actor.basontaId;
      potentials = ownGroupId
        ? await this.potentialRepository.listByGroups([ownGroupId])
        : await this.potentialRepository.listByBranch(actor.branchId);
    }
    return potentials.map(toResponseDto);
  }

  async update(id: string, input: UpdatePotentialInput): Promise<PotentialResponseDto> {
    await this.requirePotential(id);
    const potential = await this.potentialRepository.update(id, {
      status: input.status,
      notes: input.notes,
      assignedToPersonId: input.assignedToPersonId,
      personId: input.personId,
    });
    return toResponseDto(potential);
  }

  private async requirePotential(id: string): Promise<Potential> {
    const potential = await this.potentialRepository.findById(id);
    if (!potential) {
      throw new NotFoundException(`No Potential found with id '${id}'`);
    }
    return potential;
  }
}
