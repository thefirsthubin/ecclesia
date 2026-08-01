import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { RosterResourceContextGuard } from './roster-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const basontaLeader: ActorContext = { personId: 'leader-1', role: 'BASONTA_LEADER', branchId: 'branch-1', basontaId: 'basonta-1' };

describe('RosterResourceContextGuard', () => {
  it('delegates to GroupScopeService.loadResourceContext(params.groupId)', async () => {
    const groupScopeService = { loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', basontaId: 'basonta-1' }) };
    const guard = new RosterResourceContextGuard(branchConfigurationService as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: basontaLeader, params: { groupId: 'basonta-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('basonta-1');
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', basontaId: 'basonta-1' },
    });
  });
});
