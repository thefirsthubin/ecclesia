import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { TenantListResourceContextGuard } from './tenant-list-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('[Post-Milestone D — Portal Experiences follow-up] TenantListResourceContextGuard', () => {
  it("resolves the resource as the actor's own Branch - authorization-irrelevant for a GLOBAL-scoped action, but ResourceContext.branchId is a required field", async () => {
    const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const guard = new TenantListResourceContextGuard(branchConfigurationService as never, prisma as never);
    const actor: ActorContext = { personId: 'sysadmin-1', role: 'SYSTEM_ADMINISTRATOR', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1' },
    });
  });
});
