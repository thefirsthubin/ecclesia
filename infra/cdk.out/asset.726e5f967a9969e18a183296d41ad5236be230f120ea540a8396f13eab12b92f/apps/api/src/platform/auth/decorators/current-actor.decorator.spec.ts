import type { ExecutionContext } from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { extractCurrentActor } from './current-actor.decorator';
import type { RequestWithActorContext } from '../auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('extractCurrentActor', () => {
  it('returns the actor context AuthGuard attached to the request', () => {
    const actor: ActorContext = { personId: 'person-1', role: 'MEMBER', branchId: 'branch-1' };
    const context = buildContext({ actorContext: actor });

    expect(extractCurrentActor(undefined, context)).toBe(actor);
  });

  it('throws InternalServerErrorException when AuthGuard never ran', () => {
    const context = buildContext({});

    expect(() => extractCurrentActor(undefined, context)).toThrow(InternalServerErrorException);
  });
});
