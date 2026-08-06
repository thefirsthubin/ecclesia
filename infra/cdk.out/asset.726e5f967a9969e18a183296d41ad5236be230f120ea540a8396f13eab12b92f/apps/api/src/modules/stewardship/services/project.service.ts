import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateProjectInput, ProjectResponseDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { Project } from '@prisma/client';

import { PledgeRepository } from '../repositories/pledge.repository';
import { ProjectRepository } from '../repositories/project.repository';

/** `progress` is `null` when `targetAmountMinor` is `0` - nothing to
 * divide by, and a Project with no target has no percentage to report,
 * rather than a misleading `0` or `Infinity`. Not capped at 100 - a
 * Project can be over-funded, and clamping here would hide that fact from
 * a caller who might want to show it. */
function computeProgressPercent(totalReceivedMinor: bigint, targetAmountMinor: bigint): number | null {
  if (targetAmountMinor === 0n) {
    return null;
  }
  // `Number()` on a BigInt ratio computed via bigint division would lose
  // all fractional precision (bigint division truncates) - converting
  // both operands to `Number` first is the correct approach here, and
  // safe: minor-currency-unit amounts this codebase deals with (single
  // Branch, single Project) are nowhere near JS's 2^53 safe-integer limit.
  return Math.round((Number(totalReceivedMinor) / Number(targetAmountMinor)) * 100);
}

function toResponseDto(project: Project, totalPledgedMinor: bigint, totalReceivedMinor: bigint): ProjectResponseDto {
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
    totalPledgedMinor: totalPledgedMinor.toString(),
    totalReceivedMinor: totalReceivedMinor.toString(),
    progressPercent: computeProgressPercent(totalReceivedMinor, project.targetAmountMinor),
  };
}

/**
 * FR-STW-08/H2: Project entities against which Pledges are tracked.
 * `getById` now includes FR-STW-08's own "total pledged, total received,
 * progress against target" aggregation - previously flagged in
 * `STEWARDSHIP_DESIGN_NOTES.md` as a near-term, low-risk follow-up left
 * out to keep the original milestone reviewable, now closed. See
 * `PledgeRepository.sumByProject`'s own doc comment for the aggregation
 * itself.
 */
@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly pledgeRepository: PledgeRepository,
  ) {}

  async create(actor: ActorContext, input: CreateProjectInput): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.create({
      branchId: actor.branchId,
      name: input.name,
      description: input.description,
      targetAmountMinor: BigInt(input.targetAmountMinor),
      currency: input.currency ?? 'GHS',
      createdByPersonId: actor.personId,
    });
    // A brand-new Project has no Pledges yet - skip the aggregation query
    // rather than running it against a Project that cannot possibly have
    // any rows to sum.
    return toResponseDto(project, 0n, 0n);
  }

  async getById(id: string): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException(`No Project found with id '${id}'`);
    }
    const { totalPledgedMinor, totalReceivedMinor } = await this.pledgeRepository.sumByProject(id);
    return toResponseDto(project, totalPledgedMinor, totalReceivedMinor);
  }
}
