// See public.decorator.ts's comment on why this import must come first.
import 'reflect-metadata';

import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator, InternalServerErrorException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { ACTOR_CONTEXT_KEY } from '../auth.guard';
import type { RequestWithActorContext } from '../auth.guard';

/**
 * The factory `createParamDecorator` wraps below, exported separately so
 * it can be unit-tested directly rather than only indirectly through a
 * full controller/e2e test - `createParamDecorator`'s own return value
 * isn't itself callable in a test the way a plain function is.
 *
 * Throws rather than returning `undefined` if used on a route where
 * `AuthGuard` didn't run - a controller method reaching for
 * `@CurrentActor()` is asserting authentication already happened, and
 * silently returning `undefined` would turn a missing-guard bug into a
 * confusing downstream null-reference instead of a clear error at the
 * point of the actual mistake.
 */
export function extractCurrentActor(_data: unknown, context: ExecutionContext): ActorContext {
  const request = context.switchToHttp().getRequest<RequestWithActorContext>();
  const actor = request[ACTOR_CONTEXT_KEY];
  if (!actor) {
    throw new InternalServerErrorException(
      '@CurrentActor() used on a route with no AuthGuard-populated actor context - is AuthGuard applied?',
    );
  }
  return actor;
}

/** Controller-facing accessor for the `ActorContext` `AuthGuard` attached to the request (Sprint 1.4). */
export const CurrentActor = createParamDecorator(extractCurrentActor);
