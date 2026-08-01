import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreatePledgeInput, FulfillPledgeInput, PledgeResponseDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { Pledge } from '@prisma/client';

import { FinancialTransactionRepository } from '../repositories/financial-transaction.repository';
import { PledgeRepository } from '../repositories/pledge.repository';
import { ProjectRepository } from '../repositories/project.repository';

function toResponseDto(pledge: Pledge): PledgeResponseDto {
  return {
    id: pledge.id,
    branchId: pledge.branchId,
    projectId: pledge.projectId,
    personId: pledge.personId,
    pledgedAmountMinor: pledge.pledgedAmountMinor.toString(),
    currency: pledge.currency,
    pledgedAt: pledge.pledgedAt.toISOString(),
    reminderOptIn: pledge.reminderOptIn,
    reminderSentAt: pledge.reminderSentAt ? pledge.reminderSentAt.toISOString() : null,
    fulfilledTransactionId: pledge.fulfilledTransactionId,
    createdAt: pledge.createdAt.toISOString(),
    updatedAt: pledge.updatedAt.toISOString(),
  };
}

/**
 * FR-STW-08/H2: a Pledge is the giver's commitment against a Project,
 * always created for the *acting* Person (`SELF` scope,
 * `permission-matrix.ts`'s `stewardship.pledge.create` row) - see
 * `createPledgeSchema`'s doc comment in `libs/contracts` for why there is
 * no client-supplied `personId`, the same reasoning
 * `recordFinancialTransactionSchema` already applies to `giverPersonId`.
 * `reminderOptIn` is accepted and stored (OQ-07's resolution) but this
 * milestone does not deliver the reminder itself - no scheduler exists in
 * this codebase yet. See `STEWARDSHIP_DESIGN_NOTES.md`.
 */
@Injectable()
export class PledgeService {
  constructor(
    private readonly pledgeRepository: PledgeRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly financialTransactionRepository: FinancialTransactionRepository,
  ) {}

  async create(actor: ActorContext, input: CreatePledgeInput): Promise<PledgeResponseDto> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project) {
      throw new NotFoundException(`No Project found with id '${input.projectId}'`);
    }

    const pledge = await this.pledgeRepository.create({
      branchId: project.branchId,
      projectId: input.projectId,
      personId: actor.personId,
      pledgedAmountMinor: BigInt(input.pledgedAmountMinor),
      currency: input.currency ?? 'GHS',
      reminderOptIn: input.reminderOptIn,
    });
    return toResponseDto(pledge);
  }

  async getById(id: string): Promise<PledgeResponseDto> {
    const pledge = await this.requirePledge(id);
    return toResponseDto(pledge);
  }

  /**
   * Links this Pledge to an already-recorded Financial Transaction (a
   * real payment - `recordFinancialTransactionSchema`'s own doc comment
   * on the `PLEDGE`/`DONATION` types this fulfils) - see
   * `fulfillPledgeSchema`'s doc comment for why this milestone does not
   * spell out a more elaborate linkage workflow than "reference an
   * existing transaction by id."
   */
  async fulfill(id: string, input: FulfillPledgeInput): Promise<PledgeResponseDto> {
    await this.requirePledge(id);
    const transaction = await this.financialTransactionRepository.findById(input.fulfilledTransactionId);
    if (!transaction) {
      throw new NotFoundException(`No Financial Transaction found with id '${input.fulfilledTransactionId}'`);
    }
    if (transaction.type !== 'PLEDGE' && transaction.type !== 'DONATION') {
      throw new ConflictException(
        `Financial Transaction '${input.fulfilledTransactionId}' has type '${transaction.type}', expected 'PLEDGE' or 'DONATION'`,
      );
    }
    const pledge = await this.pledgeRepository.fulfill(id, input.fulfilledTransactionId);
    return toResponseDto(pledge);
  }

  private async requirePledge(id: string): Promise<Pledge> {
    const pledge = await this.pledgeRepository.findById(id);
    if (!pledge) {
      throw new NotFoundException(`No Pledge found with id '${id}'`);
    }
    return pledge;
  }
}
