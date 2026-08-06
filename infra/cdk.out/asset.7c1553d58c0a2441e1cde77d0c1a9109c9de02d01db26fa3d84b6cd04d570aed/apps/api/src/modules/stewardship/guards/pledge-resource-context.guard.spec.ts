import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { PledgeCreateResourceContextGuard, PledgeResourceContextGuard } from './pledge-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const member: ActorContext = { personId: 'member-1', role: 'MEMBER', branchId: 'branch-1' };

describe('PledgeCreateResourceContextGuard', () => {
  it('resolves to { branchId, ownerId: actor.personId } (SELF scope)', async () => {
    const guard = new PledgeCreateResourceContextGuard(branchConfigurationService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: member, body: {} } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', ownerId: 'member-1' },
    });
  });
});

describe('PledgeResourceContextGuard', () => {
  it('throws NotFoundException when the Pledge does not exist', async () => {
    const pledgeRepository = { findById: jest.fn().mockResolvedValue(null) };
    const guard = new PledgeResourceContextGuard(branchConfigurationService as never, pledgeRepository as never);
    const request: Partial<RequestWithActorContext> = { actorContext: member, params: { id: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('resolves to { branchId, ownerId: pledge.personId }', async () => {
    const pledgeRepository = { findById: jest.fn().mockResolvedValue({ id: 'pledge-1', branchId: 'branch-1', personId: 'member-1' }) };
    const guard = new PledgeResourceContextGuard(branchConfigurationService as never, pledgeRepository as never);
    const request: Partial<RequestWithActorContext> = { actorContext: member, params: { id: 'pledge-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', ownerId: 'member-1' },
    });
  });
});
