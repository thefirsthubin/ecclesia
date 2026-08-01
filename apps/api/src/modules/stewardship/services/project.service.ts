import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateProjectInput, ProjectResponseDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { Project } from '@prisma/client';

import { ProjectRepository } from '../repositories/project.repository';

function toResponseDto(project: Project): ProjectResponseDto {
  return {
    id: project.id,
    branchId: project.branchId,
    name: project.name,
    description: project.description,
    targetAmountMinor: project.targetAmountMinor.toString(),
    currency: project.currency,
    status: project.status,
    createdByPersonId: project.createdByPersonId,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

/**
 * FR-STW-08/H2: Project entities against which Pledges are tracked. Only
 * create/read are built this milestone - see `PledgeService` for
 * fulfillment, and `STEWARDSHIP_DESIGN_NOTES.md` for why progress
 * aggregation (total pledged/received vs. target) is deferred.
 */
@Injectable()
export class ProjectService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async create(actor: ActorContext, input: CreateProjectInput): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.create({
      branchId: actor.branchId,
      name: input.name,
      description: input.description,
      targetAmountMinor: BigInt(input.targetAmountMinor),
      currency: input.currency ?? 'GHS',
      createdByPersonId: actor.personId,
    });
    return toResponseDto(project);
  }

  async getById(id: string): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException(`No Project found with id '${id}'`);
    }
    return toResponseDto(project);
  }
}
