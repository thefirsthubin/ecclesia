import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import {
  PrayerNoteResourceContextGuard,
  PrayerNoteStatusResourceContextGuard,
} from './prayer-note-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
const residentPastor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

describe('[Milestone B] PrayerNoteResourceContextGuard', () => {
  it('resolves scope via PersonScopeService from the personId param', async () => {
    const personScopeService = { loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', ownerId: 'person-1' }) };
    const guard = new PrayerNoteResourceContextGuard(branchConfigurationService as never, prisma as never, personScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: residentPastor, params: { personId: 'person-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(personScopeService.loadResourceContext).toHaveBeenCalledWith('person-1', residentPastor);
  });
});

describe('[Milestone B] PrayerNoteStatusResourceContextGuard', () => {
  it('throws NotFoundException when the note does not exist', async () => {
    const prayerNoteRepository = { findById: jest.fn().mockResolvedValue(null) };
    const personScopeService = { loadResourceContext: jest.fn() };
    const guard = new PrayerNoteStatusResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      prayerNoteRepository as never,
      personScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: residentPastor, params: { id: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('resolves scope from the note\'s own subject Person', async () => {
    const prayerNoteRepository = { findById: jest.fn().mockResolvedValue({ id: 'note-1', personId: 'person-1' }) };
    const personScopeService = { loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', ownerId: 'person-1' }) };
    const guard = new PrayerNoteStatusResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      prayerNoteRepository as never,
      personScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: residentPastor, params: { id: 'note-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(personScopeService.loadResourceContext).toHaveBeenCalledWith('person-1', residentPastor);
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({ resource: { branchId: 'branch-1' } });
  });
});
