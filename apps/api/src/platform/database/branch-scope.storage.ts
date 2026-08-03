import { AsyncLocalStorage } from 'node:async_hooks';
import type { Prisma } from '@prisma/client';

/**
 * `[Row-Level Security sprint]` The async-context cell `PrismaService`
 * consults on every model-delegate property read (`.person`, `.gathering`,
 * ...) to decide whether a branch-scoped transaction is currently active.
 * See `db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md` §3 for the full mechanism
 * and why this is `Object.defineProperty`-based rather than a `Proxy`
 * wrapping the whole `PrismaClient` instance (a real Proxy/private-class-
 * field interaction risk with recent Prisma Client internals, not merely
 * a style preference).
 *
 * `node:async_hooks`'s `AsyncLocalStorage` - no new dependency (this
 * sandbox has no package-registry access; `AsyncLocalStorage` has shipped
 * in Node's standard library since 12.17), the same "hand-build what's
 * needed, no network access to add a library" pattern already used for
 * `apps/mobile`'s navigator and `apps/web-admin`'s router/Cognito client.
 *
 * A module-level singleton, not a class field on `PrismaService` itself,
 * so `runInBranchScope`'s `branchScopeStorage.run(tx, fn)` call and every
 * model-delegate getter's `branchScopeStorage.getStore()` read are
 * guaranteed to be looking at the exact same storage cell regardless of
 * how many times NestJS's DI container might otherwise be tempted to
 * construct `PrismaService` (it doesn't, in practice - it's a normal
 * singleton-scoped provider - but this removes any doubt).
 */
export const branchScopeStorage = new AsyncLocalStorage<Prisma.TransactionClient>();
