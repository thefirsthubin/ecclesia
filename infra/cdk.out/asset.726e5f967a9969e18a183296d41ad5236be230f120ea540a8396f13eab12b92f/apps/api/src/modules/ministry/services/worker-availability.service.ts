import { Injectable } from '@nestjs/common';
import type { RecordWorkerAvailabilityInput, WorkerAvailabilityResponseDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { WorkerAvailability } from '@prisma/client';

import { WorkerAvailabilityRepository } from '../repositories/worker-availability.repository';

function toResponseDto(availability: WorkerAvailability): WorkerAvailabilityResponseDto {
  return {
    id: availability.id,
    branchId: availability.branchId,
    personId: availability.personId,
    unavailableFrom: availability.unavailableFrom.toISOString().slice(0, 10),
    unavailableTo: availability.unavailableTo.toISOString().slice(0, 10),
    reason: availability.reason,
    createdAt: availability.createdAt.toISOString(),
  };
}

/**
 * §16.3 H2's "Worker availability self-service" surface - always the
 * *acting* Person's own window (`SELF` scope,
 * `permission-matrix.ts`'s `ministry.worker_availability.*` rows), never
 * a client-supplied `personId`, the same reasoning
 * `createPledgeSchema`/`recordFinancialTransactionSchema` already apply
 * to their own SELF-scoped fields.
 */
@Injectable()
export class WorkerAvailabilityService {
  constructor(private readonly workerAvailabilityRepository: WorkerAvailabilityRepository) {}

  async create(actor: ActorContext, input: RecordWorkerAvailabilityInput): Promise<WorkerAvailabilityResponseDto> {
    const availability = await this.workerAvailabilityRepository.create({
      branchId: actor.branchId,
      personId: actor.personId,
      unavailableFrom: new Date(input.unavailableFrom),
      unavailableTo: new Date(input.unavailableTo),
      reason: input.reason,
    });
    return toResponseDto(availability);
  }

  async listForActor(actor: ActorContext): Promise<WorkerAvailabilityResponseDto[]> {
    const list = await this.workerAvailabilityRepository.listByPerson(actor.personId);
    return list.map(toResponseDto);
  }
}
