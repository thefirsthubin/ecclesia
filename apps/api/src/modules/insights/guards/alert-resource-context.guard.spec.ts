import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { AlertResourceContextGuard } from './alert-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const bacentaLeader: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'group-1' };

describe('AlertResourceContextGuard', () => {
  it('throws NotFoundException when the Alert does not exist', async () => {
    const alertRepository = { findById: jest.fn().mockResolvedValue(null) };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new AlertResourceContextGuard(branchConfigurationService as never, alertRepository as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: bacentaLeader, params: { id: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('resolves GROUP-scoped alerts via GroupScopeService', async () => {
    const alertRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'alert-1', branchId: 'branch-1', scopeType: 'GROUP', scopeId: 'group-1' }),
    };
    const groupScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'group-1' }),
    };
    const guard = new AlertResourceContextGuard(branchConfigurationService as never, alertRepository as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: bacentaLeader, params: { id: 'alert-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('group-1');
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: 'group-1' },
    });
  });

  it('resolves BRANCH-scoped alerts to { branchId } directly', async () => {
    const alertRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'alert-2', branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1' }),
    };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new AlertResourceContextGuard(branchConfigurationService as never, alertRepository as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: bacentaLeader, params: { id: 'alert-2' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).not.toHaveBeenCalled();
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1' },
    });
  });
});
