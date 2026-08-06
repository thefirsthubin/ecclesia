import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';

import { BranchScopeInterceptor } from './branch-scope.interceptor';
import { ACTOR_CONTEXT_KEY } from '../auth/auth.guard';
import type { RequestWithActorContext } from '../auth/auth.guard';

function buildContext(request: RequestWithActorContext): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function buildCallHandler(response: unknown): CallHandler {
  return { handle: () => of(response) } as CallHandler;
}

describe('BranchScopeInterceptor', () => {
  it('is a no-op (does not touch prisma) when request.actorContext is absent - the @Public() route case', async () => {
    const prisma = { runInBranchScope: jest.fn() };
    const interceptor = new BranchScopeInterceptor(prisma as never);
    const request = {} as RequestWithActorContext;
    const handler = buildCallHandler({ ok: true });

    const result = await firstValueFrom(interceptor.intercept(buildContext(request), handler));

    expect(result).toEqual({ ok: true });
    expect(prisma.runInBranchScope).not.toHaveBeenCalled();
  });

  it('wraps the handler in runInBranchScope(actor.branchId, ...) when an ActorContext is present', async () => {
    const prisma = {
      runInBranchScope: jest.fn((_branchId: string, fn: () => Promise<unknown>) => fn()),
    };
    const interceptor = new BranchScopeInterceptor(prisma as never);
    const request = {
      [ACTOR_CONTEXT_KEY]: { personId: 'person-1', role: 'MEMBER', branchId: '22222222-2222-2222-2222-222222222222' },
    } as RequestWithActorContext;
    const handler = buildCallHandler({ ok: true });

    const result = await firstValueFrom(interceptor.intercept(buildContext(request), handler));

    expect(result).toEqual({ ok: true });
    expect(prisma.runInBranchScope).toHaveBeenCalledTimes(1);
    expect(prisma.runInBranchScope).toHaveBeenCalledWith('22222222-2222-2222-2222-222222222222', expect.any(Function));
  });

  it('propagates a rejection from runInBranchScope (e.g. the handler threw) as the returned Observable erroring', async () => {
    const prisma = { runInBranchScope: jest.fn().mockRejectedValue(new Error('handler failed')) };
    const interceptor = new BranchScopeInterceptor(prisma as never);
    const request = {
      [ACTOR_CONTEXT_KEY]: { personId: 'person-1', role: 'MEMBER', branchId: '22222222-2222-2222-2222-222222222222' },
    } as RequestWithActorContext;
    const handler = buildCallHandler({ ok: true });

    await expect(firstValueFrom(interceptor.intercept(buildContext(request), handler))).rejects.toThrow('handler failed');
  });
});
