import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import {
  FinancialTransactionCreateResourceContextGuard,
  FinancialTransactionListResourceContextGuard,
  FinancialTransactionResourceContextGuard,
} from './financial-transaction-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
const treasurer: ActorContext = { personId: 'treasurer-1', role: 'TREASURER', branchId: 'branch-1' };

describe('FinancialTransactionCreateResourceContextGuard', () => {
  it('resolves scope via GroupScopeService when the body names a sourceGroupId', async () => {
    const groupScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }),
    };
    const guard = new FinancialTransactionCreateResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: treasurer, body: { sourceGroupId: 'bacenta-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
  });

  it('falls back to { branchId, ownerId: actor.personId } for an individual entry (no sourceGroupId)', async () => {
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new FinancialTransactionCreateResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: treasurer, body: {} } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).not.toHaveBeenCalled();
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', ownerId: 'treasurer-1' },
    });
  });
});

describe('FinancialTransactionResourceContextGuard', () => {
  it('throws NotFoundException when the transaction does not exist', async () => {
    const financialTransactionRepository = { findById: jest.fn().mockResolvedValue(null) };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new FinancialTransactionResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      financialTransactionRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: treasurer, params: { id: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('resolves scope via GroupScopeService and always attaches recordedByPersonId', async () => {
    const financialTransactionRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'ft-1', sourceGroupId: 'bacenta-1', giverPersonId: null, branchId: 'branch-1' }),
      findRecordedByPersonId: jest.fn().mockResolvedValue('bl-1'),
    };
    const groupScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }),
    };
    const guard = new FinancialTransactionResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      financialTransactionRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: treasurer, params: { id: 'ft-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: 'bacenta-1', recordedByPersonId: 'bl-1' },
    });
  });

  it('resolves to { branchId, ownerId: giverPersonId } for an individually-given transaction', async () => {
    const financialTransactionRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'ft-1', sourceGroupId: null, giverPersonId: 'member-1', branchId: 'branch-1' }),
      findRecordedByPersonId: jest.fn().mockResolvedValue('member-1'),
    };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new FinancialTransactionResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      financialTransactionRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: treasurer, params: { id: 'ft-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', ownerId: 'member-1', recordedByPersonId: 'member-1' },
    });
  });
});

describe('FinancialTransactionListResourceContextGuard', () => {
  it('always resolves to just the actor\'s own Branch', async () => {
    const guard = new FinancialTransactionListResourceContextGuard(branchConfigurationService as never, prisma as never);
    const request: Partial<RequestWithActorContext> = { actorContext: treasurer, query: {} } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1' },
    });
  });
});
