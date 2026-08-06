import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { EcclesiaContextGuardBase } from './ecclesia-context.guard-base';
import type { BranchConfigurationService } from './branch-configuration.service';
import type { RequestWithActorContext } from '../auth/auth.guard';

class TestResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly resource: ResourceContext,
  ) {
    super(branchConfigurationService);
  }

  protected async loadResource(): Promise<ResourceContext> {
    return this.resource;
  }
}

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('EcclesiaContextGuardBase', () => {
  const actor: ActorContext = { personId: 'person-1', role: 'ADMIN', branchId: 'branch-1' };
  const resource: ResourceContext = { branchId: 'branch-1', ownerId: 'person-2' };

  it('attaches an EcclesiaRequestContext built from actorContext, the loaded resource, and branchConfig', async () => {
    const branchConfigurationService = {
      loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: true }),
    };
    const guard = new TestResourceContextGuard(branchConfigurationService as never, resource);
    const request: Partial<RequestWithActorContext> = { actorContext: actor };
    const context = buildContext(request);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(branchConfigurationService.loadForBranch).toHaveBeenCalledWith('branch-1');
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toEqual({
      actor,
      resource,
      branchConfig: { poimenGateEnabled: true },
    });
  });

  it('throws ForbiddenException when actorContext is missing (AuthGuard did not run)', async () => {
    const branchConfigurationService = { loadForBranch: jest.fn() };
    const guard = new TestResourceContextGuard(branchConfigurationService as never, resource);
    const context = buildContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(branchConfigurationService.loadForBranch).not.toHaveBeenCalled();
  });
});
