import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { ExpenseCreateResourceContextGuard, ExpenseResourceContextGuard } from './expense-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const actor: ActorContext = { personId: 'requester-1', role: 'BACENTA_LEADER', branchId: 'branch-1' };

describe('ExpenseCreateResourceContextGuard', () => {
  it('resolves scope from the acting Person via PersonScopeService', async () => {
    const personScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }),
    };
    const guard = new ExpenseCreateResourceContextGuard(branchConfigurationService as never, personScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: actor, body: {} } as never;

    await guard.canActivate(buildContext(request));

    expect(personScopeService.loadResourceContext).toHaveBeenCalledWith('requester-1', actor);
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: 'bacenta-1' },
    });
  });
});

describe('ExpenseResourceContextGuard', () => {
  it('throws NotFoundException when the Expense does not exist', async () => {
    const expenseRepository = { findById: jest.fn().mockResolvedValue(null) };
    const personScopeService = { loadResourceContext: jest.fn() };
    const guard = new ExpenseResourceContextGuard(
      branchConfigurationService as never,
      expenseRepository as never,
      personScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('resolves scope from the requester Person and sets recordedByPersonId to that same requester (for FR-STW-09 reuse)', async () => {
    const expenseRepository = { findById: jest.fn().mockResolvedValue({ id: 'exp-1', requestedByPersonId: 'requester-1' }) };
    const personScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1', ownerId: 'requester-1' }),
    };
    const guard = new ExpenseResourceContextGuard(
      branchConfigurationService as never,
      expenseRepository as never,
      personScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'exp-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(personScopeService.loadResourceContext).toHaveBeenCalledWith('requester-1', actor);
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: 'bacenta-1', recordedByPersonId: 'requester-1' },
    });
  });
});
