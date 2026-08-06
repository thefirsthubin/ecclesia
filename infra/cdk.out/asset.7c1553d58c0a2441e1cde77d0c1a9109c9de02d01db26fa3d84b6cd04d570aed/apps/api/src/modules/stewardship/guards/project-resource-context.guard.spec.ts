import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { ProjectCreateResourceContextGuard, ProjectResourceContextGuard } from './project-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const actor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

describe('ProjectCreateResourceContextGuard', () => {
  it('always resolves to just the actor\'s own Branch', async () => {
    const guard = new ProjectCreateResourceContextGuard(branchConfigurationService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: actor, body: {} } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({ resource: { branchId: 'branch-1' } });
  });
});

describe('ProjectResourceContextGuard', () => {
  it('throws NotFoundException when the Project does not exist', async () => {
    const projectRepository = { findById: jest.fn().mockResolvedValue(null) };
    const guard = new ProjectResourceContextGuard(branchConfigurationService as never, projectRepository as never);
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('resolves to the Project\'s own branchId', async () => {
    const projectRepository = { findById: jest.fn().mockResolvedValue({ id: 'proj-1', branchId: 'branch-1' }) };
    const guard = new ProjectResourceContextGuard(branchConfigurationService as never, projectRepository as never);
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'proj-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({ resource: { branchId: 'branch-1' } });
  });
});
