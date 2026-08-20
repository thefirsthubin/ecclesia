import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { BranchListResourceContextGuard } from './branch-list-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('BranchListResourceContextGuard', () => {
  it("resolves the resource as the actor's own Branch, never a client-supplied branchId", async () => {
    const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const guard = new BranchListResourceContextGuard(branchConfigurationService as never, prisma as never);
    const actor: ActorContext = { personId: 'overseer-1', role: 'COUNCIL_OVERSEER', branchId: 'branch-1', councilBranchIds: ['branch-1', 'branch-2'] };
    const request: Partial<RequestWithActorContext> = {
      actorContext: actor,
      query: { branchId: 'attacker-branch' },
    } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1' },
    });
  });
});
