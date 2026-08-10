import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { WorkerAvailabilityResourceContextGuard } from './worker-availability-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
const worker: ActorContext = { personId: 'person-1', role: 'WORKER', branchId: 'branch-1' };

describe('WorkerAvailabilityResourceContextGuard', () => {
  it('resolves to { branchId, ownerId: actor.personId } (SELF scope)', async () => {
    const guard = new WorkerAvailabilityResourceContextGuard(branchConfigurationService as never, prisma as never);
    const request: Partial<RequestWithActorContext> = { actorContext: worker } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', ownerId: 'person-1' },
    });
  });
});
