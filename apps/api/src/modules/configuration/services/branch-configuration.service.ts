import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  BranchConfigurationResponseDto,
  ChurchPulseWeightsDto,
  CreateBranchConfigurationInput,
  SilentDriftThresholdsDto,
  UpdateBranchConfigurationInput,
} from '@ecclesia/contracts';
import type { Configuration, Prisma } from '@prisma/client';

import { BranchConfigurationRepository } from '../repositories/branch-configuration.repository';

function toResponseDto(configuration: Configuration): BranchConfigurationResponseDto {
  return {
    id: configuration.id,
    branchId: configuration.branchId,
    churchPulseWeights: configuration.churchPulseWeights as ChurchPulseWeightsDto,
    poimenGateEnabled: configuration.poimenGateEnabled,
    silentDriftConfig: configuration.silentDriftConfig as SilentDriftThresholdsDto,
    createdAt: configuration.createdAt.toISOString(),
    updatedAt: configuration.updatedAt.toISOString(),
  };
}

/**
 * `[Branch Configuration milestone]` PRD §17.3's "Configuration:
 * gathering/role/group types" row - the `churchPulseWeights`/
 * `poimenGateEnabled`/`silentDriftConfig` slice of `platform.configurations`
 * that has real, active consumers (see `platform.schemas.ts`'s own doc
 * comment for the trace). Deliberately not named `ConfigurationService`
 * or reusing `apps/api/src/platform/rbac/branch-configuration.service.ts`'s
 * class name - that service is narrow, read-only RBAC-support
 * infrastructure (`poimenGateEnabled` only, for `evaluate()`'s own use);
 * this is the actual read/write business capability, a distinct concern
 * that happens to read/write the same table.
 */
@Injectable()
export class BranchConfigurationCrudService {
  constructor(private readonly branchConfigurationRepository: BranchConfigurationRepository) {}

  async getForBranch(branchId: string): Promise<BranchConfigurationResponseDto> {
    const configuration = await this.branchConfigurationRepository.findByBranch(branchId);
    if (!configuration) {
      throw new NotFoundException(`No Configuration found for Branch '${branchId}'`);
    }
    return toResponseDto(configuration);
  }

  async create(branchId: string, input: CreateBranchConfigurationInput): Promise<BranchConfigurationResponseDto> {
    const configuration = await this.branchConfigurationRepository.create({
      branchId,
      churchPulseWeights: (input.churchPulseWeights ?? {}) as Prisma.InputJsonValue,
      poimenGateEnabled: input.poimenGateEnabled ?? false,
      silentDriftConfig: (input.silentDriftConfig ?? {}) as Prisma.InputJsonValue,
    });
    return toResponseDto(configuration);
  }

  /**
   * Existence is already guaranteed on the real HTTP path by
   * `BranchConfigurationResourceContextGuard`... no - that guard resolves
   * scope from `actor.branchId` alone, it never loads the `Configuration`
   * row itself (there is nothing more specific to check for a per-Branch
   * singleton). So this 404 is the *only* existence check for update -
   * matching `GroupService.update()`'s own defense-in-depth precedent,
   * just load-bearing here rather than a backstop.
   */
  async update(branchId: string, input: UpdateBranchConfigurationInput): Promise<BranchConfigurationResponseDto> {
    const existing = await this.branchConfigurationRepository.findByBranch(branchId);
    if (!existing) {
      throw new NotFoundException(`No Configuration found for Branch '${branchId}'`);
    }

    const configuration = await this.branchConfigurationRepository.update(branchId, {
      churchPulseWeights: input.churchPulseWeights as Prisma.InputJsonValue | undefined,
      poimenGateEnabled: input.poimenGateEnabled,
      silentDriftConfig: input.silentDriftConfig as Prisma.InputJsonValue | undefined,
    });
    return toResponseDto(configuration);
  }
}
