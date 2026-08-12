import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Configuration } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateConfigurationRecord {
  branchId: string;
  churchPulseWeights: Prisma.InputJsonValue;
  poimenGateEnabled: boolean;
  silentDriftConfig: Prisma.InputJsonValue;
}

export interface UpdateConfigurationRecord {
  churchPulseWeights?: Prisma.InputJsonValue;
  poimenGateEnabled?: boolean;
  silentDriftConfig?: Prisma.InputJsonValue;
}

/**
 * `[Branch Configuration milestone]` Prisma-backed persistence for
 * `platform.configurations` - PRD §17.3's "Configuration: gathering/role/
 * group types" row. Deliberately not touching `gatheringTypes`/
 * `followupSlaDefaults` - see `platform.schemas.ts`'s own doc comment for
 * why (no active consumer for either today).
 *
 * `db/seed.ts` already seeds one `Configuration` row per Branch on
 * initial setup (`gatheringTypes: [...], churchPulseWeights: {},
 * poimenGateEnabled: false, followupSlaDefaults: {}, silentDriftConfig: {}`),
 * so `create()` here is the less-common path (a Branch provisioned some
 * other way, with no row yet) - `update()` is what a real Web Admin
 * session almost always calls.
 */
@Injectable()
export class BranchConfigurationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByBranch(branchId: string): Promise<Configuration | null> {
    return this.prisma.configuration.findUnique({ where: { branchId } });
  }

  /** Throws `ConflictException` on the `branchId` unique-constraint
   * violation (Prisma error code `P2002`) - a Branch already has exactly
   * one `Configuration` row, so a second `create()` for the same Branch
   * is a genuine duplicate, not a legitimate no-op, mirroring
   * `BankDepositConfirmationRepository.create()`'s own precedent for a
   * comparable `@@unique` constraint. `gatheringTypes`/`followupSlaDefaults`
   * are set to the same empty-placeholder defaults `db/seed.ts` already
   * uses, since this milestone doesn't expose either for editing. */
  async create(input: CreateConfigurationRecord): Promise<Configuration> {
    try {
      return await this.prisma.configuration.create({
        data: {
          branchId: input.branchId,
          gatheringTypes: [],
          churchPulseWeights: input.churchPulseWeights,
          poimenGateEnabled: input.poimenGateEnabled,
          followupSlaDefaults: {},
          silentDriftConfig: input.silentDriftConfig,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`A Configuration already exists for Branch '${input.branchId}'`);
      }
      throw error;
    }
  }

  update(branchId: string, input: UpdateConfigurationRecord): Promise<Configuration> {
    return this.prisma.configuration.update({ where: { branchId }, data: input });
  }
}
